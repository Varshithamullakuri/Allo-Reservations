import { z } from "zod";

export const productIdSchema = z.string().uuid();
