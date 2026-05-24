import { created, handleRouteError, ok } from "@/lib/api-response";
import { createReservationSchema } from "@/schemas/reservation.schema";
import {
  createReservation,
  listReservations
} from "@/services/reservation.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reservations = await listReservations(50);
    return ok(reservations);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const input = createReservationSchema.parse(payload);
    const reservation = await createReservation(input);

    return created(reservation);
  } catch (error) {
    return handleRouteError(error);
  }
}
