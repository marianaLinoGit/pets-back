import { z } from "zod";

const isoDateTime =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+\-]\d{2}:\d{2})$/;

export const VetVisitCreateSchema = z.object({
	petId: z.string().min(1),
	visitedAt: z.string().regex(isoDateTime),
	isEmergency: z.boolean().optional(),
	vetName: z.string().optional().nullable(),
	clinic: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
});
