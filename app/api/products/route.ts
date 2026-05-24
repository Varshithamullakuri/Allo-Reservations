import { handleRouteError, ok } from "@/lib/api-response";
import { listProducts } from "@/services/product.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await listProducts();
    return ok(products);
  } catch (error) {
    return handleRouteError(error);
  }
}
