import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";

// ── Swagger/OpenAPI (compatível com Zod v3 + @asteasolutions/zod-to-openapi v7) ──
import {
	OpenAPIRegistry,
	OpenApiGeneratorV3,
	extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { z } from "zod";
import {
	alertsQuerySchema,
	glycemiaPointExpectedUpdateSchema,
	glycemiaPointUpdateSchema,
	glycemiaSessionCreateSchema,
	glycemiaSessionUpdateSchema,
	labResultCreateSchema,
	labTestTypeCreateSchema,
	petCreateSchema,
	petUpdateSchema,
	treatmentCreateSchema,
	vaccineApplicationCreateSchema,
	vaccineTypeCreateSchema,
	vetVisitCreateSchema,
	weightCreateSchema,
} from "./validators";

extendZodWithOpenApi(z);
// ────────────────────────────────────────────────────────────────────────────────
// Types de ambiente para Cloudflare Workers + D1
// ────────────────────────────────────────────────────────────────────────────────
type Bindings = {
	DB: D1Database;
	API_KEY?: string;
};
type Env = {
	Bindings: Bindings;
};

// ────────────────────────────────────────────────────────────────────────────────
// App Hono
// ────────────────────────────────────────────────────────────────────────────────
const app = new Hono<Env>();
const registry = new OpenAPIRegistry();
app.use("*", cors());

// ────────────────────────────────────────────────────────────────────────────────
/** Utils */
// ────────────────────────────────────────────────────────────────────────────────
const nowIso = () => new Date().toISOString();
const toBool = (v: unknown) =>
	v === 1 || v === true || v === "1" || v === "true";
const int = (s: string | null | undefined, d: number) => {
	const n = s ? parseInt(s, 10) : NaN;
	return Number.isFinite(n) ? n : d;
};
const offsetOrDefault = (m?: number) => (typeof m === "number" ? m : -180);

const isoFromLocal = (date: string, time: string, offsetMinutes?: number) => {
	const [y, mo, d] = date.split("-").map((x) => parseInt(x, 10));
	const [hh, mm] = time.split(":").map((x) => parseInt(x, 10));
	const off = offsetOrDefault(offsetMinutes);
	const utcH = hh - Math.trunc(off / 60);
	const utcM = mm - (off % 60);
	const dt = new Date(Date.UTC(y, mo - 1, d, utcH, utcM, 0));
	return dt.toISOString();
};

const nextBirthdayIso = (
	birthMonth: number,
	birthDay: number,
	offsetMinutes?: number,
) => {
	const off = offsetOrDefault(offsetMinutes);
	const now = new Date();
	const y = now.getUTCFullYear();
	const local = new Date(
		Date.UTC(
			y,
			birthMonth - 1,
			birthDay,
			12 - Math.trunc(off / 60),
			-(off % 60),
			0,
		),
	);
	const target =
		local < now
			? new Date(
					Date.UTC(
						y + 1,
						birthMonth - 1,
						birthDay,
						12 - Math.trunc(off / 60),
						-(off % 60),
						0,
					),
			  )
			: local;
	return target.toISOString();
};

const requireApiKey = async (c: any, next: any) => {
	const expected = c.env.API_KEY || "";
	if (!expected) return next();
	const key = c.req.header("x-api-key");
	if (key !== expected)
		return c.json(
			{
				error: "unauthorized",
			},
			401,
		);
	await next();
};

// ────────────────────────────────────────────────────────────────────────────────
// Health
// ────────────────────────────────────────────────────────────────────────────────
app.get("/health", (c) =>
	c.json({
		ok: true,
		time: nowIso(),
	}),
);

// ────────────────────────────────────────────────────────────────────────────────
// Pets
// ────────────────────────────────────────────────────────────────────────────────
app.get("/pets", async (c) => {
	const q = c.req.query("q") || "";
	const limit = Math.min(int(c.req.query("limit"), 50), 200);
	const offset = int(c.req.query("offset"), 0);
	const stmt = q
		? c.env.DB.prepare(
				"SELECT * FROM pets WHERE name LIKE ?1 ORDER BY created_at DESC LIMIT ?2 OFFSET ?3",
		  ).bind(`%${q}%`, limit, offset)
		: c.env.DB.prepare(
				"SELECT * FROM pets ORDER BY created_at DESC LIMIT ?1 OFFSET ?2",
		  ).bind(limit, offset);
	const r = await stmt.all();
	return c.json(r.results || []);
});

app.get("/pets/:id", async (c) => {
	const id = c.req.param("id");
	const r = await c.env.DB.prepare("SELECT * FROM pets WHERE id = ?1")
		.bind(id)
		.all();
	if (!r.results || r.results.length === 0)
		return c.json(
			{
				error: "not_found",
			},
			404,
		);
	return c.json(r.results[0]);
});

app.post(
	"/pets",
	requireApiKey,
	zValidator("json", petCreateSchema),
	async (c) => {
		const body = await c.req.json();
		const id = crypto.randomUUID();
		const ts = nowIso();
		const r = await c.env.DB.prepare(
			"INSERT INTO pets (id,name,species,breed,birth_year,birth_month,birth_day,gender,coat,microchip,adoption_date,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)",
		)
			.bind(
				id,
				body.name,
				body.species,
				body.breed ?? null,
				body.birthYear ?? null,
				body.birthMonth ?? null,
				body.birthDay ?? null,
				body.gender ?? null,
				body.coat ?? null,
				body.microchip ?? null,
				body.adoptionDate ?? null,
				ts,
				ts,
			)
			.run();
		return c.json(
			{
				id,
			},
			r.success ? 201 : 500,
		);
	},
);

app.put(
	"/pets/:id",
	requireApiKey,
	zValidator("json", petUpdateSchema),
	async (c) => {
		const id = c.req.param("id");
		const body = await c.req.json();
		const ts = nowIso();

		const exists = await c.env.DB.prepare(
			"SELECT id FROM pets WHERE id = ?1",
		)
			.bind(id)
			.all();
		if (!exists.results || exists.results.length === 0)
			return c.json(
				{
					error: "not_found",
				},
				404,
			);

		const r = await c.env.DB.prepare(
			`UPDATE pets SET
		  name = COALESCE(?2, name),
		  species = COALESCE(?3, species),
		  breed = COALESCE(?4, breed),
		  birth_year = COALESCE(?5, birth_year),
		  birth_month = COALESCE(?6, birth_month),
		  birth_day = COALESCE(?7, birth_day),
		  gender = COALESCE(?8, gender),
		  coat = COALESCE(?9, coat),
		  microchip = COALESCE(?10, microchip),
		  adoption_date = COALESCE(?11, adoption_date),
		  updated_at = ?12
		 WHERE id = ?1`,
		)
			.bind(
				id,
				body.name ?? null,
				body.species ?? null,
				body.breed ?? null,
				body.birthYear ?? null,
				body.birthMonth ?? null,
				body.birthDay ?? null,
				body.gender ?? null,
				body.coat ?? null,
				body.microchip ?? null,
				body.adoptionDate ?? null,
				ts,
			)
			.run();

		return c.json({
			updated: r.success,
		});
	},
);

app.delete("/pets/:id", requireApiKey, async (c) => {
	const id = c.req.param("id");
	const r = await c.env.DB.prepare("DELETE FROM pets WHERE id = ?1")
		.bind(id)
		.run();
	if ((r.meta?.changes || 0) === 0)
		return c.json(
			{
				error: "not_found",
			},
			404,
		);
	return c.json({
		deleted: true,
	});
});

app.get("/pets/:id/weights", async (c) => {
	const id = c.req.param("id");
	const limit = Math.min(int(c.req.query("limit"), 50), 500);
	const offset = int(c.req.query("offset"), 0);
	const r = await c.env.DB.prepare(
		"SELECT * FROM pet_weights WHERE pet_id = ?1 ORDER BY measured_at DESC LIMIT ?2 OFFSET ?3",
	)
		.bind(id, limit, offset)
		.all();
	return c.json(r.results || []);
});

app.post(
	"/pets/:id/weights",
	requireApiKey,
	zValidator("json", weightCreateSchema),
	async (c) => {
		const id = c.req.param("id");
		const body = await c.req.json();
		const ts = nowIso();
		const wid = crypto.randomUUID();
		const r = await c.env.DB.prepare(
			"INSERT INTO pet_weights (id,pet_id,measured_at,weight_kg,created_at) VALUES (?1,?2,?3,?4,?5)",
		)
			.bind(wid, id, body.measuredAt, body.weightKg, ts)
			.run();
		return c.json(
			{
				id: wid,
			},
			r.success ? 201 : 500,
		);
	},
);

// ────────────────────────────────────────────────────────────────────────────────
// Glycemia
// ────────────────────────────────────────────────────────────────────────────────

app.get("/glycemia/__ping", (c) => c.text("ok"));
app.get("/glycemia/sessions", async (c) => {
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
app.post(
	"/glycemia/sessions",
	requireApiKey,
	zValidator("json", glycemiaSessionCreateSchema),
	async (c) => {
		const body = await c.req.json();
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
			if (!ins.success)
				return c.json(
					{
						error: "db_error",
					},
					500,
				);

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
				if (!pr.success)
					return c.json(
						{
							error: "db_error",
						},
						500,
					);
			}
			return c.json(
				{
					id: sid,
				},
				201,
			);
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
			if (!ins.success)
				return c.json(
					{
						error: "db_error",
					},
					500,
				);
			const warn = body.warnMinutesBefore ?? 10;

			for (let i = 0; i < 5; i++) {
				const pid = crypto.randomUUID();
				const expectedAt = body.points[i].expectedAt;
				const pr = await c.env.DB.prepare(
					"INSERT INTO glycemic_curve_points (id,session_id,idx,expected_at,glucose_mgdl,measured_at,warn_minutes_before,created_at,updated_at) VALUES (?1,?2,?3,?4,NULL,NULL,?5,?6,?7)",
				)
					.bind(pid, sid, i + 1, expectedAt, warn, ts, ts)
					.run();
				if (!pr.success)
					return c.json(
						{
							error: "db_error",
						},
						500,
					);
			}
			return c.json(
				{
					id: sid,
				},
				201,
			);
		}
	},
);

app.get("/glycemia/sessions/:id", async (c) => {
	const sid = c.req.param("id");
	const s = await c.env.DB.prepare(
		"SELECT * FROM glycemic_curve_sessions WHERE id = ?1",
	)
		.bind(sid)
		.all();
	if (!s.results || s.results.length === 0)
		return c.json(
			{
				error: "not_found",
			},
			404,
		);
	const p = await c.env.DB.prepare(
		"SELECT * FROM glycemic_curve_points WHERE session_id = ?1 ORDER BY idx ASC",
	)
		.bind(sid)
		.all();
	return c.json({
		session: s.results[0],
		points: p.results || [],
	});
});

app.put(
	"/glycemia/sessions/:id",
	requireApiKey,
	zValidator("json", glycemiaSessionUpdateSchema),
	async (c) => {
		const sid = c.req.param("id");
		const body = await c.req.json();
		const ts = nowIso();

		const s = await c.env.DB.prepare(
			"SELECT session_date FROM glycemic_curve_sessions WHERE id = ?1",
		)
			.bind(sid)
			.all();

		if (!s.results || s.results.length === 0)
			return c.json({ error: "not_found" }, 404);

		const currentDate = (s.results[0] as any).session_date as string;
		const nextDate = body.sessionDate ?? currentDate;

		if ("sessionDate" in body || "notes" in body) {
			const r = await c.env.DB.prepare(
				"UPDATE glycemic_curve_sessions SET session_date = COALESCE(?2, session_date), notes = COALESCE(?3, notes), updated_at = ?4 WHERE id = ?1",
			)
				.bind(sid, body.sessionDate ?? null, body.notes ?? null, ts)
				.run();
			if (!r.success) return c.json({ updated: false }, 200);
		}

		if (body.times && body.times.length === 5) {
			const off = body.offsetMinutes ?? 0;
			for (let i = 0; i < 5; i++) {
				const iso = isoFromLocal(nextDate, body.times[i], off);
				const ur = await c.env.DB.prepare(
					"UPDATE glycemic_curve_points SET expected_at = ?3, updated_at = ?4 WHERE session_id = ?1 AND idx = ?2",
				)
					.bind(sid, i + 1, iso, ts)
					.run();
				if (!ur.success) return c.json({ error: "db_error" }, 500);
			}
		}

		return c.json({ updated: true });
	},
);

app.put(
	"/glycemia/sessions/:id/points/:idx/expected",
	requireApiKey,
	zValidator("json", glycemiaPointExpectedUpdateSchema),
	async (c) => {
		const sid = c.req.param("id");
		const idx = parseInt(c.req.param("idx"), 10);
		const body = await c.req.json();
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

app.put(
	"/glycemia/sessions/:id/points/:idx",
	requireApiKey,
	zValidator("json", glycemiaPointUpdateSchema),
	async (c) => {
		const sid = c.req.param("id");
		const idx = parseInt(c.req.param("idx"), 10);
		const body = await c.req.json();
		const ts = nowIso();

		const ex = await c.env.DB.prepare(
			"SELECT id FROM glycemic_curve_points WHERE session_id = ?1 AND idx = ?2",
		)
			.bind(sid, idx)
			.all();
		if (!ex.results || ex.results.length === 0)
			return c.json(
				{
					error: "not_found",
				},
				404,
			);

		let measuredAtIso: string | null = body.measuredAt ?? null;
		if (body.measuredAtTime) {
			const s = await c.env.DB.prepare(
				"SELECT session_date FROM glycemic_curve_sessions WHERE id = ?1",
			)
				.bind(sid)
				.all();
			if (!s.results || s.results.length === 0)
				return c.json(
					{
						error: "session_not_found",
					},
					404,
				);
			const sessionDate = (s.results[0] as any).session_date as string;
			measuredAtIso = isoFromLocal(
				sessionDate,
				body.measuredAtTime,
				body.offsetMinutes,
			);
		}

		const r = await c.env.DB.prepare(
			"UPDATE glycemic_curve_points SET glucose_mgdl = COALESCE(?3, glucose_mgdl), glucose_str = COALESCE(?4, glucose_str), measured_at = COALESCE(?5, measured_at), dosage_clicks = COALESCE(?6, dosage_clicks), notes = COALESCE(?7, notes), updated_at = ?8 WHERE session_id = ?1 AND idx = ?2",
		)
			.bind(
				sid,
				idx,
				body.glucoseMgDl ?? null,
				body.glucoseStr ?? null,
				measuredAtIso ?? null,
				body.dosageClicks ?? null,
				body.notes ?? null,
				ts,
			)
			.run();

		return c.json({
			updated: r.success,
		});
	},
);

// ────────────────────────────────────────────────────────────────────────────────
// Lab
// ────────────────────────────────────────────────────────────────────────────────
app.post(
	"/lab/test-types",
	requireApiKey,
	zValidator("json", labTestTypeCreateSchema),
	async (c) => {
		const body = await c.req.json();
		const ts = nowIso();
		const ex = await c.env.DB.prepare(
			"SELECT id FROM lab_test_types WHERE name = ?1 COLLATE NOCASE",
		)
			.bind(body.name)
			.all();
		if (ex.results && ex.results.length > 0)
			return c.json({
				id: ex.results[0].id,
			});
		const id = crypto.randomUUID();
		const r = await c.env.DB.prepare(
			"INSERT INTO lab_test_types (id,name,unit,ref_low,ref_high,category,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7)",
		)
			.bind(
				id,
				body.name,
				body.unit ?? null,
				body.refLow ?? null,
				body.refHigh ?? null,
				body.category ?? null,
				ts,
			)
			.run();
		return c.json(
			{
				id,
			},
			r.success ? 201 : 500,
		);
	},
);

app.get("/lab/test-types", async (c) => {
	const q = c.req.query("q") || "";
	const r = q
		? await c.env.DB.prepare(
				"SELECT * FROM lab_test_types WHERE name LIKE ?1 COLLATE NOCASE ORDER BY name ASC",
		  )
				.bind(`%${q}%`)
				.all()
		: await c.env.DB.prepare(
				"SELECT * FROM lab_test_types ORDER BY name ASC",
		  ).all();
	return c.json(r.results || []);
});

app.post(
	"/lab/results",
	requireApiKey,
	zValidator("json", labResultCreateSchema),
	async (c) => {
		const body = await c.req.json();
		const ts = nowIso();
		const rid = crypto.randomUUID();

		const ins = await c.env.DB.prepare(
			"INSERT INTO lab_results (id,pet_id,collected_at,lab_name,vet_name,notes,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7)",
		)
			.bind(
				rid,
				body.petId,
				body.collectedAt,
				body.labName ?? null,
				body.vetName ?? null,
				body.notes ?? null,
				ts,
			)
			.run();
		if (!ins.success)
			return c.json(
				{
					error: "db_error",
				},
				500,
			);

		for (const v of body.values) {
			let typeId = v.testTypeId || "";
			if (!typeId && v.name) {
				const ex = await c.env.DB.prepare(
					"SELECT id,unit FROM lab_test_types WHERE name = ?1 COLLATE NOCASE",
				)
					.bind(v.name)
					.all();
				if (ex.results && ex.results.length > 0) {
					typeId = ex.results[0].id as string;
				} else {
					const nid = crypto.randomUUID();
					const cr = await c.env.DB.prepare(
						"INSERT INTO lab_test_types (id,name,unit,created_at) VALUES (?1,?2,?3,?4)",
					)
						.bind(nid, v.name, v.unit ?? null, ts)
						.run();
					if (!cr.success)
						return c.json(
							{
								error: "db_error",
							},
							500,
						);
					typeId = nid;
				}
			}
			const vid = crypto.randomUUID();
			const rr = await c.env.DB.prepare(
				"INSERT INTO lab_result_values (id,result_id,test_type_id,value,unit,created_at) VALUES (?1,?2,?3,?4,?5,?6)",
			)
				.bind(vid, rid, typeId, v.value, v.unit ?? null, ts)
				.run();
			if (!rr.success)
				return c.json(
					{
						error: "db_error",
					},
					500,
				);
		}
		return c.json(
			{
				id: rid,
			},
			201,
		);
	},
);

app.get("/lab/results", async (c) => {
	const petId = c.req.query("petId");
	const limit = Math.min(int(c.req.query("limit"), 50), 200);
	const offset = int(c.req.query("offset"), 0);
	if (!petId) return c.json([]);
	const results = await c.env.DB.prepare(
		"SELECT * FROM lab_results WHERE pet_id = ?1 ORDER BY collected_at DESC LIMIT ?2 OFFSET ?3",
	)
		.bind(petId, limit, offset)
		.all();
	const rows = results.results || [];
	const out = [] as any[];
	for (const r of rows as any[]) {
		const vals = await c.env.DB.prepare(
			"SELECT v.*, t.name as test_name FROM lab_result_values v JOIN lab_test_types t ON v.test_type_id = t.id WHERE v.result_id = ?1 ORDER BY t.name",
		)
			.bind(r.id)
			.all();
		out.push({
			...r,
			values: vals.results || [],
		});
	}
	return c.json(out);
});

// ────────────────────────────────────────────────────────────────────────────────
// Vaccines
// ────────────────────────────────────────────────────────────────────────────────
app.post(
	"/vaccines/types",
	requireApiKey,
	zValidator("json", vaccineTypeCreateSchema),
	async (c) => {
		const body = await c.req.json();
		const ts = nowIso();
		const ex = await c.env.DB.prepare(
			"SELECT id FROM vaccine_types WHERE name = ?1 COLLATE NOCASE",
		)
			.bind(body.name)
			.all();
		if (ex.results && ex.results.length > 0)
			return c.json({
				id: ex.results[0].id,
			});
		const id = crypto.randomUUID();
		const r = await c.env.DB.prepare(
			"INSERT INTO vaccine_types (id,name,total_doses,description,created_at) VALUES (?1,?2,?3,?4,?5)",
		)
			.bind(
				id,
				body.name,
				body.totalDoses ?? 1,
				body.description ?? null,
				ts,
			)
			.run();
		return c.json(
			{
				id,
			},
			r.success ? 201 : 500,
		);
	},
);

app.get("/vaccines/types", async (c) => {
	const q = c.req.query("q") || "";
	const r = q
		? await c.env.DB.prepare(
				"SELECT * FROM vaccine_types WHERE name LIKE ?1 COLLATE NOCASE ORDER BY name ASC",
		  )
				.bind(`%${q}%`)
				.all()
		: await c.env.DB.prepare(
				"SELECT * FROM vaccine_types ORDER BY name ASC",
		  ).all();
	return c.json(r.results || []);
});

app.post(
	"/vaccines/applications",
	requireApiKey,
	zValidator("json", vaccineApplicationCreateSchema),
	async (c) => {
		const body = await c.req.json();
		const ts = nowIso();
		const id = crypto.randomUUID();
		const r = await c.env.DB.prepare(
			"INSERT INTO vaccine_applications (id,pet_id,vaccine_type_id,dose_number,administered_at,administered_by,clinic,next_dose_at,notes,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
		)
			.bind(
				id,
				body.petId,
				body.vaccineTypeId,
				body.doseNumber,
				body.administeredAt,
				body.administeredBy ?? null,
				body.clinic ?? null,
				body.nextDoseAt ?? null,
				body.notes ?? null,
				ts,
			)
			.run();
		return c.json(
			{
				id,
			},
			r.success ? 201 : 500,
		);
	},
);

app.get("/vaccines/applications", async (c) => {
	const petId = c.req.query("petId");
	const limit = Math.min(int(c.req.query("limit"), 50), 200);
	const offset = int(c.req.query("offset"), 0);
	if (!petId) return c.json([]);
	const r = await c.env.DB.prepare(
		"SELECT * FROM vaccine_applications WHERE pet_id = ?1 ORDER BY administered_at DESC LIMIT ?2 OFFSET ?3",
	)
		.bind(petId, limit, offset)
		.all();
	return c.json(r.results || []);
});

// ────────────────────────────────────────────────────────────────────────────────
// Treatments
// ────────────────────────────────────────────────────────────────────────────────
app.post(
	"/treatments",
	requireApiKey,
	zValidator("json", treatmentCreateSchema),
	async (c) => {
		const body = await c.req.json();
		const ts = nowIso();
		const id = crypto.randomUUID();
		const r = await c.env.DB.prepare(
			"INSERT INTO pet_treatments (id,pet_id,type,type_label,product_name,administered_at,next_due_at,dose_info,notes,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
		)
			.bind(
				id,
				body.petId,
				body.type,
				body.typeLabel,
				body.productName ?? null,
				body.administeredAt,
				body.nextDueAt ?? null,
				body.doseInfo ?? null,
				body.notes ?? null,
				ts,
			)
			.run();
		return c.json(
			{
				id,
			},
			r.success ? 201 : 500,
		);
	},
);

app.get("/treatments", async (c) => {
	const petId = c.req.query("petId");
	const r = petId
		? await c.env.DB.prepare(
				"SELECT * FROM pet_treatments WHERE pet_id = ?1 ORDER BY administered_at DESC",
		  )
				.bind(petId)
				.all()
		: await c.env.DB.prepare(
				"SELECT * FROM pet_treatments ORDER BY administered_at DESC",
		  ).all();
	return c.json(r.results || []);
});

// ────────────────────────────────────────────────────────────────────────────────
// Vet visits
// ────────────────────────────────────────────────────────────────────────────────
app.post(
	"/vet/visits",
	requireApiKey,
	zValidator("json", vetVisitCreateSchema),
	async (c) => {
		const body = await c.req.json();
		const ts = nowIso();
		const id = crypto.randomUUID();
		const r = await c.env.DB.prepare(
			"INSERT INTO vet_visits (id,pet_id,visited_at,is_emergency,vet_name,clinic,notes,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
		)
			.bind(
				id,
				body.petId,
				body.visitedAt,
				body.isEmergency ? 1 : 0,
				body.vetName ?? null,
				body.clinic ?? null,
				body.notes ?? null,
				ts,
			)
			.run();
		return c.json(
			{
				id,
			},
			r.success ? 201 : 500,
		);
	},
);

app.get("/vet/visits", async (c) => {
	const petId = c.req.query("petId");
	const r = petId
		? await c.env.DB.prepare(
				"SELECT * FROM vet_visits WHERE pet_id = ?1 ORDER BY visited_at DESC",
		  )
				.bind(petId)
				.all()
		: await c.env.DB.prepare(
				"SELECT * FROM vet_visits ORDER BY visited_at DESC",
		  ).all();
	return c.json(r.results || []);
});

// ────────────────────────────────────────────────────────────────────────────────
// Alerts
// ────────────────────────────────────────────────────────────────────────────────
app.get("/alerts/due", zValidator("query", alertsQuerySchema), async (c) => {
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
		"SELECT id,name,birth_month,birth_day FROM pets WHERE birth_month IS NOT NULL AND birth_day IS NOT NULL",
	).all();

	const birthdays = (pets.results || [])
		.map((p: any) => ({
			pet_id: p.id,
			pet_name: p.name,
			at: nextBirthdayIso(p.birth_month, p.birth_day, offsetMinutes),
		}))
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

// ────────────────────────────────────────────────────────────────────────────────
// OpenAPI / Swagger UI
// ────────────────────────────────────────────────────────────────────────────────

// Registra os schemas (componentes) a partir dos seus validators Zod:
registry.register("PetCreate", petCreateSchema);
registry.register("PetUpdate", petUpdateSchema);
registry.register("WeightCreate", weightCreateSchema);
registry.register("GlycemiaSessionCreate", glycemiaSessionCreateSchema);
registry.register("GlycemiaPointUpdate", glycemiaPointUpdateSchema);
registry.register("LabTestTypeCreate", labTestTypeCreateSchema);
registry.register("LabResultCreate", labResultCreateSchema);
registry.register("VaccineTypeCreate", vaccineTypeCreateSchema);
registry.register("VaccineApplicationCreate", vaccineApplicationCreateSchema);
registry.register("TreatmentCreate", treatmentCreateSchema);
registry.register("VetVisitCreate", vetVisitCreateSchema);
registry.register("AlertsQuery", alertsQuerySchema);

// Pequenos schemas auxiliares só para query params comuns:
const ListQuery = z.object({
	q: z.string().optional(),
	limit: z.number().int().min(1).max(500).optional(),
	offset: z.number().int().min(0).optional(),
});
const PetIdQuery = z.object({
	petId: z.string().uuid(),
});

// Paths principais (respostas com `z.any()` para manter simples e compatível com seu schema atual)
const okArray = z.array(z.any());
const okObj = z.any();

// Pets
registry.registerPath({
	method: "get",
	path: "/pets",
	summary: "Listar pets",
	request: {
		query: ListQuery,
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: okArray,
				},
			},
		},
	},
});
registry.registerPath({
	method: "get",
	path: "/pets/{id}",
	summary: "Detalhar pet",
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: okObj,
				},
			},
		},
	},
});
registry.registerPath({
	method: "post",
	path: "/pets",
	summary: "Criar pet",
	request: {
		body: {
			content: {
				"application/json": {
					schema: petCreateSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Criado",
			content: {
				"application/json": {
					schema: okObj,
				},
			},
		},
	},
});
registry.registerPath({
	method: "put",
	path: "/pets/{id}",
	summary: "Atualizar pet",
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
		body: {
			content: {
				"application/json": {
					schema: petUpdateSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: okObj,
				},
			},
		},
	},
});
registry.registerPath({
	method: "delete",
	path: "/pets/{id}",
	summary: "Excluir pet",
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: okObj,
				},
			},
		},
	},
});
registry.registerPath({
	method: "get",
	path: "/pets/{id}/weights",
	summary: "Listar pesos do pet",
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
		query: ListQuery,
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: okArray,
				},
			},
		},
	},
});
registry.registerPath({
	method: "post",
	path: "/pets/{id}/weights",
	summary: "Inserir peso do pet",
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
		body: {
			content: {
				"application/json": {
					schema: weightCreateSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Criado",
			content: {
				"application/json": {
					schema: okObj,
				},
			},
		},
	},
});

// Glycemia
registry.registerPath({
	method: "post",
	path: "/glycemia/sessions",
	summary: "Criar sessão de curva glicêmica",
	request: {
		body: {
			content: {
				"application/json": {
					schema: glycemiaSessionCreateSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Criado",
			content: {
				"application/json": {
					schema: okObj,
				},
			},
		},
	},
});
registry.registerPath({
	method: "get",
	path: "/glycemia/sessions/{id}",
	summary: "Detalhar sessão de curva glicêmica",
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: okObj,
				},
			},
		},
	},
});
registry.registerPath({
	method: "put",
	path: "/glycemia/sessions/{id}/points/{idx}",
	summary: "Atualizar ponto da curva glicêmica",
	request: {
		params: z.object({
			id: z.string().uuid(),
			idx: z.string(),
		}),
		body: {
			content: {
				"application/json": {
					schema: glycemiaPointUpdateSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: okObj,
				},
			},
		},
	},
});

