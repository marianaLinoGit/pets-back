import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { nowIso } from "../lib/utils";
import {
	VaccineApplicationCreateSchema,
	VaccineSpecies,
	VaccineTypeCreateSchema,
	VaccineTypeUpdateInSchema,
} from "../schemas";

type Env = { Bindings: { DB: D1Database; API_KEY?: string } };

const isStr = (v: unknown): v is string => typeof v === "string";
const normOrEmpty = (v: string | null | undefined) =>
	(isStr(v) ? v.trim() : "") as string;

export const vaccines = new Hono<Env>();

const QueryListSchema = z.object({
	q: z.string().optional(),
	species: VaccineSpecies.optional(),
});

vaccines.get("/types", async (c) => {
	const parsed = QueryListSchema.safeParse(c.req.query());
	if (!parsed.success) return c.json({ error: "bad_query" }, 400);

	const q = parsed.data.q?.trim();
	const species = parsed.data.species;

	const where: string[] = [];
	const params: any[] = [];

	if (q) {
		where.push("(name_biz LIKE ? OR description LIKE ? OR brand LIKE ?)");
		params.push(`%${q}%`, `%${q}%`, `%${q}%`);
	}
	if (species) {
		where.push("species = ?");
		params.push(species);
	}

	const sql =
		`SELECT id, name_biz AS name, total_doses, description, species, brand, notes, created_at, updated_at
   FROM vaccine_types` +
		(where.length
			? ` WHERE ${where
					.map((w) => w.replace(/\bname\b/g, "name_biz"))
					.join(" AND ")}`
			: "") +
		` ORDER BY name_biz ASC`;

	const rs = await c.env.DB.prepare(sql)
		.bind(...params)
		.all();
	return c.json(rs.results || []);
});

vaccines.post(
	"/types",
	zValidator("json", VaccineTypeCreateSchema),
	async (c) => {
		const b = c.req.valid("json");
		const id = crypto.randomUUID();

		const nameBiz = b.name.trim();
		const brandNorm = (b.brand ?? "").trim();
		const species = b.species;

		const exists = await c.env.DB.prepare(
			`SELECT 1 FROM vaccine_types
			 WHERE species=?1 AND name_biz=?2 AND brand=?3
			 LIMIT 1`,
		)
			.bind(species, nameBiz, brandNorm)
			.first();

		if (exists) return c.json({ error: "duplicate_name_brand" }, 409);

		const r = await c.env.DB.prepare(
			`INSERT INTO vaccine_types
			 (id, name_biz, total_doses, description, species, brand, notes)
			 VALUES (?1,?2,?3,?4,?5,?6,?7)`,
		)
			.bind(
				id,
				nameBiz,
				b.total_doses,
				b.description ?? null,
				b.species,
				brandNorm,
				b.notes ?? null,
			)
			.run();

		if (!r.success) return c.json({ created: false }, 500);
		return c.json({ id }, 201);
	},
);

vaccines.put(
	"/types/:id",
	zValidator("json", VaccineTypeUpdateInSchema),
	async (c) => {
		const id = c.req.param("id");
		const body = VaccineTypeCreateSchema.parse(c.req.valid("json"));

		const row = await c.env.DB.prepare(
			`SELECT name_biz AS name, species, brand FROM vaccine_types WHERE id=?1`,
		)
			.bind(id)
			.first();
		if (!row) return c.json({ error: "not_found" }, 404);

		const cur = row as {
			name: string;
			species: "dog" | "cat" | "other";
			brand: string;
		};

		const nextNameBiz = body.name ?? cur.name;
		const nextSpecies = body.species ?? cur.species;
		const nextBrand =
			body.brand !== undefined
				? typeof body.brand === "string"
					? body.brand.trim()
					: ""
				: cur.brand;

		const dupe = await c.env.DB.prepare(
			`SELECT 1 FROM vaccine_types
					 WHERE species=?1 AND name_biz=?2 AND brand=?3 AND id<>?4
					 LIMIT 1`,
		)
			.bind(nextSpecies, nextNameBiz, nextBrand, id)
			.first();
		if (dupe) return c.json({ error: "duplicate_name_brand" }, 409);

		const dupeCombo = await c.env.DB.prepare(
			`SELECT 1 FROM vaccine_types
			 WHERE species=?1 AND name=?2 AND brand=?3 AND id<>?4
			 LIMIT 1`,
		)
			.bind(nextSpecies, nextNameBiz, nextBrand, id)
			.first();
		if (dupeCombo) {
			return c.json(
				{
					error: "duplicate_name_brand",
					fields: ["species", "name", "brand"],
				},
				409,
			);
		}

		const r = await c.env.DB.prepare(
			`UPDATE vaccine_types SET
			   name_biz = COALESCE(?2, name_biz),
			   total_doses = COALESCE(?3, total_doses),
			   description = COALESCE(?4, description),
			   species = COALESCE(?5, species),
			   brand = COALESCE(?6, brand),
			   notes = COALESCE(?7, notes)
			 WHERE id = ?1`,
		)
			.bind(
				id,
				body.name !== undefined ? nextNameBiz : null,
				body.total_doses ?? null,
				body.description ?? null,
				body.species ?? null,
				body.brand !== undefined ? nextBrand : null,
				body.notes ?? null,
			)
			.run();

		if (!r.success) return c.json({ updated: false }, 500);

		const out = await c.env.DB.prepare(
			`SELECT id, name_biz AS name, total_doses, description, species, brand, notes, created_at, updated_at
			 FROM vaccine_types WHERE id=?1`,
		)
			.bind(id)
			.first();

		return c.json(out);
	},
);

vaccines.post(
	"/applications",
	zValidator("json", VaccineApplicationCreateSchema),
	async (c) => {
		const b = c.req.valid("json") as any;
		const id = crypto.randomUUID();
		const ts = nowIso();

		const r = await c.env.DB.prepare(
			`INSERT INTO vaccine_applications
       (id, pet_id, vaccine_type_id, dose_number, administered_at, administered_by, clinic, next_dose_at, notes, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
		)
			.bind(
				id,
				b.petId,
				b.vaccineTypeId,
				b.doseNumber,
				b.administeredAt,
				b.administeredBy ?? null,
				b.clinic ?? null,
				b.nextDoseAt ?? null,
				b.notes ?? null,
				ts,
			)
			.run();

		if (!r.success) return c.json({ created: false }, 500);
		return c.json({ id }, 201);
	},
);

vaccines.get("/applications", async (c) => {
	const petId = c.req.query("petId");
	if (petId) {
		const rows = await c.env.DB.prepare(
			`SELECT a.*, t.name AS vaccine_name
       FROM vaccine_applications a
       LEFT JOIN vaccine_types t ON t.id = a.vaccine_type_id
       WHERE a.pet_id = ?1
       ORDER BY a.administered_at DESC, a.created_at DESC`,
		)
			.bind(petId)
			.all();
		return c.json(rows.results || []);
	}
	const rows = await c.env.DB.prepare(
		`SELECT a.*, t.name AS vaccine_name
     FROM vaccine_applications a
     LEFT JOIN vaccine_types t ON t.id = a.vaccine_type_id
     ORDER BY a.administered_at DESC, a.created_at DESC`,
	).all();
	return c.json(rows.results || []);
});
