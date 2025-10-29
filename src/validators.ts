import { z } from "zod";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTime =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+\-]\d{2}:\d{2})$/;
const timeHHmm = /^\d{2}:\d{2}$/;
const hhmm = /^(\d{2}):(\d{2})$/;
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const petCreateSchema = z.object({
	name: z.string().min(1),
	species: z.enum(["dog", "cat", "other"]),
	breed: z.string().optional().nullable(),
	birthYear: z.number().int().optional().nullable(),
	birthMonth: z.number().int().min(1).max(12).optional().nullable(),
	birthDay: z.number().int().min(1).max(31).optional().nullable(),
	gender: z.enum(["M", "F", "N"]).optional().nullable(),
	coat: z.string().optional().nullable(),
	microchip: z.string().optional().nullable(),
	adoptionDate: z.string().regex(isoDate).optional().nullable(),
});

export const petUpdateSchema = petCreateSchema.partial();

export const weightCreateSchema = z.object({
	weightKg: z.number().nonnegative(),
	measuredAt: z.string().regex(isoDate),
});

export const glycemiaSessionCreateSchema = z.union([
	z.object({
		petId: z.string(),
		sessionDate: dateOnly,
		times: z.array(z.string()).length(5),
		warnMinutesBefore: z.number().int().min(0).max(240).optional(),
		offsetMinutes: z.number().int().optional(),
		notes: z.string().nullable().optional(),
	}),
	z.object({
		petId: z.string(),
		points: z.array(z.object({ expectedAt: z.string() })).length(5),
		warnMinutesBefore: z.number().int().min(0).max(240).optional(),
		notes: z.string().nullable().optional(),
	}),
]);

export const glycemiaSessionCreateByTimesSchema = z.object({
	petId: z.string(),
	sessionDate: z.string().regex(isoDate),
	times: z.array(z.string().regex(hhmm)).length(5),
	warnMinutesBefore: z.number().int().min(0).max(600).optional(),
	offsetMinutes: z.number().int().optional(),
	notes: z.string().nullable().optional(),
});

export const glycemiaSessionCreateByPointsSchema = z.object({
	petId: z.string(),
	points: z.array(z.object({ expectedAt: z.string() })).length(5),
	warnMinutesBefore: z.number().int().min(0).max(600).optional(),
	notes: z.string().nullable().optional(),
});

export const glycemiaPointUpdateSchema = z.object({
	glucoseMgDl: z.number().nonnegative().optional(),
	glucoseStr: z.literal("HI").optional(),
	measuredAt: z.string().datetime().optional(),
	measuredAtTime: z
		.string()
		.regex(/^\d{2}:\d{2}$/)
		.optional(),
	offsetMinutes: z.number().int().min(-720).max(720).optional(),
	dosageClicks: z.number().int().min(0).optional(),
	notes: z.string().max(200).nullable().optional(),
});

export const glycemiaSessionUpdateSchema = z.object({
	sessionDate: dateOnly.optional(),
	notes: z.string().nullable().optional(),
	times: z.array(z.string().regex(hhmm)).length(5).optional(),
	offsetMinutes: z.number().int().optional(),
});

export const glycemiaPointExpectedUpdateSchema = z.object({
	expectedTime: z.string().regex(hhmm).optional(),
	expectedAt: z.string().optional(),
	offsetMinutes: z.number().int().optional(),
});

export const labTestTypeCreateSchema = z.object({
	name: z.string().min(1),
	unit: z.string().optional().nullable(),
	refLow: z.number().optional().nullable(),
	refHigh: z.number().optional().nullable(),
	category: z.string().optional().nullable(),
});

export const glycemiaSessionIdParamsSchema = z.object({
	id: z.string(),
});

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

export const labResultCreateSchema = z.object({
	petId: z.string().min(1),
	collectedAt: z.string().regex(isoDateTime),
	labName: z.string().optional().nullable(),
	vetName: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
	values: z.array(labValueSchema).min(1),
});

export const vaccineTypeCreateSchema = z.object({
	name: z.string().min(1),
	totalDoses: z.number().int().min(1).max(6).optional(),
	description: z.string().optional().nullable(),
});

export const vaccineApplicationCreateSchema = z.object({
	petId: z.string().min(1),
	vaccineTypeId: z.string().min(1),
	doseNumber: z.number().int().min(1),
	administeredAt: z.string().regex(isoDateTime),
	administeredBy: z.string().optional().nullable(),
	clinic: z.string().optional().nullable(),
	nextDoseAt: z.string().regex(isoDateTime).optional().nullable(),
	notes: z.string().optional().nullable(),
});

export const treatmentCreateSchema = z.object({
	petId: z.string().min(1),
	type: z.string().min(1),
	typeLabel: z.string().max(100).nullable().optional(),
	productName: z.string().optional().nullable(),
	administeredAt: z.string().regex(isoDateTime),
	nextDueAt: z.string().regex(isoDateTime).optional().nullable(),
	doseInfo: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
});

export const vetVisitCreateSchema = z.object({
	petId: z.string().min(1),
	visitedAt: z.string().regex(isoDateTime),
	isEmergency: z.boolean().optional(),
	vetName: z.string().optional().nullable(),
	clinic: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
});

export const alertsQuerySchema = z.object({
	days: z.string().optional(),
	minutes: z.string().optional(),
	offsetMinutes: z.string().optional(),
});
