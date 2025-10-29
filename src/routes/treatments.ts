import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireApiKey } from "../lib/auth";
import { nowIso } from "../lib/utils";
import { TreatmentCreateSchema } from "../schemas";

type Env = { Bindings: { DB: D1Database; API_KEY?: string } };

export const treatments = new Hono<Env>();

treatments.post(
	"/",
	requireApiKey,
	zValidator("json", TreatmentCreateSchema),
	async (c) => {
		const body = c.req.valid("json");
		const ts = nowIso();
		const id = crypto.randomUUID();
		const r = await c.env.DB.prepare(
			"INSERT INTO pet_treatments (id,pet_id,type,type_label,product_name,administered_at,next_due_at,dose_info,notes,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
		)
			.bind(
				id,
				body.petId,
				body.type,
				body.typeLabel ?? null,
				body.productName ?? null,
				body.administeredAt,
				body.nextDueAt ?? null,
				body.doseInfo ?? null,
				body.notes ?? null,
				ts,
			)
			.run();
		return c.json({ id }, r.success ? 201 : 500);
	},
);

treatments.get("/", async (c) => {
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
