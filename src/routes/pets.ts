import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { int, nowIso } from "../lib/utils";
import {
	PetCreateSchema,
	PetUpdateSchema,
	WeightCreateBodySchema,
} from "../schemas";

type Env = { Bindings: { DB: D1Database } };

export const pets = new Hono<Env>();

pets.get("/", async (c) => {
	const q = c.req.query("q") || "";
	const species = c.req.query("species") || "";
	const gender = c.req.query("gender") || "";
	const sortBy = (c.req.query("sortBy") || "name") as
		| "name"
		| "birth_date"
		| "adoption_date";
	const sortDir = (c.req.query("sortDir") || "asc") as "asc" | "desc";

	const where: string[] = [];
	const bind: any[] = [];
	if (q) {
		where.push("LOWER(name) LIKE LOWER('%' || ? || '%')");
		bind.push(q);
	}
	if (species) {
		where.push("species = ?");
		bind.push(species);
	}
	if (gender) {
		where.push("gender = ?");
		bind.push(gender);
	}

	const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
	const col =
		sortBy === "name"
			? "name"
			: sortBy === "birth_date"
			? "birth_date"
			: "adoption_date";
	const orderSql = `ORDER BY ${col} IS NULL, ${col} ${sortDir.toUpperCase()}`;

	const sql = `SELECT * FROM pets ${whereSql} ${orderSql}`;
	const r = await c.env.DB.prepare(sql)
		.bind(...bind)
		.all();
	return c.json(r.results || []);
});

pets.get("/:id", async (c) => {
	const id = c.req.param("id");
	const r = await c.env.DB.prepare("SELECT * FROM pets WHERE id = ?1")
		.bind(id)
		.all();
	if (!r.results || r.results.length === 0)
		return c.json({ error: "not_found" }, 404);
	return c.json(r.results[0]);
});

pets.post("/", zValidator("json", PetCreateSchema), async (c) => {
	const b = c.req.valid("json");
	const id = crypto.randomUUID();
	const ts = nowIso();
	const r = await c.env.DB.prepare(
		`INSERT INTO pets
		 (id,name,species,breed,gender,coat,microchip,birth_date,adoption_date,theme_color,is_active,created_at,updated_at)
		 VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,1,?11,?12)`,
	)
		.bind(
			id,
			b.name,
			b.species,
			b.breed ?? null,
			b.gender ?? null,
			b.coat ?? null,
			b.microchip ?? null,
			b.birthDate ?? null,
			b.adoptionDate ?? null,
			b.themeColor ?? null,
			ts,
			ts,
		)
		.run();
	if (!r.success) return c.json({ error: "db_error" }, 500);
	return c.json({ id }, 201);
});

pets.put("/:id", zValidator("json", PetUpdateSchema), async (c) => {
	const id = c.req.param("id");
	const b = c.req.valid("json");
	const ts = new Date().toISOString();

	const r = await c.env.DB.prepare(
		`UPDATE pets SET
		 name = COALESCE(?2,name),
		 species = COALESCE(?3,species),
		 breed = COALESCE(?4,breed),
		 gender = COALESCE(?5,gender),
		 coat = COALESCE(?6,coat),
		 microchip = COALESCE(?7,microchip),
		 birth_date = COALESCE(?8,birth_date),
		 adoption_date = COALESCE(?9,adoption_date),
		 theme_color = COALESCE(?10,theme_color),
		 updated_at = ?11
	   WHERE id = ?1`,
	)
		.bind(
			id,
			b.name ?? null,
			b.species ?? null,
			b.breed ?? null,
			b.gender ?? null,
			b.coat ?? null,
			b.microchip ?? null,
			b.birthDate ?? null,
			b.adoptionDate ?? null,
			b.themeColor ?? null,
			ts,
		)
		.run();

	if (!r.success) return c.json({ updated: false }, 500);
	return c.json({ updated: true });
});

pets.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const r = await c.env.DB.prepare("DELETE FROM pets WHERE id = ?1")
		.bind(id)
		.run();
	if ((r.meta?.changes || 0) === 0)
		return c.json({ error: "not_found" }, 404);
	return c.json({ deleted: true });
});

pets.get("/:id/weights", async (c) => {
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

pets.post(
	"/:id/weights",
	zValidator("json", WeightCreateBodySchema),
	async (c) => {
		const id = c.req.param("id");
		const b = c.req.valid("json");
		const ts = nowIso();
		const wid = crypto.randomUUID();
		const r = await c.env.DB.prepare(
			"INSERT INTO pet_weights (id,pet_id,measured_at,weight_kg,created_at) VALUES (?1,?2,?3,?4,?5)",
		)
			.bind(wid, id, b.measuredAt, b.weightKg, ts)
			.run();
		return c.json({ id: wid }, r.success ? 201 : 500);
	},
);
