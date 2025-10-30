import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { Env } from "../lib/env";
import {
	SettingsGetResponseSchema,
	SettingsUpdateAcceptBothSchema,
} from "../schemas/settings";

export const settings = new Hono<Env>();

settings.get("/me", async (c) => {
	const userId = "me";
	const row = await c.env.DB.prepare(
		"SELECT user_id, email, phone, theme_color AS themeColor, created_at AS createdAt, updated_at AS updatedAt FROM user_settings WHERE user_id = ?1",
	)
		.bind(userId)
		.first<any>();

	if (row) return c.json(row);

	const ts = new Date().toISOString();
	await c.env.DB.prepare(
		"INSERT INTO user_settings (user_id, email, phone, theme_color, created_at, updated_at) VALUES (?1, NULL, NULL, NULL, ?2, ?2)",
	)
		.bind(userId, ts)
		.run();

	return c.json({
		user_id: userId,
		email: null,
		phone: null,
		themeColor: null,
		createdAt: ts,
		updatedAt: ts,
	});
});

settings.put(
	"/me",
	zValidator("json", SettingsUpdateAcceptBothSchema),
	async (c) => {
		const userId = "me";
		const b = c.req.valid("json") as {
			email?: string | null;
			phone?: string | null;
			themeColor?: string | null;
		};
		const ts = new Date().toISOString();

		await c.env.DB.prepare(
			`INSERT INTO user_settings (user_id, email, phone, theme_color, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?5)
     ON CONFLICT(user_id) DO UPDATE SET
       email = COALESCE(excluded.email, user_settings.email),
       phone = COALESCE(excluded.phone, user_settings.phone),
       theme_color = COALESCE(excluded.theme_color, user_settings.theme_color),
       updated_at = excluded.updated_at`,
		)
			.bind(
				userId,
				b.email ?? null,
				b.phone ?? null,
				b.themeColor ?? null,
				ts,
			)
			.run();

		const out = await c.env.DB.prepare(
			"SELECT user_id, email, phone, theme_color AS themeColor, created_at AS createdAt, updated_at AS updatedAt FROM user_settings WHERE user_id = ?1",
		)
			.bind(userId)
			.first<any>();

		const parsed = SettingsGetResponseSchema.safeParse(out);
		return c.json(parsed.success ? parsed.data : out);
	},
);
