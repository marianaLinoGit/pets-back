import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../lib/z";
import {
	ConditionCreateSchema,
	ConditionStatus,
	ConditionUpdateSchema,
	Curability,
	Severity,
} from "../../schemas";

export const ConditionSchema = z.object({
	id: z.string(),
	pet_id: z.string(),
	name: z.string(),
	curability: Curability,
	status: ConditionStatus,
	severity: Severity,
	diagnosed_at: z.string().nullable().optional(),
	resolved_at: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
});

export function registerComponentsConditions(registry: OpenAPIRegistry) {
	registry.register("Condition", ConditionSchema);
	registry.register("ConditionCreate", ConditionCreateSchema);
	registry.register("ConditionUpdate", ConditionUpdateSchema);
	registry.register("ConditionStatus", ConditionStatus);
	registry.register("Severity", Severity);
	registry.register("Curability", Curability);
}
