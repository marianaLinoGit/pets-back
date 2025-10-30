import { Hono } from "hono";
import { z } from "zod";

type Env = { Bindings: { DB: D1Database; API_KEY?: string } };

export const vaccines = new Hono<Env>();

const SpeciesEnum = z.enum(["dog", "cat", "other"]);

const QueryListSchema = z.object({
	q: z.string().optional(),
	species: SpeciesEnum.optional(),
});

const VaccineTypeCreateBody = z.object({
	name: z.string().min(1),
	totalDoses: z.number().int().min(1).max(12),
	description: z.string().nullable().optional(),
	species: SpeciesEnum.default("other"),
	brand: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
});

const VaccineTypeUpdateBody = VaccineTypeCreateBody.partial();

vaccines.get("/types", async (c) => {
	const parsed = QueryListSchema.safeParse(c.req.query());
	if (!parsed.success) return c.json({ error: "bad_query" }, 400);

	const q = parsed.data.q?.trim();
	const species = parsed.data.species;

	const where: string[] = [];
	const params: any[] = [];

	if (q) {
		where.push("(name LIKE ? OR description LIKE ? OR brand LIKE ?)");
		params.push(`%${q}%`, `%${q}%`, `%${q}%`);
	}
	if (species) {
		where.push("species = ?");
		params.push(species);
	}

	const sql =
		`SELECT id, name, total_doses, description, species, brand, notes, created_at
     FROM vaccine_types` +
		(where.length ? ` WHERE ${where.join(" AND ")}` : "") +
		` ORDER BY name ASC`;

	const rs = await c.env.DB.prepare(sql)
		.bind(...params)
		.all();
	return c.json(rs.results || []);
});

vaccines.post("/types", async (c) => {
	const raw = await c.req.json();
	const parsed = VaccineTypeCreateBody.safeParse(raw);
	if (!parsed.success) return c.json({ error: "bad_body" }, 400);

	const b = parsed.data;

	const dup = await c.env.DB.prepare(
		"SELECT id FROM vaccine_types WHERE LOWER(name)=LOWER(?) AND species=? LIMIT 1",
	)
		.bind(b.name, b.species)
		.first();
	if (dup) return c.json({ error: "duplicate" }, 409);

	const ins = await c.env.DB.prepare(
		`INSERT INTO vaccine_types
      (id, name, total_doses, description, species, brand, notes, created_at)
     VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, datetime('now'))`,
	)
		.bind(
			b.name,
			b.totalDoses,
			b.description ?? null,
			b.species,
			b.brand ?? null,
			b.notes ?? null,
		)
		.run();

	const last = await c.env.DB.prepare(
		"SELECT id FROM vaccine_types WHERE rowid = ?",
	)
		.bind(ins.meta.last_row_id)
		.first<string>();

	return c.json({ id: (last as any)?.id }, 201);
});

vaccines.put("/types/:id", async (c) => {
	const id = c.req.param("id");
	if (!id) return c.json({ error: "missing_id" }, 400);

	const raw = await c.req.json().catch(() => ({}));
	const parsed = VaccineTypeUpdateBody.safeParse(raw);
	if (!parsed.success) return c.json({ error: "bad_body" }, 400);

	const b = parsed.data;

	const fields: string[] = [];
	const vals: any[] = [];

	if (b.name !== undefined) {
		fields.push("name = ?");
		vals.push(b.name);
	}
	if (b.totalDoses !== undefined) {
		fields.push("total_doses = ?");
		vals.push(b.totalDoses);
	}
	if (b.description !== undefined) {
		fields.push("description = ?");
		vals.push(b.description);
	}
	if (b.species !== undefined) {
		fields.push("species = ?");
		vals.push(b.species);
	}
	if (b.brand !== undefined) {
		fields.push("brand = ?");
		vals.push(b.brand);
	}
	if (b.notes !== undefined) {
		fields.push("notes = ?");
		vals.push(b.notes);
	}

	if (!fields.length) return c.json({ updated: false });

	const rs = await c.env.DB.prepare(
		`UPDATE vaccine_types SET ${fields.join(", ")} WHERE id = ?`,
	)
		.bind(...vals, id)
		.run();

	if (!rs.meta.changes) return c.json({ error: "not_found" }, 404);
	return c.json({ updated: true });
});

vaccines.post("/applications", async (c) => {
	const raw = await c.req.json();
	const body = z
		.object({
			petId: z.string(),
			vaccineTypeId: z.string(),
			doseNumber: z.number().int().min(1),
			administeredAt: z.string(),
			administeredBy: z.string().nullable().optional(),
			clinic: z.string().nullable().optional(),
			nextDoseAt: z.string().nullable().optional(),
			notes: z.string().nullable().optional(),
		})
		.parse(raw);

	const ins = await c.env.DB.prepare(
		`INSERT INTO vaccine_applications
      (id, pet_id, vaccine_type_id, dose_number, administered_at, administered_by, clinic, next_dose_at, notes, created_at)
     VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
	)
		.bind(
			body.petId,
			body.vaccineTypeId,
			body.doseNumber,
			body.administeredAt,
			body.administeredBy ?? null,
			body.clinic ?? null,
			body.nextDoseAt ?? null,
			body.notes ?? null,
		)
		.run();

	const last = await c.env.DB.prepare(
		"SELECT id FROM vaccine_applications WHERE rowid = ?",
	)
		.bind(ins.meta.last_row_id)
		.first<string>();

	return c.json({ id: (last as any)?.id }, 201);
});

vaccines.get("/applications", async (c) => {
	const qp = z
		.object({
			petId: z.string().optional(),
			limit: z.coerce.number().int().min(1).max(200).optional(),
			offset: z.coerce.number().int().min(0).optional(),
		})
		.parse(c.req.query());

	const where: string[] = [];
	const vals: any[] = [];

	if (qp.petId) {
		where.push("va.pet_id = ?");
		vals.push(qp.petId);
	}

	const sql =
		`SELECT va.id, va.pet_id, va.vaccine_type_id, va.dose_number, va.administered_at,
            va.administered_by, va.clinic, va.next_dose_at, va.notes, va.created_at,
            vt.name AS vaccine_name
       FROM vaccine_applications va
       JOIN vaccine_types vt ON vt.id = va.vaccine_type_id` +
		(where.length ? ` WHERE ${where.join(" AND ")}` : "") +
		` ORDER BY va.administered_at DESC
       LIMIT ? OFFSET ?`;

	vals.push(qp.limit ?? 100);
	vals.push(qp.offset ?? 0);

	const rs = await c.env.DB.prepare(sql)
		.bind(...vals)
		.all();
	return c.json(rs.results || []);
});
