import { z } from "../lib/z";

export const AlertKindEnum = z.enum([
	"birthdays",
	"vaccines",
	"glycemia",
	"treatments",
]);

export const AlertsQuerySchema = z
	.object({
		days: z.coerce.number().int().min(1).max(365).optional(),
		minutes: z.coerce.number().int().min(1).max(120).optional(),
		offsetMinutes: z.coerce.number().int().min(-720).max(720).optional(),
		petId: z.string().uuid().optional(),
		kinds: z
			.preprocess(
				(v) => (typeof v === "string" ? v.split(",") : v),
				z.array(AlertKindEnum),
			)
			.default(["birthdays", "vaccines", "glycemia", "treatments"]),
	})
	.refine((q) => !(q.days && q.minutes), {
		message: "Use apenas days OU minutes",
	});

export const VaccinesDueQuerySchema = z.object({
	from: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "from deve estar no formato YYYY-MM-DD"),
	to: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "to deve estar no formato YYYY-MM-DD"),
	includeOverdue: z
		.preprocess(
			(v) =>
				v === "1" ||
				v === 1 ||
				v === true ||
				(typeof v === "string" && v.toLowerCase() === "true"),
			z.boolean(),
		)
		.optional(),
	petId: z.string().uuid().optional(),
});

export const AlertsDueResponseSchema = z.object({
	birthdays: z
		.array(
			z.object({
				pet_id: z.string(),
				pet_name: z.string(),
				at: z.string(),
			}),
		)
		.optional(),
	vaccines: z
		.array(
			z.object({
				id: z.string().optional(),
				pet_id: z.string(),
				pet_name: z.string().optional(),
				vaccine_name: z.string(),
				next_dose_at: z.string(),
			}),
		)
		.optional(),
	glycemia: z
		.array(
			z.object({
				session_id: z.string(),
				idx: z.number().int(),
				expected_at: z.string(),
				pet_id: z.string(),
				pet_name: z.string().optional(),
			}),
		)
		.optional(),
	treatments: z
		.array(
			z.object({
				id: z.string(),
				pet_id: z.string(),
				pet_name: z.string().optional(),
				next_due_at: z.string(),
				type: z.string(),
				type_label: z.string().optional().nullable(),
				product_name: z.string().optional().nullable(),
			}),
		)
		.optional(),
});
