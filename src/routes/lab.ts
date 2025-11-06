import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireApiKey } from "../lib/auth";
import { int, nowIso } from "../lib/utils";
import {
	LabResultCreateSchema,
	LabTestTypeCreateSchema,
	LabTestTypeUpdateSchema,
} from "../schemas";

type Env = { Bindings: { DB: D1Database; API_KEY?: string } };

export const lab = new Hono<Env>();

lab.post(
	"/test-types",
	zValidator("json", LabTestTypeCreateSchema),
	async (c) => {
		const b = c.req.valid("json");
		const id = crypto.randomUUID();
		const ts = nowIso();
		try {
			await c.env.DB.prepare(
				`INSERT INTO lab_test_types
		   (id, name, species, unit, ref_low, ref_high, category, created_at, updated_at)
		   VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)`,
			)
				.bind(
					id,
					(b as any).name,
					(b as any).species ?? "other",
					(b as any).unit ?? null,
					(b as any).refLow ?? null,
					(b as any).refHigh ?? null,
					(b as any).category ?? null,
					ts,
				)
				.run();
			return c.json({ id }, 201);
		} catch (e: any) {
			const msg = String(e?.cause?.message || e?.message || "");
			if (msg.includes("UNIQUE") || msg.includes("constraint failed")) {
				return c.json(
					{
						error: "duplicate",
						field: "name",
						species: (b as any).species ?? "other",
					},
					409,
				);
			}
			return c.json({ error: "server_error" }, 500);
		}
	},
);

lab.put(
	"/test-types/:id",
	zValidator("json", LabTestTypeUpdateSchema),
	async (c) => {
		const id = c.req.param("id");
		const b = c.req.valid("json");
		const ts = nowIso();
		try {
			await c.env.DB.prepare(
				`UPDATE lab_test_types SET
			 name = COALESCE(?2, name),
			 species = COALESCE(?3, species),
			 unit = COALESCE(?4, unit),
			 ref_low = COALESCE(?5, ref_low),
			 ref_high = COALESCE(?6, ref_high),
			 category = COALESCE(?7, category),
			 updated_at = ?8
		   WHERE id = ?1`,
			)
				.bind(
					id,
					(b as any).name ?? null,
					(b as any).species ?? null,
					(b as any).unit ?? null,
					(b as any).refLow ?? null,
					(b as any).refHigh ?? null,
					(b as any).category ?? null,
					ts,
				)
				.run();

			const row = await c.env.DB.prepare(
				"SELECT * FROM lab_test_types WHERE id=?1",
			)
				.bind(id)
				.first();
			if (!row) return c.json({ error: "not_found" }, 404);
			return c.json(row);
		} catch (e: any) {
			const msg = String(e?.cause?.message || e?.message || "");
			if (msg.includes("UNIQUE") || msg.includes("constraint failed")) {
				return c.json({ error: "duplicate" }, 409);
			}
			return c.json({ error: "server_error" }, 500);
		}
	},
);

lab.get("/test-types", async (c) => {
	const url = new URL(c.req.url);
	const q = url.searchParams.get("q");
	const species = url.searchParams.get("species");
	let sql = "SELECT * FROM lab_test_types";
	const where: string[] = [];
	const binds: any[] = [];

	if (q) {
		where.push("LOWER(name) LIKE ?1");
		binds.push(`%${q.toLowerCase()}%`);
	}
	if (species) {
		where.push("species = ?2");
		binds.push(species);
	}
	if (where.length) sql += " WHERE " + where.join(" AND ");
	sql += " ORDER BY name";

	const rows = await c.env.DB.prepare(sql)
		.bind(...binds)
		.all();
	return c.json(rows.results || []);
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
				(body as any).petId,
				(body as any).collectedAt,
				(body as any).labName ?? null,
				(body as any).vetName ?? null,
				(body as any).notes ?? null,
				ts,
			)
			.run();
		if (!ins.success) return c.json({ error: "db_error" }, 500);

		for (const v of (body as any).values) {
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
	const out: any[] = [];
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
