import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../lib/z";
import { TreatmentCreateSchema } from "../../schemas";

export const TreatmentSchema = z.object({
	id: z.string(),
	pet_id: z.string(),
	type: z.string(),
	type_label: z.string().nullable().optional(),
	product_name: z.string().nullable().optional(),
	administered_at: z.string(),
	next_due_at: z.string().nullable().optional(),
	dose_info: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	created_at: z.string().optional(),
});

export function registerComponentsTreatments(registry: OpenAPIRegistry) {
	registry.register("Treatment", TreatmentSchema);
	registry.register("TreatmentCreate", TreatmentCreateSchema);
}
