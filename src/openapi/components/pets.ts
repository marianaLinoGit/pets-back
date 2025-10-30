import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { PetCreateSchema, PetUpdateSchema } from "../../schemas";
import { SpeciesEnum } from "./common";

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

export const PetSchema = PetCreateSchema.extend({
	id: z.string(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
	is_active: z.boolean().optional(),
});

export function registerComponentsPets(registry: OpenAPIRegistry) {
	registry.register("Pet", PetSchema);
	registry.register("PetCreate", PetCreateSchema);
	registry.register("PetUpdate", PetUpdateSchema);
	registry.register("Weight", WeightSchema);
	registry.register("WeightCreateBody", WeightCreateBodySchema);
	registry.register("Species", SpeciesEnum);
}