// Lab
registry.registerPath({
	method: "get",
	path: "/lab/test-types",
	summary: "Listar tipos de exame",
	request: {
		// 👇 o objeto NÃO é optional; o CAMPO "q" é optional
		query: z.object({
			q: z.string().optional(),
		}),
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: z.array(
						z.object({
							id: z.string(),
							name: z.string(),
							unit: z.string().nullable().optional(),
							ref_low: z.number().nullable().optional(),
							ref_high: z.number().nullable().optional(),
							category: z.string().nullable().optional(),
							created_at: z.string(),
						}),
					),
				},
			},
		},
	},
});
registry.registerPath({
	method: "get",
	path: "/lab/test-types",
	summary: "Listar tipos de exame",
	request: {
		query: z.object({
			q: z.string().optional(),
		}),
	},

	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: okArray,
				},
			},
		},
	},
});
registry.registerPath({
	method: "post",
	path: "/lab/results",
	summary: "Criar resultado de exame",
	request: {
		body: {
			content: {
				"application/json": {
					schema: labResultCreateSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Criado",
			content: {
				"application/json": {
					schema: okObj,
				},
			},
		},
	},
});
registry.registerPath({
	method: "get",
	path: "/lab/results",
	summary: "Listar resultados de exame (por pet)",
	request: {
		query: PetIdQuery.merge(ListQuery.partial()),
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: okArray,
				},
			},
		},
	},
});

