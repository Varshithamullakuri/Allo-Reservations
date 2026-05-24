import { listProducts } from "@/services/product.service";
import { listReservations } from "@/services/reservation.service";

export async function getDashboardSnapshot() {
  const [products, reservations] = await Promise.all([
    listProducts(),
    listReservations(50)
  ]);

  const warehouseIds = new Set<string>();
  let totalStock = 0;
  let reservedStock = 0;
  let availableStock = 0;

  for (const product of products) {
    for (const inventory of product.inventories) {
      warehouseIds.add(inventory.warehouseId);
      totalStock += inventory.totalStock;
      reservedStock += inventory.reservedStock;
      availableStock += inventory.availableStock;
    }
  }

  return {
    products,
    reservations,
    metrics: {
      productCount: products.length,
      warehouseCount: warehouseIds.size,
      totalStock,
      reservedStock,
      availableStock,
      pendingReservations: reservations.filter(
        (reservation) => reservation.status === "PENDING"
      ).length
    }
  };
}
