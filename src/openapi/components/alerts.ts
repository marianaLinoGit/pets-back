import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { AlertsQuerySchema } from "../../schemas";

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
});

export function registerComponentsAlerts(registry: OpenAPIRegistry) {
	registry.register("AlertsQuery", AlertsQuerySchema);
	registry.register("AlertsDueResponse", AlertsDueResponseSchema);
}
