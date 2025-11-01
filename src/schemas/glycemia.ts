import { z } from "../lib/z";
import { DateOnly, DateTime, TimeHHmm } from "./common";

export const GlySessionCreateByTimesSchema = z.object({
	petId: z.string(),
	sessionDate: DateOnly,
	times: z.array(TimeHHmm).length(5),
	warnMinutesBefore: z.number().int().min(0).max(240).optional(),
	offsetMinutes: z.number().int().min(-720).max(840).optional(),
	notes: z.string().nullable().optional(),
});

export const GlySessionCreateByPointsSchema = z.object({
	petId: z.string(),
	points: z.array(z.object({ expectedAt: DateTime })).length(5),
	warnMinutesBefore: z.number().int().min(0).max(240).optional(),
	notes: z.string().nullable().optional(),
});

export const GlySessionCreateSchema = z.union([
	GlySessionCreateByTimesSchema,
	GlySessionCreateByPointsSchema,
]);

export const GlySessionUpdateSchema = z.object({
	sessionDate: DateOnly.optional(),
	notes: z.string().nullable().optional(),
	times: z.array(TimeHHmm).length(5).optional(),
	offsetMinutes: z.number().int().optional(),
});

export const GlyPointUpdateSchema = z.object({
	glucoseMgDl: z.number().nonnegative().optional(),
	glucoseStr: z.literal("HI").optional(),
	measuredAt: DateTime.optional(),
	measuredAtTime: TimeHHmm.optional(),
	offsetMinutes: z.number().int().min(-720).max(720).optional(),
	dosageClicks: z.number().int().min(0).optional(),
	notes: z.string().max(200).nullable().optional(),
});

export const GlyPointExpectedUpdateSchema = z.object({
	expectedTime: TimeHHmm.optional(),
	expectedAt: z.string().optional(),
	offsetMinutes: z.number().int().optional(),
});

export const GlySessionIdParams = z.object({
	id: z.string(),
});

export const CountQuerySchema = z.object({
	ids: z
		.string()
		.min(1)
		.openapi({
			param: { name: "ids", in: "query", required: true },
			example: "uuid1,uuid2",
		}),
	at: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional()
		.openapi({
			param: { name: "at", in: "query", required: false },
			example: "2025-11-03",
		}),
});

export const GlyCountItemSchema = z
	.object({
		pet_id: z.string().uuid(),
		count: z.number().int().nonnegative(),
	})
	.openapi("GlyCountItem");

export const GlyCountsResponseSchema = z
	.object({
		counts: z.array(GlyCountItemSchema),
	})
	.openapi("GlyCountsResponse");
