import { expirePendingReservations } from "@/services/reservation-expiry.service";
import { prisma } from "@/lib/prisma";

async function main() {
  const result = await expirePendingReservations();
  console.log(
    `Expired ${result.expiredCount} reservation(s): ${result.reservationIds.join(
      ", "
    )}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
