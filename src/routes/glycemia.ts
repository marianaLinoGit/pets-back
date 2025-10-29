import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireApiKey } from "../lib/auth";
import { int, isoFromLocal, nowIso } from "../lib/utils";
import {
	GlyPointExpectedUpdateSchema,
	GlyPointUpdateSchema,
	GlySessionCreateSchema,
	GlySessionUpdateSchema,
} from "../schemas";

type Env = { Bindings: { DB: D1Database; API_KEY?: string } };

export const glycemia = new Hono<Env>();

glycemia.get("/__ping", (c) => c.text("ok"));

glycemia.get("/sessions", async (c) => {
	const petId = c.req.query("petId");
	const limit = Math.min(int(c.req.query("limit"), 50), 200);
	const offset = int(c.req.query("offset"), 0);
	if (!petId) return c.json([]);
	const r = await c.env.DB.prepare(
		"SELECT * FROM glycemic_curve_sessions WHERE pet_id = ?1 ORDER BY session_date DESC LIMIT ?2 OFFSET ?3",
	)
		.bind(petId, limit, offset)
		.all();
	return c.json(r.results || []);
});

glycemia.post(
	"/sessions",
	requireApiKey,
	zValidator("json", GlySessionCreateSchema),
	async (c) => {
		const body = c.req.valid("json");
		const sid = crypto.randomUUID();
		const ts = nowIso();

		if ("sessionDate" in body) {
			const ins = await c.env.DB.prepare(
				"INSERT INTO glycemic_curve_sessions (id,pet_id,session_date,notes,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6)",
			)
				.bind(
					sid,
					body.petId,
					body.sessionDate,
					body.notes ?? null,
					ts,
					ts,
				)
				.run();
			if (!ins.success) return c.json({ error: "db_error" }, 500);

			const warn = body.warnMinutesBefore ?? 10;
			for (let i = 0; i < 5; i++) {
				const pid = crypto.randomUUID();
				const expectedAt = isoFromLocal(
					body.sessionDate,
					body.times[i],
					body.offsetMinutes,
				);
				const pr = await c.env.DB.prepare(
					"INSERT INTO glycemic_curve_points (id,session_id,idx,expected_at,glucose_mgdl,measured_at,warn_minutes_before,created_at,updated_at) VALUES (?1,?2,?3,?4,NULL,NULL,?5,?6,?7)",
				)
					.bind(pid, sid, i + 1, expectedAt, warn, ts, ts)
					.run();
				if (!pr.success) return c.json({ error: "db_error" }, 500);
			}
			return c.json({ id: sid }, 201);
		} else {
			const ins = await c.env.DB.prepare(
				"INSERT INTO glycemic_curve_sessions (id,pet_id,session_date,notes,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6)",
			)
				.bind(
					sid,
					body.petId,
					body.points[0].expectedAt.slice(0, 10),
					body.notes ?? null,
					ts,
					ts,
				)
				.run();
			if (!ins.success) return c.json({ error: "db_error" }, 500);

			const warn = body.warnMinutesBefore ?? 10;
			for (let i = 0; i < 5; i++) {
				const pid = crypto.randomUUID();
				const expectedAt = body.points[i].expectedAt;
				const pr = await c.env.DB.prepare(
					"INSERT INTO glycemic_curve_points (id,session_id,idx,expected_at,glucose_mgdl,measured_at,warn_minutes_before,created_at,updated_at) VALUES (?1,?2,?3,?4,NULL,NULL,?5,?6,?7)",
				)
					.bind(pid, sid, i + 1, expectedAt, warn, ts, ts)
					.run();
				if (!pr.success) return c.json({ error: "db_error" }, 500);
			}
			return c.json({ id: sid }, 201);
		}
	},
);

glycemia.get("/sessions/:id", async (c) => {
	const sid = c.req.param("id");
	const s = await c.env.DB.prepare(
		"SELECT * FROM glycemic_curve_sessions WHERE id = ?1",
	)
		.bind(sid)
		.all();
	if (!s.results || s.results.length === 0)
		return c.json({ error: "not_found" }, 404);
	const p = await c.env.DB.prepare(
		"SELECT * FROM glycemic_curve_points WHERE session_id = ?1 ORDER BY idx ASC",
	)
		.bind(sid)
		.all();
	return c.json({ session: s.results[0], points: p.results || [] });
});

