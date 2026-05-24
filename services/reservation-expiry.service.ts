import type { Prisma } from "@prisma/client";

import { EXPIRY_BATCH_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { ExpiryJobResultDTO } from "@/types/api";

type ExpiredReservationRow = {
  id: string;
};

export async function expirePendingReservations(
  limit = EXPIRY_BATCH_SIZE
): Promise<ExpiryJobResultDTO> {
  return prisma.$transaction((tx) => expirePendingReservationsTx(tx, limit), {
    maxWait: 5_000,
    timeout: 10_000
  });
}

export async function expirePendingReservationsTx(
  tx: Prisma.TransactionClient,
  limit = EXPIRY_BATCH_SIZE
): Promise<ExpiryJobResultDTO> {
  const rows = await tx.$queryRaw<ExpiredReservationRow[]>`
    WITH expired AS (
      SELECT id, product_id, warehouse_id, quantity
      FROM reservations
      WHERE status = 'PENDING'::reservation_status
        AND expires_at <= NOW()
      ORDER BY expires_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    ),
    totals AS (
      SELECT product_id, warehouse_id, SUM(quantity)::integer AS quantity
      FROM expired
      GROUP BY product_id, warehouse_id
    ),
    updated_inventory AS (
      UPDATE inventory AS inventory
      SET reserved_stock = GREATEST(inventory.reserved_stock - totals.quantity, 0),
          updated_at = NOW()
      FROM totals
      WHERE inventory.product_id = totals.product_id
        AND inventory.warehouse_id = totals.warehouse_id
      RETURNING inventory.id
    )
    UPDATE reservations AS reservation
    SET status = 'EXPIRED'::reservation_status,
        updated_at = NOW()
    FROM expired
    WHERE reservation.id = expired.id
    RETURNING reservation.id
  `;

  return {
    expiredCount: rows.length,
    reservationIds: rows.map((row) => row.id)
  };
}
