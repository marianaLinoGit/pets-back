import { z } from "zod";
import { DateTime } from "./common";

export const TreatmentCreateSchema = z.object({
	petId: z.string().min(1),
	type: z.string().min(1),
	typeLabel: z.string().max(100).nullable().optional(),
	productName: z.string().optional().nullable(),
	administeredAt: DateTime,
	nextDueAt: DateTime.optional().nullable(),
	doseInfo: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
});
