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
