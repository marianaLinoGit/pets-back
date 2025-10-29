import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

export const settings = new Hono();

const SettingsUpdateSchema = z.object({
	email: z.string().email().nullable().optional(),
	phone: z.string().nullable().optional(),
	theme_color: z
		.string()
		.regex(/^#([0-9a-fA-F]{6})$/)
		.nullable()
		.optional(),
});

settings.get("/me", async (c) => {
	const userId = "me";
	const row = await c.env.DB.prepare(
		"SELECT user_id, email, phone, theme_color, created_at, updated_at FROM user_settings WHERE user_id = ?1",
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
		theme_color: null,
		created_at: ts,
		updated_at: ts,
	});
});

settings.put("/me", zValidator("json", SettingsUpdateSchema), async (c) => {
	const userId = "me";
	const b = c.req.valid("json");
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
			b.theme_color ?? null,
			ts,
		)
		.run();

	const out = await c.env.DB.prepare(
		"SELECT user_id, email, phone, theme_color, created_at, updated_at FROM user_settings WHERE user_id = ?1",
	)
		.bind(userId)
		.first<any>();

	return c.json(out);
});

export default settings;
