import { handleRouteError, ok } from "@/lib/api-response";
import { idParamSchema } from "@/schemas/reservation.schema";
import { confirmReservation } from "@/services/reservation.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const reservationId = idParamSchema.parse(id);
    const reservation = await confirmReservation(reservationId);

    return ok(reservation);
  } catch (error) {
    return handleRouteError(error);
  }
}
