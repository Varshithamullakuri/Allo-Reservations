import { z } from "zod";

export const idParamSchema = z.string().uuid();

export const createReservationSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int().positive().max(999)
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
