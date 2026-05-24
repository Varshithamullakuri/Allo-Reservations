import type { Inventory, Product, Reservation, Warehouse } from "@prisma/client";

import type {
  ProductWithInventoryDTO,
  ReservationDTO,
  WarehouseInventoryDTO
} from "@/types/api";

export type ProductWithInventoryRecord = Product & {
  inventories: Array<Inventory & { warehouse: Warehouse }>;
};

export type ReservationWithRelationsRecord = Reservation & {
  product: Pick<Product, "id" | "name" | "sku">;
  warehouse: Pick<Warehouse, "id" | "name" | "city">;
};

export function toWarehouseInventoryDTO(
  inventory: Inventory & { warehouse: Warehouse }
): WarehouseInventoryDTO {
  return {
    inventoryId: inventory.id,
    warehouseId: inventory.warehouseId,
    warehouseName: inventory.warehouse.name,
    city: inventory.warehouse.city,
    totalStock: inventory.totalStock,
    reservedStock: inventory.reservedStock,
    availableStock: inventory.totalStock - inventory.reservedStock
  };
}

export function toProductDTO(
  product: ProductWithInventoryRecord
): ProductWithInventoryDTO {
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    sku: product.sku,
    createdAt: product.createdAt.toISOString(),
    updatedAt: (product.updatedAt ?? product.createdAt).toISOString(),
    inventories: product.inventories.map(toWarehouseInventoryDTO)
  };
}

export function toReservationDTO(
  reservation: ReservationWithRelationsRecord
): ReservationDTO {
  return {
    id: reservation.id,
    productId: reservation.productId,
    warehouseId: reservation.warehouseId,
    quantity: reservation.quantity,
    status: reservation.status,
    expiresAt: reservation.expiresAt.toISOString(),
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
    product: {
      id: reservation.product.id,
      name: reservation.product.name,
      sku: reservation.product.sku
    },
    warehouse: {
      id: reservation.warehouse.id,
      name: reservation.warehouse.name,
      city: reservation.warehouse.city
    }
  };
}
