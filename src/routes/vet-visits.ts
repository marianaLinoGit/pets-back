import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { nowIso } from "../lib/utils";
import {
	VetVisitCreateSchema,
	VetVisitUpdateSchema,
} from "../schemas/vet-visits";

type Env = { Bindings: { DB: D1Database } };

export const vetVisits = new Hono<Env>();

vetVisits.get("/", async (c) => {
	const petId = c.req.query("petId");
	const base = `SELECT * FROM vet_visits`;
	if (petId) {
		const rs = await c.env.DB.prepare(
			base + ` WHERE pet_id=?1 ORDER BY visited_at DESC`,
		)
			.bind(petId)
			.all();
		return c.json(rs.results || []);
	}
	const rs = await c.env.DB.prepare(base + ` ORDER BY visited_at DESC`).all();
	return c.json(rs.results || []);
});

vetVisits.get("/:id", async (c) => {
	const id = c.req.param("id");
	const row = await c.env.DB.prepare(`SELECT * FROM vet_visits WHERE id=?1`)
		.bind(id)
		.first();
	if (!row) return c.json({ error: "not_found" }, 404);
	return c.json(row);
});

vetVisits.post("/", zValidator("json", VetVisitCreateSchema), async (c) => {
	const b = c.req.valid("json");
	const id = crypto.randomUUID();
	const ts = nowIso();

	const r = await c.env.DB.prepare(
		`INSERT INTO vet_visits
     (id, pet_id, visited_at, is_emergency, visit_type, reason, weight_kg, temp_c, heart_rate_bpm, resp_rate_bpm, capillary_refill_sec, pain_score,
      exam_summary, findings, diagnosis, differential_dx, procedures_done, meds_administered, prescriptions, allergies, repro_status, next_visit_at,
      clinic, vet_name, cost_total, paid_total, payment_method, notes, created_at, updated_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?25,?26,?27,?28,?29,?30)`,
	)
		.bind(
			id,
			b.petId,
			b.visitedAt,
			b.isEmergency ? 1 : 0,
			b.visitType ?? null,
			b.reason ?? null,
			b.weightKg ?? null,
			b.tempC ?? null,
			b.heartRateBpm ?? null,
			b.respRateBpm ?? null,
			b.capillaryRefillSec ?? null,
			b.painScore ?? null,
			b.examSummary ?? null,
			b.findings ?? null,
			b.diagnosis ?? null,
			b.differentialDx ?? null,
			b.proceduresDone ?? null,
			b.medsAdministered ?? null,
			b.prescriptions ?? null,
			b.allergies ?? null,
			b.reproStatus ?? null,
			b.nextVisitAt ?? null,
			b.clinic ?? null,
			b.vetName ?? null,
			b.costTotal ?? null,
			b.paidTotal ?? null,
			b.paymentMethod ?? null,
			b.notes ?? null,
			ts,
			ts,
		)
		.run();

	if (!r.success) return c.json({ created: false }, 500);

	// 👉 NOVO: insere peso automaticamente, sem quebrar se já existir
	if (b.weightKg != null) {
		const measuredDate = (b.visitedAt as string).slice(0, 10); // "YYYY-MM-DD"
		await c.env.DB.prepare(
			`INSERT OR IGNORE INTO pet_weights (id, pet_id, measured_at, weight_kg, created_at)
       VALUES (?1,?2,?3,?4,?5)`,
		)
			.bind(crypto.randomUUID(), b.petId, measuredDate, b.weightKg, ts)
			.run();
	}

	if (
		Array.isArray((b as any).vaccineApps) &&
		(b as any).vaccineApps.length > 0
	) {
		for (const v of (b as any).vaccineApps) {
			const appId = crypto.randomUUID();
			const appR = await c.env.DB.prepare(
				`INSERT INTO vaccine_applications
         (id, pet_id, vaccine_type_id, dose_number, administered_at, administered_by, clinic, next_dose_at, notes, brand, created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)`,
			)
				.bind(
					appId,
					b.petId,
					v.vaccineTypeId,
					v.doseNumber,
					v.administeredAt ?? (b.visitedAt as string).slice(0, 10),
					v.administeredBy ?? null,
					v.clinic ?? b.clinic ?? null,
					v.nextDoseAt ?? null,
					v.notes ?? null,
					v.brand ?? null,
					ts,
				)
				.run();
			if (appR.success) {
				await c.env.DB.prepare(
					`INSERT INTO vet_visit_vaccines (id, visit_id, vaccine_application_id, created_at) VALUES (?1,?2,?3,?4)`,
				)
					.bind(crypto.randomUUID(), id, appId, ts)
					.run();
			}
		}
	}

	if (
		Array.isArray((b as any).labOrders) &&
		(b as any).labOrders.length > 0
	) {
		const orderId = crypto.randomUUID();
		await c.env.DB.prepare(
			`INSERT INTO lab_orders (id, visit_id, created_at) VALUES (?1,?2,?3)`,
		)
			.bind(orderId, id, ts)
			.run();

		for (const item of (b as any).labOrders) {
			await c.env.DB.prepare(
				`INSERT INTO lab_order_items (id, order_id, lab_type_id, notes, created_at) VALUES (?1,?2,?3,?4,?5)`,
			)
				.bind(
					crypto.randomUUID(),
					orderId,
					item.labTypeId,
					item.notes ?? null,
					ts,
				)
				.run();
		}
	}

	return c.json({ id }, 201);
});

