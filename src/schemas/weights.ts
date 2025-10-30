import { z } from "zod";

export const WeightCreateBodySchema = z.object({
	weightKg: z.number().nonnegative(),
	measuredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const WeightSchema = z.object({
	id: z.string(),
	pet_id: z.string(),
	measured_at: z.string(),
	weight_kg: z.number(),
});
