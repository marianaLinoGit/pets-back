import { z } from "zod";
import { DateTime } from "./common";

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
	unit: z.string().optional().nullable(),
	refLow: z.number().optional().nullable(),
	refHigh: z.number().optional().nullable(),
	category: z.string().optional().nullable(),
});

export const LabResultCreateSchema = z.object({
	petId: z.string().min(1),
	collectedAt: DateTime,
	labName: z.string().optional().nullable(),
	vetName: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
	values: z.array(labValueSchema).min(1),
});
