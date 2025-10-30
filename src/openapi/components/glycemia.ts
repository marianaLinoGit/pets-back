import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
	GlyPointExpectedUpdateSchema,
	GlyPointUpdateSchema,
	GlySessionCreateSchema,
	GlySessionUpdateSchema,
} from "../../schemas";

export const GlySessionSchema = z.object({
	id: z.string(),
	pet_id: z.string(),
	session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	notes: z.string().optional().nullable(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
});

export const GlyPointSchema = z.object({
	id: z.string(),
	session_id: z.string(),
	idx: z.number().int(),
	expected_at: z.string(),
	glucose_mgdl: z.number().nullable().optional(),
	glucose_str: z.enum(["HI"]).nullable().optional(),
	measured_at: z.string().nullable().optional(),
	dosage_clicks: z.number().int().nullable().optional(),
	notes: z.string().nullable().optional(),
	warn_minutes_before: z.number().int().optional(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
});

export function registerComponentsGlycemia(registry: OpenAPIRegistry) {
	registry.register("GlySession", GlySessionSchema);
	registry.register("GlyPoint", GlyPointSchema);
	registry.register("GlySessionCreate", GlySessionCreateSchema);
	registry.register("GlySessionUpdate", GlySessionUpdateSchema);
	registry.register("GlyPointUpdate", GlyPointUpdateSchema);
	registry.register("GlyPointExpectedUpdate", GlyPointExpectedUpdateSchema);
}
