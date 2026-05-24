import { prisma } from "@/lib/prisma";

export async function listWarehouses() {
  return prisma.warehouse.findMany({
    orderBy: {
      city: "asc"
    }
  });
}
