import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireApiKey } from "../lib/auth";
import { int, nowIso } from "../lib/utils";
import {
	VaccineApplicationCreateSchema,
	VaccineTypeCreateSchema,
} from "../schemas";

type Env = { Bindings: { DB: D1Database; API_KEY?: string } };

export const vaccines = new Hono<Env>();

vaccines.post(
	"/types",
	requireApiKey,
	zValidator("json", VaccineTypeCreateSchema),
	async (c) => {
		const body = c.req.valid("json");
		const ts = nowIso();
		const ex = await c.env.DB.prepare(
			"SELECT id FROM vaccine_types WHERE name = ?1 COLLATE NOCASE",
		)
			.bind(body.name)
			.all();
		if (ex.results && ex.results.length > 0)
			return c.json({ id: ex.results[0].id });
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
		return c.json({ id }, r.success ? 201 : 500);
	},
);

vaccines.get("/types", async (c) => {
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

vaccines.post(
	"/applications",
	requireApiKey,
	zValidator("json", VaccineApplicationCreateSchema),
	async (c) => {
		const body = c.req.valid("json");
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
		return c.json({ id }, r.success ? 201 : 500);
	},
);

vaccines.get("/applications", async (c) => {
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
