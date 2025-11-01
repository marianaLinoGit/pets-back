import { z } from "../lib/z";
import { DateTime } from "./common";

export const SpeciesEnum = z.enum(["dog", "cat", "other"]);

const labValueSchema = z
	.object({
		testTypeId: z.string().optional(),
		name: z.string().optional(),
		value: z.number(),
		unit: z.string().optional().nullable(),
	})
	.refine((v) => !!v.testTypeId || !!v.name, {
		message: "testTypeId or name required",
	});

export const LabTestTypeCreateSchema = z.object({
	name: z.string().min(1),
	species: SpeciesEnum.default("other"),
	unit: z.string().max(50).nullable().optional(),
	refLow: z.number().nullable().optional(),
	refHigh: z.number().nullable().optional(),
	category: z.string().max(100).nullable().optional(),
});

export const LabResultCreateSchema = z.object({
	petId: z.string().min(1),
	collectedAt: DateTime,
	labName: z.string().optional().nullable(),
	vetName: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
	values: z.array(labValueSchema).min(1),
});

export const LabTestTypeUpdateSchema = LabTestTypeCreateSchema.partial();
