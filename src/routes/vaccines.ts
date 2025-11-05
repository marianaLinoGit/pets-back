import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireApiKey } from "../lib/auth";
import { nowIso } from "../lib/utils";
import { z } from "../lib/z";
import {
	VaccineApplicationCreateSchema,
	VaccineApplicationUpdateSchema,
	VaccineTypeCreateSchema,
	VaccineTypeUpdateInSchema,
} from "../schemas";
import { SpeciesEnum } from "../schemas/common";

type Env = { Bindings: { DB: D1Database; API_KEY?: string } };

const isStr = (v: unknown): v is string => typeof v === "string";

export const vaccines = new Hono<Env>();

const QueryListSchema = z.object({
	q: z.string().optional(),
	species: SpeciesEnum.optional(),
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
		`SELECT id,
            name,
            name_biz AS name_biz,
            species,
            total_doses,
            brand,
            description,
            notes,
            created_at,
            updated_at
       FROM vaccine_types` +
		(where.length ? ` WHERE ${where.join(" AND ")}` : "") +
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
		const ts = nowIso();

		const nameBiz = b.name.trim();
		const brandNorm = (b.brand ?? "").trim();

		const exists = await c.env.DB.prepare(
			`SELECT 1 FROM vaccine_types
        WHERE species=?1 AND name_biz=?2 AND COALESCE(brand,'')=?3
        LIMIT 1`,
		)
			.bind(b.species, nameBiz, brandNorm)
			.first();

		if (exists) return c.json({ error: "duplicate_name_brand" }, 409);

		const r = await c.env.DB.prepare(
			`INSERT INTO vaccine_types
         (id, name, name_biz, species, total_doses, brand, description, notes, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
		)
			.bind(
				id,
				nameBiz,
				nameBiz,
				b.species,
				b.totalDoses,
				brandNorm || null,
				b.description ?? null,
				b.notes ?? null,
				ts,
				ts,
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
		const body = c.req.valid("json") as any;

		const cur = await c.env.DB.prepare(
			`SELECT name, name_biz, species, COALESCE(brand,'') AS brand
         FROM vaccine_types WHERE id=?1`,
		)
			.bind(id)
			.first();

		if (!cur) return c.json({ error: "not_found" }, 404);

		const curName: string = (cur as any).name || "";
		const curNameBiz: string = (cur as any).name_biz || curName;
		const curSpecies: z.infer<typeof SpeciesEnum> = (cur as any).species;
		const curBrand: string = (cur as any).brand || "";

		const nextName =
			typeof body.name === "string" ? body.name.trim() : curName;
		const nextNameBiz =
			typeof body.name === "string" ? body.name.trim() : curNameBiz;
		const nextSpecies: z.infer<typeof SpeciesEnum> =
			body.species ?? curSpecies;
		const nextBrand =
			body.brand !== undefined
				? body.brand === null
					? ""
					: String(body.brand).trim()
				: curBrand;

		const dupe = await c.env.DB.prepare(
			`SELECT 1 FROM vaccine_types
         WHERE species=?1 AND name_biz=?2 AND COALESCE(brand,'')=?3 AND id<>?4
         LIMIT 1`,
		)
			.bind(nextSpecies, nextNameBiz, nextBrand, id)
			.first();

		if (dupe) return c.json({ error: "duplicate_name_brand" }, 409);

		const ts = nowIso();

		const r = await c.env.DB.prepare(
			`UPDATE vaccine_types SET
          name        = COALESCE(?2, name),
          name_biz    = COALESCE(?3, name_biz),
          species     = COALESCE(?4, species),
          total_doses = COALESCE(?5, total_doses),
          brand       = COALESCE(?6, brand),
          description = COALESCE(?7, description),
          notes       = COALESCE(?8, notes),
          updated_at  = ?9
        WHERE id = ?1`,
		)
			.bind(
				id,
				body.name !== undefined ? nextName : null,
				body.name !== undefined ? nextNameBiz : null,
				body.species ?? null,
				body.total_doses ?? body.totalDoses ?? null,
				body.brand !== undefined ? nextBrand || null : null,
				body.description ?? null,
				body.notes ?? null,
				ts,
			)
			.run();

		if (!r.success) return c.json({ updated: false }, 500);

		const out = await c.env.DB.prepare(
			`SELECT id,
              name,
              name_biz AS name_biz,
              species,
              total_doses,
              brand,
              description,
              notes,
              created_at,
              updated_at
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

		let brand = isStr(b.brand) ? b.brand.trim() : "";
		if (!brand) {
			const vt = await c.env.DB.prepare(
				`SELECT brand FROM vaccine_types WHERE id=?1`,
			)
				.bind(b.vaccineTypeId)
				.first();
			brand = (vt?.brand as string) ?? "";
		}

		const r = await c.env.DB.prepare(
			`INSERT INTO vaccine_applications
         (id, pet_id, vaccine_type_id, dose_number, administered_at, administered_by, clinic, next_dose_at, notes, brand, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
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
				brand || null,
				ts,
			)
			.run();

		if (!r.success) return c.json({ created: false }, 500);
		return c.json({ id }, 201);
	},
);

vaccines.get("/applications", async (c) => {
	const petId = c.req.query("petId");
	const base = `SELECT a.*,
                       t.name_biz AS vaccine_name
                  FROM vaccine_applications a
             LEFT JOIN vaccine_types t ON t.id = a.vaccine_type_id`;
	if (petId) {
		const rows = await c.env.DB.prepare(
			base +
				` WHERE a.pet_id = ?1
            ORDER BY a.administered_at DESC, a.created_at DESC`,
		)
			.bind(petId)
			.all();
		return c.json(rows.results || []);
	}
	const rows = await c.env.DB.prepare(
		base + ` ORDER BY a.administered_at DESC, a.created_at DESC`,
	).all();
	return c.json(rows.results || []);
});

vaccines.get("/applications/:id", async (c) => {
	const id = c.req.param("id");
	const petId = c.req.query("petId") || "";
	const row = await c.env.DB.prepare(
		`SELECT a.*,
            t.name_biz AS vaccine_name
       FROM vaccine_applications a
  LEFT JOIN vaccine_types t ON t.id = a.vaccine_type_id
      WHERE a.id = ?1 AND a.pet_id = ?2`,
	)
		.bind(id, petId)
		.first();
	if (!row) return c.json({ error: "not_found" }, 404);
	return c.json(row);
});

vaccines.put(
	"/applications/:id",
	requireApiKey,
	zValidator("json", VaccineApplicationUpdateSchema),
	async (c) => {
		const id = c.req.param("id");
		const b = c.req.valid("json");

		const exists = await c.env.DB.prepare(
			`SELECT id FROM vaccine_applications WHERE id=?1`,
		)
			.bind(id)
			.first();
		if (!exists) return c.json({ error: "not_found" }, 404);

		if (b.vaccineTypeId) {
			const vt = await c.env.DB.prepare(
				`SELECT id FROM vaccine_types WHERE id=?1`,
			)
				.bind(b.vaccineTypeId)
				.first();
			if (!vt) return c.json({ error: "invalid_vaccine_type" }, 400);
		}

		const r = await c.env.DB.prepare(
			`UPDATE vaccine_applications SET
          vaccine_type_id = COALESCE(?2, vaccine_type_id),
          dose_number     = COALESCE(?3, dose_number),
          administered_at = COALESCE(?4, administered_at),
          administered_by = COALESCE(?5, administered_by),
          clinic          = COALESCE(?6, clinic),
          next_dose_at    = COALESCE(?7, next_dose_at),
          notes           = COALESCE(?8, notes),
          brand           = COALESCE(?9, brand)
        WHERE id = ?1`,
		)
			.bind(
				id,
				(b as any).vaccineTypeId ?? null,
				(b as any).doseNumber ?? null,
				(b as any).administeredAt ?? null,
				(b as any).administeredBy ?? null,
				(b as any).clinic ?? null,
				(b as any).nextDoseAt ?? null,
				(b as any).notes ?? null,
				(b as any).brand ?? null,
			)
			.run();

		if (!r.success) return c.json({ updated: false }, 500);

		const out = await c.env.DB.prepare(
			`SELECT a.*,
              t.name_biz AS vaccine_name
         FROM vaccine_applications a
    LEFT JOIN vaccine_types t ON t.id = a.vaccine_type_id
        WHERE a.id = ?1`,
		)
			.bind(id)
			.first();

		return c.json(out);
	},
);