// Vaccines
registry.registerPath({
	method: "get",
	path: "/vaccines/types",
	summary: "Listar tipos de vacina",
	request: {
		query: z.object({
			q: z.string().optional(),
		}),
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: z.array(
						z.object({
							id: z.string(),
							name: z.string(),
							total_doses: z.number(),
							description: z.string().nullable().optional(),
							created_at: z.string(),
						}),
					),
				},
			},
		},
	},
});

registry.registerPath({
	method: "get",
	path: "/vaccines/types",
	summary: "Listar tipos de vacina",
	request: {
		query: z.object({
			q: z.string().optional(),
		}),
	},

	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: okArray,
				},
			},
		},
	},
});
registry.registerPath({
	method: "post",
	path: "/vaccines/applications",
	summary: "Registrar aplicação de vacina",
	request: {
		body: {
			content: {
				"application/json": {
					schema: vaccineApplicationCreateSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Criado",
			content: {
				"application/json": {
					schema: okObj,
				},
			},
		},
	},
});
registry.registerPath({
	method: "get",
	path: "/vaccines/applications",
	summary: "Listar aplicações de vacina (por pet)",
	request: {
		query: PetIdQuery.merge(ListQuery.partial()),
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: okArray,
				},
			},
		},
	},
});

// Treatments
registry.registerPath({
	method: "post",
	path: "/treatments",
	summary: "Criar tratamento",
	request: {
		body: {
			content: {
				"application/json": {
					schema: treatmentCreateSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Criado",
			content: {
				"application/json": {
					schema: okObj,
				},
			},
		},
	},
});
registry.registerPath({
	method: "get",
	path: "/treatments",
	summary: "Listar tratamentos (opcional por pet)",
	request: {
		query: z.object({
			petId: z.string().uuid().optional(),
		}),
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: okArray,
				},
			},
		},
	},
});

