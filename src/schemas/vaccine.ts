import { z } from "zod";
import { DateOnly } from "./common";

export const VaccineSpecies = z.enum(["dog", "cat", "other"]);

const Trimmed = z.string().transform((s) => s.trim());

const strOpt = z
	.preprocess(
		(v) => (v == null ? undefined : typeof v === "string" ? v.trim() : v),
		z.string(),
	)
	.optional();

const strMin1Opt = z
	.preprocess(
		(v) => (v == null ? undefined : typeof v === "string" ? v.trim() : v),
		z.string().min(1),
	)
	.optional();

export const VaccineTypeCreateSchema = z.object({
	name: z.string().min(1),
	species: z.enum(["dog", "cat", "other"]).optional().nullable(),
	total_doses: z.number().int().min(1),
	description: z.string().optional().nullable(),
	brand: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
});

export const VaccineTypeUpdateInSchema = z
	.object({
		name: z.string().trim().min(1).optional(),
		species: VaccineSpecies.optional(),

		total_doses: z.number().int().min(1).max(12).optional(),
		totalDoses: z.number().int().min(1).max(12).optional(),

		description: z.string().trim().optional().nullable(),
		brand: z.string().trim().optional().nullable(),
		notes: z.string().trim().optional().nullable(),
	})
	.refine((obj) => Object.keys(obj).length > 0, { message: "empty" })
	.transform((v) => ({
		name: v.name,
		species: v.species,
		total_doses: v.total_doses ?? v.totalDoses,
		description: v.description ?? null,
		brand: v.brand ?? null,
		notes: v.notes ?? null,
	}));

export const VaccineTypeUpdateInputSchema = z
	.object({
		name: strMin1Opt,
		species: VaccineSpecies.optional(),
		brand: strOpt,
		description: strOpt,
		notes: strOpt,
		total_doses: z.number().int().min(1).max(12).optional(),
		totalDoses: z.number().int().min(1).max(12).optional(),
	})
	.transform((o) => ({
		...o,
		total_doses: o.total_doses ?? o.totalDoses, // normaliza camel→snake
	}))
	.refine(
		(o) =>
			Object.keys(o).some(
				(k) =>
					[
						"name",
						"species",
						"brand",
						"description",
						"notes",
						"total_doses",
					].includes(k) && (o as any)[k] !== undefined,
			),
		{ message: "empty" },
	);

export const VaccineTypeRowSchema = z.object({
	id: z.string(),
	name: z.string(),
	species: VaccineSpecies,
	total_doses: z.number().int(),
	brand: z.string(),
	description: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	created_at: z.string(),
	updated_at: z.string(),
});

export const VaccineApplicationCreateSchema = z.object({
	petId: z.string().min(1),
	vaccineTypeId: z.string().min(1),
	doseNumber: z.number().int().min(1),
	administeredAt: DateOnly,
	administeredBy: Trimmed.optional().nullable(),
	clinic: Trimmed.optional().nullable(),
	nextDoseAt: DateOnly.optional().nullable(),
	notes: Trimmed.optional().nullable(),
});

export type VaccineTypeCreate = z.infer<typeof VaccineTypeCreateSchema>;
export type VaccineTypeUpdateIn = z.infer<typeof VaccineTypeUpdateInSchema>;
export type VaccineTypeRow = z.infer<typeof VaccineTypeRowSchema>;
