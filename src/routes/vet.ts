import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireApiKey } from "../lib/auth";
import { nowIso } from "../lib/utils";
import { VetVisitCreateSchema } from "../schemas";

type Env = { Bindings: { DB: D1Database; API_KEY?: string } };

export const vet = new Hono<Env>();

vet.post(
	"/visits",
	requireApiKey,
	zValidator("json", VetVisitCreateSchema),
	async (c) => {
		const body = c.req.valid("json");
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
		return c.json({ id }, r.success ? 201 : 500);
	},
);

vet.get("/visits", async (c) => {
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
