import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { toProductDTO } from "@/services/mappers";
import { expirePendingReservations } from "@/services/reservation-expiry.service";
import type { ProductWithInventoryDTO } from "@/types/api";

const productInclude = {
  inventories: {
    include: {
      warehouse: true
    },
    orderBy: {
      warehouseId: "asc" as const
    }
  }
};

export async function listProducts(): Promise<ProductWithInventoryDTO[]> {
  await expirePendingReservations();

  const products = await prisma.product.findMany({
    include: productInclude,
    orderBy: {
      name: "asc"
    }
  });

  return products.map(toProductDTO);
}

export async function getProductById(
  id: string
): Promise<ProductWithInventoryDTO> {
  await expirePendingReservations();

  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude
  });

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  return toProductDTO(product);
}
