import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    sku: "IPHONE-15-128-BLK",
    name: "iPhone 15",
    description: "A fast everyday phone with a bright display and reliable battery life."
  },
  {
    sku: "MBP-14-M3-PRO",
    name: "MacBook Pro",
    description: "A portable workstation for engineering, design, and creative production."
  },
  {
    sku: "AIRPODS-PRO-2",
    name: "AirPods",
    description: "Wireless earbuds with active noise cancellation and adaptive audio."
  }
];

const warehouses = [
  { name: "Chennai Fulfillment Center", city: "Chennai" },
  { name: "Bangalore Fulfillment Center", city: "Bangalore" },
  { name: "Hyderabad Fulfillment Center", city: "Hyderabad" }
];

const stockMatrix: Record<string, Record<string, number>> = {
  "IPHONE-15-128-BLK": {
    Chennai: 10,
    Bangalore: 5,
    Hyderabad: 8
  },
  "MBP-14-M3-PRO": {
    Chennai: 4,
    Bangalore: 3,
    Hyderabad: 2
  },
  "AIRPODS-PRO-2": {
    Chennai: 25,
    Bangalore: 18,
    Hyderabad: 14
  }
};

async function main() {
  const productRecords = await Promise.all(
    products.map((product) =>
      prisma.product.upsert({
        where: { sku: product.sku },
        update: {
          name: product.name,
          description: product.description
        },
        create: product
      })
    )
  );

  const warehouseRecords = await Promise.all(
    warehouses.map((warehouse) =>
      prisma.warehouse.upsert({
        where: {
          name_city: {
            name: warehouse.name,
            city: warehouse.city
          }
        },
        update: warehouse,
        create: warehouse
      })
    )
  );

  for (const product of productRecords) {
    for (const warehouse of warehouseRecords) {
      const totalStock = stockMatrix[product.sku]?.[warehouse.city] ?? 0;

      await prisma.inventory.upsert({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId: warehouse.id
          }
        },
        update: {},
        create: {
          productId: product.id,
          warehouseId: warehouse.id,
          totalStock,
          reservedStock: 0
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
