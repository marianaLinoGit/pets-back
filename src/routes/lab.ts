import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireApiKey } from "../lib/auth";
import { int, nowIso } from "../lib/utils";
import { LabResultCreateSchema, LabTestTypeCreateSchema } from "../schemas";

type Env = { Bindings: { DB: D1Database; API_KEY?: string } };

export const lab = new Hono<Env>();

lab.post(
	"/test-types",
	requireApiKey,
	zValidator("json", LabTestTypeCreateSchema),
	async (c) => {
		const body = c.req.valid("json");
		const ts = nowIso();
		const ex = await c.env.DB.prepare(
			"SELECT id FROM lab_test_types WHERE name = ?1 COLLATE NOCASE",
		)
			.bind(body.name)
			.all();
		if (ex.results && ex.results.length > 0)
			return c.json({ id: ex.results[0].id });
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
		return c.json({ id }, r.success ? 201 : 500);
	},
);

lab.get("/test-types", async (c) => {
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

lab.post(
	"/results",
	requireApiKey,
	zValidator("json", LabResultCreateSchema),
	async (c) => {
		const body = c.req.valid("json");
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
		if (!ins.success) return c.json({ error: "db_error" }, 500);

		for (const v of body.values) {
			let typeId = (v as any).testTypeId || "";
			if (!typeId && (v as any).name) {
				const ex = await c.env.DB.prepare(
					"SELECT id,unit FROM lab_test_types WHERE name = ?1 COLLATE NOCASE",
				)
					.bind((v as any).name)
					.all();
				if (ex.results && ex.results.length > 0) {
					typeId = ex.results[0].id as string;
				} else {
					const nid = crypto.randomUUID();
					const cr = await c.env.DB.prepare(
						"INSERT INTO lab_test_types (id,name,unit,created_at) VALUES (?1,?2,?3,?4)",
					)
						.bind(nid, (v as any).name, (v as any).unit ?? null, ts)
						.run();
					if (!cr.success) return c.json({ error: "db_error" }, 500);
					typeId = nid;
				}
			}
			const vid = crypto.randomUUID();
			const rr = await c.env.DB.prepare(
				"INSERT INTO lab_result_values (id,result_id,test_type_id,value,unit,created_at) VALUES (?1,?2,?3,?4,?5,?6)",
			)
				.bind(
					vid,
					rid,
					typeId,
					(v as any).value,
					(v as any).unit ?? null,
					ts,
				)
				.run();
			if (!rr.success) return c.json({ error: "db_error" }, 500);
		}
		return c.json({ id: rid }, 201);
	},
);

lab.get("/results", async (c) => {
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
		out.push({ ...r, values: vals.results || [] });
	}
	return c.json(out);
});
