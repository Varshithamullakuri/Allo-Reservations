import { handleRouteError, ok } from "@/lib/api-response";
import { expirePendingReservations } from "@/services/reservation-expiry.service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await expirePendingReservations();
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
