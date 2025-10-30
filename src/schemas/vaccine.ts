import { z } from "zod";
import { DateOnly } from "./common";

export const VaccineSpecies = z.enum(["dog", "cat", "other"]);

export const VaccineTypeCreateSchema = z.object({
	name: z.string().min(1),
	species: z.enum(["dog", "cat", "other"]).optional().nullable(),
	total_doses: z.number().int().min(1),
	description: z.string().optional().nullable(),
	brand: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
});

export const VaccineTypeUpdateSchema = z
	.object({
		name: z.string().min(1).optional(),
		totalDoses: z.number().int().min(1).max(12).optional(),
		description: z.string().nullable().optional(),
		species: VaccineSpecies.optional(),
		brand: z.string().nullable().optional(),
		notes: z.string().nullable().optional(),
	})
	.refine((obj) => Object.keys(obj).length > 0, { message: "empty" });

export const VaccineTypeRowSchema = z.object({
	id: z.string(),
	name: z.string(),
	species: VaccineSpecies,
	total_doses: z.number().int().nullable().optional(),
	brand: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
});

export const VaccineApplicationCreateSchema = z.object({
	petId: z.string().min(1),
	vaccineTypeId: z.string().min(1),
	doseNumber: z.number().int().min(1),
	administeredAt: DateOnly,
	administeredBy: z.string().optional().nullable(),
	clinic: z.string().optional().nullable(),
	nextDoseAt: DateOnly.optional().nullable(),
	notes: z.string().optional().nullable(),
});

export type VaccineTypeRow = {
	id: string;
	name: string;
	species: typeof VaccineSpecies._type;
	total_doses: number | null;
	brand: string | null;
	description: string | null;
	notes: string | null;
	created_at?: string;
	updated_at?: string;
};

export type VaccineTypeCreate = {
	name: string;
	species?: typeof VaccineSpecies._type;
	totalDoses?: number | null;
	brand?: string | null;
	description?: string | null;
	notes?: string | null;
};

export type VaccineTypeUpdate = Partial<VaccineTypeCreate>;
