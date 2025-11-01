import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { int, nextBirthdayFromDate } from "../lib/utils";
import { AlertsQuerySchema } from "../schemas";

type Env = { Bindings: { DB: D1Database } };

export const alerts = new Hono<Env>();

alerts.get("/due", zValidator("query", AlertsQuerySchema), async (c) => {
	const days = int(c.req.query("days"), 7);
	const minutes = int(c.req.query("minutes"), 15);
	const offsetMinutes = int(c.req.query("offsetMinutes"), -180);

	const now = new Date();
	const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
	const untilIso = until.toISOString();

	const vaccines = await c.env.DB.prepare(
		"SELECT va.*, vt.name as vaccine_name FROM vaccine_applications va JOIN vaccine_types vt ON va.vaccine_type_id = vt.id WHERE va.next_dose_at IS NOT NULL AND va.next_dose_at <= ?1 ORDER BY va.next_dose_at ASC",
	)
		.bind(untilIso)
		.all();

	const pets = await c.env.DB.prepare(
		"SELECT id,name,birth_date FROM pets WHERE birth_date IS NOT NULL",
	).all();

	const birthdays = (pets.results || [])
		.map((p: any) => {
			const at = nextBirthdayFromDate(
				p.birth_date as string,
				offsetMinutes,
			);
			const turns =
				new Date(at).getUTCFullYear() -
				new Date(p.birth_date as string).getUTCFullYear();
			return {
				pet_id: p.id,
				pet_name: p.name,
				at,
				turns,
			};
		})
		.filter((x: any) => x.at <= untilIso);

	const soon = new Date(now.getTime() + minutes * 60 * 1000).toISOString();
	const points = await c.env.DB.prepare(
		"SELECT p.*, s.pet_id FROM glycemic_curve_points p JOIN glycemic_curve_sessions s ON p.session_id = s.id WHERE p.measured_at IS NULL AND p.expected_at <= ?1 ORDER BY p.expected_at ASC",
	)
		.bind(soon)
		.all();

	const glycemia = (points.results || [])
		.filter((pt: any) => {
			const warnMs = (pt.warn_minutes_before || 10) * 60 * 1000;
			const pre = new Date(new Date(pt.expected_at).getTime() - warnMs);
			return pre <= now && new Date(pt.expected_at) > now;
		})
		.map((pt: any) => ({
			session_id: pt.session_id,
			idx: pt.idx,
			expected_at: pt.expected_at,
			pet_id: pt.pet_id,
		}));

	return c.json({
		birthdays,
		vaccines: vaccines.results || [],
		glycemia,
	});
});