// Vet visits
registry.registerPath({
	method: "post",
	path: "/vet/visits",
	summary: "Registrar visita ao veterinário",
	request: {
		body: {
			content: {
				"application/json": {
					schema: vetVisitCreateSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Criado",
			content: {
				"application/json": {
					schema: okObj,
				},
			},
		},
	},
});
registry.registerPath({
	method: "get",
	path: "/vet/visits",
	summary: "Listar visitas (opcional por pet)",
	request: {
		query: z.object({
			petId: z.string().uuid().optional(),
		}),
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: okArray,
				},
			},
		},
	},
});

// Alerts
registry.registerPath({
	method: "get",
	path: "/alerts/due",
	summary: "Alertas próximos (aniversários, vacinas, glicemia)",
	request: {
		query: z.object({
			days: z.coerce.number().int().min(1).max(365).optional(),
			minutes: z.coerce.number().int().min(1).max(120).optional(),
			offsetMinutes: z.coerce
				.number()
				.int()
				.min(-720)
				.max(720)
				.optional(),
		}),
	},
	responses: {
		200: {
			description: "OK",
			content: {
				"application/json": {
					schema: z.object({
						birthdays: z.array(
							z.object({
								pet_id: z.string(),
								pet_name: z.string(),
								at: z.string(), // ISO
							}),
						),
						vaccines: z.array(
							z.object({
								id: z.string(),
								pet_id: z.string(),
								vaccine_type_id: z.string(),
								dose_number: z.number(),
								administered_at: z.string(),
								administered_by: z
									.string()
									.nullable()
									.optional(),
								clinic: z.string().nullable().optional(),
								next_dose_at: z.string().nullable().optional(),
								notes: z.string().nullable().optional(),
								created_at: z.string(),
								vaccine_name: z.string(), // join
							}),
						),
						glycemia: z.array(
							z.object({
								session_id: z.string(),
								idx: z.number().int(),
								expected_at: z.string(),
								pet_id: z.string(),
							}),
						),
					}),
				},
			},
		},
	},
});

// Gera o documento OpenAPI (uma vez no boot)
const generator = new OpenApiGeneratorV3(registry.definitions);

const openapiDoc = generator.generateDocument({
	openapi: "3.0.0",
	info: {
		title: "Pet API",
		version: "1.0.0",
	},
	servers: [
		// ajuste se quiser exibir base url no Swagger
		{
			url: "/",
		},
	],
});

// Endpoint com o JSON do OpenAPI
app.get("/openapi.json", (c) => c.json(openapiDoc));

// Swagger UI
app.get(
	"/docs",
	swaggerUI({
		url: "/openapi.json",
	}),
);

// ────────────────────────────────────────────────────────────────────────────────
export default app;
