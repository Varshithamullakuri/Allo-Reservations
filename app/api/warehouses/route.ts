import { handleRouteError, ok } from "@/lib/api-response";
import { listWarehouses } from "@/services/warehouse.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const warehouses = await listWarehouses();
    return ok(warehouses);
  } catch (error) {
    return handleRouteError(error);
  }
}
