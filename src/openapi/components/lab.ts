import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../lib/z";
import { LabResultCreateSchema } from "../../schemas";
import { SpeciesEnum } from "./common";

export const LabTestTypeSchema = z.object({
	id: z.string(),
	name: z.string(),
	species: SpeciesEnum,
	unit: z.string().nullable().optional(),
	ref_low: z.number().nullable().optional(),
	ref_high: z.number().nullable().optional(),
	category: z.string().nullable().optional(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
});

export const LabTestTypeCreate = z.object({
	name: z.string(),
	species: SpeciesEnum.default("other"),
	unit: z.string().nullable().optional(),
	refLow: z.number().nullable().optional(),
	refHigh: z.number().nullable().optional(),
	category: z.string().nullable().optional(),
});

export const LabTestTypeUpdate = LabTestTypeCreate.partial();

export function registerComponentsLab(registry: OpenAPIRegistry) {
	registry.register("LabTestType", LabTestTypeSchema);
	registry.register("LabTestTypeCreate", LabTestTypeCreate);
	registry.register("LabTestTypeUpdate", LabTestTypeUpdate);
	registry.register("LabResultCreate", LabResultCreateSchema);
}