glycemia.put(
	"/sessions/:id",
	requireApiKey,
	zValidator("json", GlySessionUpdateSchema),
	async (c) => {
		const sid = c.req.param("id");
		const body = c.req.valid("json");
		const ts = nowIso();

		const s = await c.env.DB.prepare(
			"SELECT session_date FROM glycemic_curve_sessions WHERE id = ?1",
		)
			.bind(sid)
			.all();
		if (!s.results || s.results.length === 0)
			return c.json({ error: "not_found" }, 404);

		const currentDate = (s.results[0] as any).session_date as string;
		const sessionDate = body.sessionDate ?? currentDate;

		const up = await c.env.DB.prepare(
			"UPDATE glycemic_curve_sessions SET session_date = COALESCE(?2, session_date), notes = COALESCE(?3, notes), updated_at = ?4 WHERE id = ?1",
		)
			.bind(sid, body.sessionDate ?? null, body.notes ?? null, ts)
			.run();
		if (!up.success) return c.json({ updated: false }, 200);

		if (body.times) {
			const warnOffset = body.offsetMinutes;
			for (let i = 0; i < 5; i++) {
				const expectedAt = isoFromLocal(
					sessionDate,
					body.times[i],
					warnOffset,
				);
				const pr = await c.env.DB.prepare(
					"UPDATE glycemic_curve_points SET expected_at = ?3, updated_at = ?4 WHERE session_id = ?1 AND idx = ?2",
				)
					.bind(sid, i + 1, expectedAt, ts)
					.run();
				if (!pr.success) return c.json({ updated: false }, 200);
			}
		}

		return c.json({ updated: true }, 200);
	},
);

glycemia.put(
	"/sessions/:id/points/:idx/expected",
	requireApiKey,
	zValidator("json", GlyPointExpectedUpdateSchema),
	async (c) => {
		const sid = c.req.param("id");
		const idx = parseInt(c.req.param("idx"), 10);
		const body = c.req.valid("json");
		const ts = nowIso();

		const s = await c.env.DB.prepare(
			"SELECT session_date FROM glycemic_curve_sessions WHERE id = ?1",
		)
			.bind(sid)
			.all();
		if (!s.results || s.results.length === 0)
			return c.json({ error: "session_not_found" }, 404);

		let expectedIso: string | null = null;
		if (body.expectedTime) {
			const sessionDate = (s.results[0] as any).session_date as string;
			expectedIso = isoFromLocal(
				sessionDate,
				body.expectedTime,
				body.offsetMinutes,
			);
		} else if (body.expectedAt) {
			expectedIso = body.expectedAt;
		}
		if (!expectedIso) return c.json({ error: "invalid_payload" }, 400);

		const r = await c.env.DB.prepare(
			"UPDATE glycemic_curve_points SET expected_at = ?3, updated_at = ?4 WHERE session_id = ?1 AND idx = ?2",
		)
			.bind(sid, idx, expectedIso, ts)
			.run();

		return c.json({ updated: r.success });
	},
);

glycemia.put(
	"/sessions/:id/points/:idx",
	requireApiKey,
	zValidator("json", GlyPointUpdateSchema),
	async (c) => {
		const sid = c.req.param("id");
		const idx = parseInt(c.req.param("idx"), 10);
		const body = c.req.valid("json");
		const ts = nowIso();

		const ex = await c.env.DB.prepare(
			"SELECT id FROM glycemic_curve_points WHERE session_id = ?1 AND idx = ?2",
		)
			.bind(sid, idx)
			.all();
		if (!ex.results || ex.results.length === 0)
			return c.json({ error: "not_found" }, 404);

		let measuredAtIso: string | null = (body as any).measuredAt ?? null;
		if ((body as any).measuredAtTime) {
			const s = await c.env.DB.prepare(
				"SELECT session_date FROM glycemic_curve_sessions WHERE id = ?1",
			)
				.bind(sid)
				.all();
			if (!s.results || s.results.length === 0)
				return c.json({ error: "session_not_found" }, 404);
			const sessionDate = (s.results[0] as any).session_date as string;
			const time = (body as any).measuredAtTime as string;
			measuredAtIso = isoFromLocal(
				sessionDate,
				time,
				(body as any).offsetMinutes,
			);
		}

		const r = await c.env.DB.prepare(
			"UPDATE glycemic_curve_points SET glucose_mgdl = COALESCE(?3, glucose_mgdl), glucose_str = COALESCE(?4, glucose_str), measured_at = COALESCE(?5, measured_at), dosage_clicks = COALESCE(?6, dosage_clicks), notes = COALESCE(?7, notes), updated_at = ?8 WHERE session_id = ?1 AND idx = ?2",
		)
			.bind(
				sid,
				idx,
				(body as any).glucoseMgDl ?? null,
				(body as any).glucoseStr ?? null,
				measuredAtIso ?? null,
				(body as any).dosageClicks ?? null,
				(body as any).notes ?? null,
				ts,
			)
			.run();

		return c.json({ updated: r.success });
	},
);

glycemia.delete("/sessions/:id", requireApiKey, async (c) => {
	const sid = c.req.param("id");
	const delPoints = await c.env.DB.prepare(
		"DELETE FROM glycemic_curve_points WHERE session_id = ?1",
	)
		.bind(sid)
		.run();
	const delSession = await c.env.DB.prepare(
		"DELETE FROM glycemic_curve_sessions WHERE id = ?1",
	)
		.bind(sid)
		.run();
	const pointsDeleted = delPoints.meta.changes ?? 0;
	const sessionDeleted = delSession.meta.changes ?? 0;
	return c.json({
		deleted: sessionDeleted > 0,
		pointsDeleted,
		sessionDeleted,
	});
});
