import { z } from "../lib/z";

const DateTimeLocalISO = z.string().regex(/^\d{4}-\d{2}-\d{2}T/);
const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const VetVisitCreateSchema = z.object({
	petId: z.string().min(1),
	visitedAt: DateTimeLocalISO,
	visitType: z.enum(["routine", "return", "emergency", "tele"]),
	isEmergency: z.boolean(),
	clinic: z.string().trim().min(1),
	notes: z.string().trim().min(1),
	weightKg: z.number().positive(),

	tempC: z.number().positive().nullable().optional(),
	heartRateBpm: z.number().int().positive().nullable().optional(),
	respRateBpm: z.number().int().positive().nullable().optional(),
	capillaryRefillSec: z.number().positive().nullable().optional(),
	painScore: z.number().int().min(0).max(10).nullable().optional(),

	reason: z.string().trim().optional().nullable(),
	examSummary: z.string().trim().optional().nullable(),
	findings: z.string().trim().optional().nullable(),
	diagnosis: z.string().trim().optional().nullable(),
	differentialDx: z.string().trim().optional().nullable(),
	proceduresDone: z.string().trim().optional().nullable(),
	medsAdministered: z.string().trim().optional().nullable(),
	prescriptions: z.string().trim().optional().nullable(),
	allergies: z.string().trim().optional().nullable(),
	reproStatus: z.string().trim().optional().nullable(),
	nextVisitAt: DateOnly.optional().nullable(),
	vetName: z.string().trim().optional().nullable(),

	costTotal: z.number().nonnegative().nullable().optional(),
	paidTotal: z.number().nonnegative().nullable().optional(),
	paymentMethod: z.string().trim().optional().nullable(),

	vaccineApps: z
		.array(
			z.object({
				vaccineTypeId: z.string().min(1),
				doseNumber: z.number().int().min(1),
				administeredAt: DateOnly.optional(),
				administeredBy: z.string().trim().optional().nullable(),
				clinic: z.string().trim().optional().nullable(),
				nextDoseAt: DateOnly.optional().nullable(),
				notes: z.string().trim().optional().nullable(),
				brand: z.string().trim().optional().nullable(),
			}),
		)
		.optional(),

	labOrders: z
		.array(
			z.object({
				labTypeId: z.string().min(1),
				notes: z.string().trim().optional().nullable(),
			}),
		)
		.optional(),
});

export const VetVisitUpdateSchema = VetVisitCreateSchema.partial().extend({
	id: z.string().min(1).optional(),
});
