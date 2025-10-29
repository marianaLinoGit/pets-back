import { z } from "zod";

export const SettingsSchema = z.object({
	email: z.string().email().max(255).nullable().optional(),
	phone: z.string().max(30).nullable().optional(),
	themeColor: z
		.string()
		.regex(/^#([0-9a-fA-F]{6})$/, "hex")
		.nullable()
		.optional(),
});

export const SettingsGetResponseSchema = z.object({
	email: z.string().nullable(),
	phone: z.string().nullable(),
	themeColor: z.string().nullable(),
});
