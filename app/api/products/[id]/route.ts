import { handleRouteError, ok } from "@/lib/api-response";
import { productIdSchema } from "@/schemas/product.schema";
import { getProductById } from "@/services/product.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const productId = productIdSchema.parse(id);
    const product = await getProductById(productId);

    return ok(product);
  } catch (error) {
    return handleRouteError(error);
  }
}