vetVisits.put("/:id", zValidator("json", VetVisitUpdateSchema), async (c) => {
	const id = c.req.param("id");
	const cur = await c.env.DB.prepare(`SELECT id FROM vet_visits WHERE id=?1`)
		.bind(id)
		.first();
	if (!cur) return c.json({ error: "not_found" }, 404);

	const b = c.req.valid("json");
	const ts = nowIso();

	const r = await c.env.DB.prepare(
		`UPDATE vet_visits SET
      visited_at=COALESCE(?2, visited_at),
      is_emergency=COALESCE(?3, is_emergency),
      visit_type=COALESCE(?4, visit_type),
      reason=COALESCE(?5, reason),
      weight_kg=COALESCE(?6, weight_kg),
      temp_c=COALESCE(?7, temp_c),
      heart_rate_bpm=COALESCE(?8, heart_rate_bpm),
      resp_rate_bpm=COALESCE(?9, resp_rate_bpm),
      capillary_refill_sec=COALESCE(?10, capillary_refill_sec),
      pain_score=COALESCE(?11, pain_score),
      exam_summary=COALESCE(?12, exam_summary),
      findings=COALESCE(?13, findings),
      diagnosis=COALESCE(?14, diagnosis),
      differential_dx=COALESCE(?15, differential_dx),
      procedures_done=COALESCE(?16, procedures_done),
      meds_administered=COALESCE(?17, meds_administered),
      prescriptions=COALESCE(?18, prescriptions),
      allergies=COALESCE(?19, allergies),
      repro_status=COALESCE(?20, repro_status),
      next_visit_at=COALESCE(?21, next_visit_at),
      clinic=COALESCE(?22, clinic),
      vet_name=COALESCE(?23, vet_name),
      cost_total=COALESCE(?24, cost_total),
      paid_total=COALESCE(?25, paid_total),
      payment_method=COALESCE(?26, payment_method),
      notes=COALESCE(?27, notes),
      updated_at=?28
     WHERE id=?1`,
	)
		.bind(
			id,
			(b as any).visitedAt ?? null,
			(b as any).isEmergency !== undefined
				? (b as any).isEmergency
					? 1
					: 0
				: null,
			(b as any).visitType ?? null,
			(b as any).reason ?? null,
			(b as any).weightKg ?? null,
			(b as any).tempC ?? null,
			(b as any).heartRateBpm ?? null,
			(b as any).respRateBpm ?? null,
			(b as any).capillaryRefillSec ?? null,
			(b as any).painScore ?? null,
			(b as any).examSummary ?? null,
			(b as any).findings ?? null,
			(b as any).diagnosis ?? null,
			(b as any).differentialDx ?? null,
			(b as any).proceduresDone ?? null,
			(b as any).medsAdministered ?? null,
			(b as any).prescriptions ?? null,
			(b as any).allergies ?? null,
			(b as any).reproStatus ?? null,
			(b as any).nextVisitAt ?? null,
			(b as any).clinic ?? null,
			(b as any).vetName ?? null,
			(b as any).costTotal ?? null,
			(b as any).paidTotal ?? null,
			(b as any).paymentMethod ?? null,
			(b as any).notes ?? null,
			ts,
		)
		.run();

	if (!r.success) return c.json({ updated: false }, 500);
	return c.json({ updated: true });
});
