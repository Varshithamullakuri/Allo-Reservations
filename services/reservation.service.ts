import { Prisma, ReservationStatus as PrismaReservationStatus } from "@prisma/client";

import { RESERVATION_TTL_MS } from "@/lib/constants";
import {
  ConflictError,
  InsufficientStockError,
  NotFoundError,
  ReservationExpiredError,
  ReservationNotPendingError
} from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { CreateReservationInput } from "@/schemas/reservation.schema";
import {
  toReservationDTO,
  type ReservationWithRelationsRecord
} from "@/services/mappers";
import { expirePendingReservations } from "@/services/reservation-expiry.service";
import type { ReservationDTO } from "@/types/api";

const reservationInclude = {
  product: {
    select: {
      id: true,
      name: true,
      sku: true
    }
  },
  warehouse: {
    select: {
      id: true,
      name: true,
      city: true
    }
  }
} satisfies Prisma.ReservationInclude;

type LockedInventoryRow = {
  id: string;
  total_stock: number;
  reserved_stock: number;
};

type LockedReservationRow = {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  status: PrismaReservationStatus;
  expires_at: Date;
};

async function lockInventoryRow(
  tx: Prisma.TransactionClient,
  productId: string,
  warehouseId: string
) {
  const rows = await tx.$queryRaw<LockedInventoryRow[]>`
    SELECT id, total_stock, reserved_stock
    FROM inventory
    WHERE product_id = ${productId}::uuid
      AND warehouse_id = ${warehouseId}::uuid
    FOR UPDATE
  `;

  return rows[0] ?? null;
}

async function lockReservationRow(tx: Prisma.TransactionClient, id: string) {
  const rows = await tx.$queryRaw<LockedReservationRow[]>`
    SELECT id, product_id, warehouse_id, quantity, status, expires_at
    FROM reservations
    WHERE id = ${id}::uuid
    FOR UPDATE
  `;

  return rows[0] ?? null;
}

async function getReservationRecord(
  tx: Prisma.TransactionClient,
  id: string
) {
  return tx.reservation.findUnique({
    where: { id },
    include: reservationInclude
  });
}

async function decrementReservedStock(
  tx: Prisma.TransactionClient,
  productId: string,
  warehouseId: string,
  quantity: number
) {
  const inventory = await lockInventoryRow(tx, productId, warehouseId);

  if (!inventory) {
    throw new NotFoundError("Inventory row not found");
  }

  if (inventory.reserved_stock < quantity) {
    throw new ConflictError("Reserved stock is lower than reservation quantity");
  }

  await tx.inventory.update({
    where: {
      id: inventory.id
    },
    data: {
      reservedStock: {
        decrement: quantity
      }
    }
  });
}

async function expireLockedReservation(
  tx: Prisma.TransactionClient,
  reservation: LockedReservationRow
) {
  await decrementReservedStock(
    tx,
    reservation.product_id,
    reservation.warehouse_id,
    reservation.quantity
  );

  return tx.reservation.update({
    where: {
      id: reservation.id
    },
    data: {
      status: PrismaReservationStatus.EXPIRED
    },
    include: reservationInclude
  });
}

export async function createReservation(
  input: CreateReservationInput
): Promise<ReservationDTO> {
  await expirePendingReservations();

  const reservation = await prisma.$transaction(
    async (tx) => {
      const inventory = await lockInventoryRow(
        tx,
        input.productId,
        input.warehouseId
      );

      if (!inventory) {
        throw new NotFoundError("Inventory row not found for product and warehouse");
      }

      const availableStock = inventory.total_stock - inventory.reserved_stock;

      if (availableStock < input.quantity) {
        throw new InsufficientStockError("Insufficient available stock", {
          requestedQuantity: input.quantity,
          availableStock
        });
      }

      await tx.inventory.update({
        where: {
          id: inventory.id
        },
        data: {
          reservedStock: {
            increment: input.quantity
          }
        }
      });

      return tx.reservation.create({
        data: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          quantity: input.quantity,
          expiresAt: new Date(Date.now() + RESERVATION_TTL_MS)
        },
        include: reservationInclude
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 5_000,
      timeout: 10_000
    }
  );

  return toReservationDTO(reservation);
}

export async function getReservationById(id: string): Promise<ReservationDTO> {
  await expirePendingReservations();

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: reservationInclude
  });

  if (!reservation) {
    throw new NotFoundError("Reservation not found");
  }

  return toReservationDTO(reservation);
}

