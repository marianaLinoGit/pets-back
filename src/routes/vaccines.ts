import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { nowIso } from "../lib/utils";
import { z } from "../lib/z";
import {
	VaccineApplicationCreateSchema,
	VaccineApplicationUpdateSchema,
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

		let brand = typeof b.brand === "string" ? b.brand.trim() : "";
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
				brand,
				ts,
			)
			.run();

		if (!r.success) return c.json({ created: false }, 500);
		return c.json({ id }, 201);
	},
);

vaccines.get("/applications", async (c) => {
	const petId = c.req.query("petId");
	const base = `SELECT a.*, t.name_biz AS vaccine_name
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
	const row = await c.env.DB.prepare(
		`SELECT a.*, t.name_biz AS vaccine_name
	   FROM vaccine_applications a
	   LEFT JOIN vaccine_types t ON t.id = a.vaccine_type_id
	   WHERE a.id = ?1`,
	)
		.bind(id)
		.first();
	if (!row) return c.json({ error: "not_found" }, 404);
	return c.json(row);
});

vaccines.put(
	"/applications/:id",
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
		   dose_number = COALESCE(?3, dose_number),
		   administered_at = COALESCE(?4, administered_at),
		   administered_by = COALESCE(?5, administered_by),
		   clinic = COALESCE(?6, clinic),
		   next_dose_at = COALESCE(?7, next_dose_at),
		   notes = COALESCE(?8, notes),
		   brand = COALESCE(?9, brand)
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
			`SELECT a.*, t.name_biz AS vaccine_name
		 FROM vaccine_applications a
		 LEFT JOIN vaccine_types t ON t.id = a.vaccine_type_id
		 WHERE a.id = ?1`,
		)
			.bind(id)
			.first();

		return c.json(out);
	},
);

vaccines.get("/due", async (c) => {
	const Query = z.object({
		petId: z.string().uuid().optional(),
		from: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/)
			.optional(),
		to: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/)
			.optional(),
		limit: z
			.string()
			.transform((v) =>
				Math.min(Math.max(parseInt(v || "500", 10) || 500, 1), 1000),
			)
			.optional(),
		offset: z
			.string()
			.transform((v) => Math.max(parseInt(v || "0", 10) || 0, 0))
			.optional(),
	});

	const parsed = Query.safeParse(c.req.query());
	if (!parsed.success) {
		return c.json(
			{ error: "bad_query", details: parsed.error.flatten() },
			400,
		);
	}
	const { petId, from, to, limit = 500, offset = 0 } = parsed.data;

	// --------- ATRASADAS ---------
	let overdueSQL = `
	  SELECT
		a.id                 AS application_id,
		a.pet_id,
		a.vaccine_type_id,
		t.name_biz           AS vaccine_name,
		COALESCE(a.brand,'') AS brand,
		a.administered_at    AS last_administered_at,
		a.next_dose_at       AS next_dose_at,
		1                    AS overdue,
		0                    AS next_is_null
	  FROM vaccine_applications a
	  LEFT JOIN vaccine_types t ON t.id = a.vaccine_type_id
	  WHERE a.next_dose_at IS NOT NULL
		AND a.next_dose_at < DATE('now')
		AND NOT EXISTS (
		  SELECT 1
		  FROM vaccine_applications b
		  WHERE b.pet_id = a.pet_id
			AND b.vaccine_type_id = a.vaccine_type_id
			AND b.administered_at >= a.next_dose_at
		)
	`;
	const overParams: any[] = [];
	if (petId) {
		overdueSQL += ` AND a.pet_id = ?`;
		overParams.push(petId);
	}

	// --------- PRÓXIMAS ---------
	let upcomingSQL = `
	  SELECT
		la.id                AS application_id,
		la.pet_id,
		la.vaccine_type_id,
		t.name_biz           AS vaccine_name,
		COALESCE(la.brand,'')AS brand,
		la.administered_at   AS last_administered_at,
		la.next_dose_at      AS next_dose_at,
		0                    AS overdue,
		CASE WHEN la.next_dose_at IS NULL THEN 1 ELSE 0 END AS next_is_null
	  FROM vaccine_applications la
	  LEFT JOIN vaccine_types t ON t.id = la.vaccine_type_id
	  WHERE la.administered_at = (
		SELECT MAX(x.administered_at)
		FROM vaccine_applications x
		WHERE x.pet_id = la.pet_id
		  AND x.vaccine_type_id = la.vaccine_type_id
	  )
		AND la.next_dose_at IS NOT NULL
		AND la.next_dose_at >= DATE('now')
	`;
	const upParams: any[] = [];
	if (petId) {
		upcomingSQL += ` AND la.pet_id = ?`;
		upParams.push(petId);
	}
	if (from && to) {
		upcomingSQL += ` AND la.next_dose_at BETWEEN ? AND ?`;
		upParams.push(from, to);
	} else if (from) {
		upcomingSQL += ` AND la.next_dose_at >= ?`;
		upParams.push(from);
	} else if (to) {
		upcomingSQL += ` AND la.next_dose_at <= ?`;
		upParams.push(to);
	}

	// --------- UNION + ORDER BY só por colunas do resultado ---------
	const unionSQL = `
	  ${overdueSQL}
	  UNION ALL
	  ${upcomingSQL}
	  ORDER BY
		overdue DESC,
		next_is_null ASC,
		next_dose_at ASC
	  LIMIT ? OFFSET ?
	`;
	const params = [...overParams, ...upParams, limit, offset];

	const rs = await c.env.DB.prepare(unionSQL)
		.bind(...params)
		.all();
	return c.json(rs.results || []);
});
