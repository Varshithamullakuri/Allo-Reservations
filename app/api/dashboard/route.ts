import { handleRouteError, ok } from "@/lib/api-response";
import { getDashboardSnapshot } from "@/services/analytics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getDashboardSnapshot();
    return ok(snapshot);
  } catch (error) {
    return handleRouteError(error);
  }
}
