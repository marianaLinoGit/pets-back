import { z } from "zod";
import { DateTime } from "./common";

export const VaccineTypeCreateSchema = z.object({
	name: z.string().min(1),
	totalDoses: z.number().int().min(1).max(6).optional(),
	description: z.string().optional().nullable(),
});

export const VaccineApplicationCreateSchema = z.object({
	petId: z.string(),
	vaccineTypeId: z.string(),
	doseNumber: z.number().int().min(1),
	administeredAt: z
		.string()
		.regex(
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+\-]\d{2}:\d{2})$/,
		),
	administeredBy: z.string().optional().nullable(),
	clinic: z.string().optional().nullable(),
	nextDoseAt: DateTime.optional().nullable(),
	notes: z.string().optional().nullable(),
});
