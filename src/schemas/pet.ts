import { z } from "zod";
import { DateOnly } from "./common";

export const PetCreateSchema = z.object({
	name: z.string().min(1),
	species: z.enum(["dog", "cat", "other"]),
	breed: z.string().optional().nullable(),
	gender: z.enum(["M", "F", "N"]).optional().nullable(),
	coat: z.string().optional().nullable(),
	microchip: z.string().optional().nullable(),
	birthDate: DateOnly.optional().nullable(),
	adoptionDate: DateOnly.optional().nullable(),
});

export const PetUpdateSchema = PetCreateSchema.partial();

export const petsListQuerySchema = z.object({
	q: z.string().optional(),
	species: z.enum(["dog", "cat", "other"]).optional(),
	gender: z.enum(["M", "F", "N"]).optional(),
	sortBy: z.enum(["name", "birth_date", "adoption_date"]).optional(),
	sortDir: z.enum(["asc", "desc"]).optional(),
});
export const PetsListQuerySchema = petsListQuerySchema;

export const WeightCreateSchema = z.object({
	weightKg: z.number().nonnegative(),
	measuredAt: DateOnly,
});
export const WeightCreateBodySchema = WeightCreateSchema;
