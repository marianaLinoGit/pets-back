import { z } from "zod";

export const HexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/, "hex");

export const SettingsUpdateSchema = z.object({
	email: z.string().email().max(255).nullable().optional(),
	phone: z.string().max(30).nullable().optional(),
	themeColor: HexColor.nullable().optional(),
});

export const SettingsUpdateAcceptBothSchema = z.preprocess((raw) => {
	if (raw && typeof raw === "object") {
		const o: any = raw;
		if (o.theme_color !== undefined && o.themeColor === undefined) {
			o.themeColor = o.theme_color;
		}
	}
	return raw;
}, SettingsUpdateSchema);

export const SettingsGetResponseSchema = z.object({
	email: z.string().nullable(),
	phone: z.string().nullable(),
	themeColor: HexColor.nullable(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});
