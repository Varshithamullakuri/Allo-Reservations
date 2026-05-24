export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "RELEASED"
  | "EXPIRED";

export type ApiSuccess<T> = {
  data: T;
};

export type ApiFailure = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type WarehouseInventoryDTO = {
  inventoryId: string;
  warehouseId: string;
  warehouseName: string;
  city: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
};

export type ProductWithInventoryDTO = {
  id: string;
  name: string;
  description: string;
  sku: string;
  createdAt: string;
  updatedAt: string;
  inventories: WarehouseInventoryDTO[];
};

export type ReservationDTO = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  warehouse: {
    id: string;
    name: string;
    city: string;
  };
};

export type ExpiryJobResultDTO = {
  expiredCount: number;
  reservationIds: string[];
};

export type DashboardSnapshotDTO = {
  products: ProductWithInventoryDTO[];
  reservations: ReservationDTO[];
  metrics: {
    productCount: number;
    warehouseCount: number;
    totalStock: number;
    reservedStock: number;
    availableStock: number;
    pendingReservations: number;
  };
};
