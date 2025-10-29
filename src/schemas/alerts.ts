import { z } from "zod";

export const AlertsQuerySchema = z.object({
	days: z.coerce.number().int().min(1).max(365).optional(),
	minutes: z.coerce.number().int().min(1).max(120).optional(),
	offsetMinutes: z.coerce.number().int().min(-720).max(720).optional(),
	include: z.string().optional(),
});

export const AlertsDueResponseSchema = z.object({
	birthdays: z
		.array(
			z.object({
				pet_id: z.string(),
				pet_name: z.string(),
				at: z.string(),
			}),
		)
		.optional(),
	vaccines: z
		.array(
			z.object({
				id: z.string().optional(),
				pet_id: z.string(),
				pet_name: z.string().optional(),
				vaccine_name: z.string(),
				next_dose_at: z.string(),
			}),
		)
		.optional(),
	glycemia: z
		.array(
			z.object({
				session_id: z.string(),
				idx: z.number().int(),
				expected_at: z.string(),
				pet_id: z.string(),
				pet_name: z.string().optional(),
			}),
		)
		.optional(),
	treatments: z
		.array(
			z.object({
				id: z.string(),
				pet_id: z.string(),
				pet_name: z.string().optional(),
				next_due_at: z.string(),
				type: z.string(),
				type_label: z.string().optional().nullable(),
				product_name: z.string().optional().nullable(),
			}),
		)
		.optional(),
});