export async function listReservations(limit = 25): Promise<ReservationDTO[]> {
  await expirePendingReservations();

  const reservations = await prisma.reservation.findMany({
    take: limit,
    include: reservationInclude,
    orderBy: {
      createdAt: "desc"
    }
  });

  return reservations.map(toReservationDTO);
}

export async function confirmReservation(id: string): Promise<ReservationDTO> {
  const result = await prisma.$transaction(
    async (tx) => {
      const lockedReservation = await lockReservationRow(tx, id);

      if (!lockedReservation) {
        throw new NotFoundError("Reservation not found");
      }

      if (lockedReservation.status === PrismaReservationStatus.CONFIRMED) {
        const reservation = await getReservationRecord(tx, id);

        if (!reservation) {
          throw new NotFoundError("Reservation not found");
        }

        return {
          outcome: "confirmed" as const,
          reservation
        };
      }

      if (lockedReservation.status !== PrismaReservationStatus.PENDING) {
        throw new ReservationNotPendingError(
          `Reservation is already ${lockedReservation.status.toLowerCase()}`
        );
      }

      if (lockedReservation.expires_at <= new Date()) {
        const reservation = await expireLockedReservation(tx, lockedReservation);

        return {
          outcome: "expired" as const,
          reservation
        };
      }

      const inventory = await lockInventoryRow(
        tx,
        lockedReservation.product_id,
        lockedReservation.warehouse_id
      );

      if (!inventory) {
        throw new NotFoundError("Inventory row not found");
      }

      if (
        inventory.reserved_stock < lockedReservation.quantity ||
        inventory.total_stock < lockedReservation.quantity
      ) {
        throw new ConflictError("Inventory state cannot confirm this reservation");
      }

      await tx.inventory.update({
        where: {
          id: inventory.id
        },
        data: {
          totalStock: {
            decrement: lockedReservation.quantity
          },
          reservedStock: {
            decrement: lockedReservation.quantity
          }
        }
      });

      const reservation = await tx.reservation.update({
        where: {
          id
        },
        data: {
          status: PrismaReservationStatus.CONFIRMED
        },
        include: reservationInclude
      });

      return {
        outcome: "confirmed" as const,
        reservation
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 5_000,
      timeout: 10_000
    }
  );

  if (result.outcome === "expired") {
    throw new ReservationExpiredError();
  }

  return toReservationDTO(result.reservation as ReservationWithRelationsRecord);
}

export async function releaseReservation(id: string): Promise<ReservationDTO> {
  const result = await prisma.$transaction(
    async (tx) => {
      const lockedReservation = await lockReservationRow(tx, id);

      if (!lockedReservation) {
        throw new NotFoundError("Reservation not found");
      }

      if (lockedReservation.status === PrismaReservationStatus.RELEASED) {
        const reservation = await getReservationRecord(tx, id);

        if (!reservation) {
          throw new NotFoundError("Reservation not found");
        }

        return {
          outcome: "released" as const,
          reservation
        };
      }

      if (lockedReservation.status === PrismaReservationStatus.EXPIRED) {
        const reservation = await getReservationRecord(tx, id);

        if (!reservation) {
          throw new NotFoundError("Reservation not found");
        }

        return {
          outcome: "expired" as const,
          reservation
        };
      }

      if (lockedReservation.status !== PrismaReservationStatus.PENDING) {
        throw new ReservationNotPendingError(
          `Reservation is already ${lockedReservation.status.toLowerCase()}`
        );
      }

      if (lockedReservation.expires_at <= new Date()) {
        const reservation = await expireLockedReservation(tx, lockedReservation);

        return {
          outcome: "expired" as const,
          reservation
        };
      }

      await decrementReservedStock(
        tx,
        lockedReservation.product_id,
        lockedReservation.warehouse_id,
        lockedReservation.quantity
      );

      const reservation = await tx.reservation.update({
        where: {
          id
        },
        data: {
          status: PrismaReservationStatus.RELEASED
        },
        include: reservationInclude
      });

      return {
        outcome: "released" as const,
        reservation
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 5_000,
      timeout: 10_000
    }
  );

  if (result.outcome === "expired") {
    throw new ReservationExpiredError();
  }

  return toReservationDTO(result.reservation as ReservationWithRelationsRecord);
}
