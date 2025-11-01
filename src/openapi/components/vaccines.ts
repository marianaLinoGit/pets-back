import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../lib/z";
import {
	VaccineApplicationCreateSchema,
	VaccineTypeCreateSchema,
} from "../../schemas";
import { SpeciesEnum } from "./common";

export const VaccineTypeSchema = z.object({
	id: z.string(),
	name: z.string(),
	species: SpeciesEnum,
	total_doses: z.number().nullable().optional(),
	brand: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
});

export const VaccineApplicationSchema = z.object({
	id: z.string(),
	pet_id: z.string(),
	vaccine_type_id: z.string(),
	dose_number: z.number().int(),
	administered_at: z.string(),
	administered_by: z.string().nullable().optional(),
	clinic: z.string().nullable().optional(),
	next_dose_at: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	created_at: z.string().optional(),
	vaccine_name: z.string().optional(),
});

export function registerComponentsVaccines(registry: OpenAPIRegistry) {
	registry.register("VaccineType", VaccineTypeSchema);
	registry.register("VaccineTypeCreate", VaccineTypeCreateSchema);
	registry.register("VaccineApplication", VaccineApplicationSchema);
	registry.register(
		"VaccineApplicationCreate",
		VaccineApplicationCreateSchema,
	);
}
