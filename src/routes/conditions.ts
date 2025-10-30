import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { Env } from "../lib/env";
import { nowIso } from "../lib/utils";
import {
	ConditionCreateSchema,
	ConditionLinkLabResultSchema,
	ConditionLinkLabTypeSchema,
	ConditionNoteCreateSchema,
	ConditionNoteUpdateSchema,
	ConditionUpdateSchema,
} from "../schemas/conditions";

export const conditions = new Hono<Env>();

conditions.get("/pets/:petId/conditions", async (c) => {
	const petId = c.req.param("petId");
	const rows = await c.env.DB.prepare(
		"SELECT * FROM conditions WHERE pet_id = ?1 ORDER BY created_at DESC",
	)
		.bind(petId)
		.all();
	return c.json(rows.results || []);
});

conditions.post(
	"/pets/:petId/conditions",
	zValidator("json", ConditionCreateSchema),
	async (c) => {
		const petId = c.req.param("petId");
		const b = c.req.valid("json") as any;
		const id = crypto.randomUUID();
		const ts = nowIso();
		const r = await c.env.DB.prepare(
			`INSERT INTO conditions
       (id, pet_id, name, curability, status, severity, diagnosed_at, resolved_at, notes, created_at, updated_at)
       VALUES (?1, ?2, ?3, COALESCE(?4,'INDEFINIDO'), COALESCE(?5,'ATIVA'), COALESCE(?6,'MODERADA'), ?7, ?8, ?9, ?10, ?10)`,
		)
			.bind(
				id,
				petId,
				b.name,
				b.curability ?? null,
				b.status ?? null,
				b.severity ?? null,
				b.diagnosedAt ?? null,
				b.resolvedAt ?? null,
				b.notes ?? null,
				ts,
			)
			.run();
		if (!r.success) return c.json({ created: false }, 500);
		const row = await c.env.DB.prepare(
			"SELECT * FROM conditions WHERE id=?1",
		)
			.bind(id)
			.first();
		return c.json(row);
	},
);

conditions.get("/conditions/:id", async (c) => {
	const id = c.req.param("id");
	const row = await c.env.DB.prepare("SELECT * FROM conditions WHERE id=?1")
		.bind(id)
		.first();
	if (!row) return c.json({ error: "not_found" }, 404);
	return c.json(row);
});

conditions.put(
	"/conditions/:id",
	zValidator("json", ConditionUpdateSchema),
	async (c) => {
		const id = c.req.param("id");
		const b = c.req.valid("json") as any;
		const ts = nowIso();
		const r = await c.env.DB.prepare(
			`UPDATE conditions SET
         name = COALESCE(?2,name),
         curability = COALESCE(?3,curability),
         status = COALESCE(?4,status),
         severity = COALESCE(?5,severity),
         diagnosed_at = COALESCE(?6,diagnosed_at),
         resolved_at = COALESCE(?7,resolved_at),
         notes = COALESCE(?8,notes),
         updated_at = ?9
       WHERE id = ?1`,
		)
			.bind(
				id,
				b.name ?? null,
				b.curability ?? null,
				b.status ?? null,
				b.severity ?? null,
				b.diagnosedAt ?? null,
				b.resolvedAt ?? null,
				b.notes ?? null,
				ts,
			)
			.run();
		if (!r.success) return c.json({ updated: false }, 500);
		const row = await c.env.DB.prepare(
			"SELECT * FROM conditions WHERE id=?1",
		)
			.bind(id)
			.first();
		return c.json(row);
	},
);

conditions.delete("/conditions/:id", async (c) => {
	const id = c.req.param("id");
	const r = await c.env.DB.prepare("DELETE FROM conditions WHERE id=?1")
		.bind(id)
		.run();
	if (!r.success) return c.json({ deleted: false }, 500);
	return c.json({ deleted: true });
});

conditions.post(
	"/conditions/:id/lab-types",
	zValidator("json", ConditionLinkLabTypeSchema),
	async (c) => {
		const id = c.req.param("id");
		const b = c.req.valid("json");
		const r = await c.env.DB.prepare(
			"INSERT OR IGNORE INTO condition_lab_types (condition_id, lab_type_id) VALUES (?1,?2)",
		)
			.bind(id, (b as any).labTypeId)
			.run();
		if (!r.success) return c.json({ linked: false }, 500);
		return c.json({ linked: true });
	},
);

conditions.delete("/conditions/:id/lab-types/:labTypeId", async (c) => {
	const { id, labTypeId } = c.req.param();
	const r = await c.env.DB.prepare(
		"DELETE FROM condition_lab_types WHERE condition_id=?1 AND lab_type_id=?2",
	)
		.bind(id, labTypeId)
		.run();
	if (!r.success) return c.json({ unlinked: false }, 500);
	return c.json({ unlinked: true });
});

conditions.post(
	"/conditions/:id/lab-results",
	zValidator("json", ConditionLinkLabResultSchema),
	async (c) => {
		const id = c.req.param("id");
		const b = c.req.valid("json");
		const r = await c.env.DB.prepare(
			"INSERT OR IGNORE INTO condition_lab_results (condition_id, lab_result_id) VALUES (?1,?2)",
		)
			.bind(id, (b as any).labResultId)
			.run();
		if (!r.success) return c.json({ linked: false }, 500);
		return c.json({ linked: true });
	},
);

conditions.delete("/conditions/:id/lab-results/:labResultId", async (c) => {
	const { id, labResultId } = c.req.param();
	const r = await c.env.DB.prepare(
		"DELETE FROM condition_lab_results WHERE condition_id=?1 AND lab_result_id=?2",
	)
		.bind(id, labResultId)
		.run();
	if (!r.success) return c.json({ unlinked: false }, 500);
	return c.json({ unlinked: true });
});

conditions.post("/conditions/:id/treatments/:treatmentId", async (c) => {
	const { id, treatmentId } = c.req.param();
	const r = await c.env.DB.prepare(
		"INSERT OR IGNORE INTO condition_treatments (condition_id, treatment_id) VALUES (?1,?2)",
	)
		.bind(id, treatmentId)
		.run();
	if (!r.success) return c.json({ linked: false }, 500);
	return c.json({ linked: true });
});

conditions.delete("/conditions/:id/treatments/:treatmentId", async (c) => {
	const { id, treatmentId } = c.req.param();
	const r = await c.env.DB.prepare(
		"DELETE FROM condition_treatments WHERE condition_id=?1 AND treatment_id=?2",
	)
		.bind(id, treatmentId)
		.run();
	if (!r.success) return c.json({ unlinked: false }, 500);
	return c.json({ unlinked: true });
});

conditions.get("/conditions/:id/notes", async (c) => {
	const id = c.req.param("id");
	const rows = await c.env.DB.prepare(
		"SELECT * FROM condition_notes WHERE condition_id = ?1 ORDER BY created_at DESC",
	)
		.bind(id)
		.all();
	return c.json(rows.results || []);
});

conditions.post(
	"/conditions/:id/notes",
	zValidator("json", ConditionNoteCreateSchema),
	async (c) => {
		const id = c.req.param("id");
		const b = c.req.valid("json") as any;
		const noteId = crypto.randomUUID();
		const ts = nowIso();
		const r = await c.env.DB.prepare(
			`INSERT INTO condition_notes
       (id, condition_id, content, status_snapshot, severity_snapshot, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`,
		)
			.bind(
				noteId,
				id,
				b.content,
				b.status_snapshot ?? null,
				b.severity_snapshot ?? null,
				ts,
			)
			.run();
		if (!r.success) return c.json({ created: false }, 500);
		const row = await c.env.DB.prepare(
			"SELECT * FROM condition_notes WHERE id=?1",
		)
			.bind(noteId)
			.first();
		return c.json(row);
	},
);

conditions.put(
	"/condition-notes/:noteId",
	zValidator("json", ConditionNoteUpdateSchema),
	async (c) => {
		const noteId = c.req.param("noteId");
		const b = c.req.valid("json") as any;
		const ts = nowIso();
		const r = await c.env.DB.prepare(
			`UPDATE condition_notes SET
         content = COALESCE(?2,content),
         status_snapshot = COALESCE(?3,status_snapshot),
         severity_snapshot = COALESCE(?4,severity_snapshot),
         updated_at = ?5
       WHERE id = ?1`,
		)
			.bind(
				noteId,
				b.content ?? null,
				b.status_snapshot ?? null,
				b.severity_snapshot ?? null,
				ts,
			)
			.run();
		if (!r.success) return c.json({ updated: false }, 500);
		const row = await c.env.DB.prepare(
			"SELECT * FROM condition_notes WHERE id=?1",
		)
			.bind(noteId)
			.first();
		return c.json(row);
	},
);

conditions.delete("/condition-notes/:noteId", async (c) => {
	const noteId = c.req.param("noteId");
	const r = await c.env.DB.prepare("DELETE FROM condition_notes WHERE id=?1")
		.bind(noteId)
		.run();
	if (!r.success) return c.json({ deleted: false }, 500);
	return c.json({ deleted: true });
});

conditions.get("/conditions/:id/lab-types", async (c) => {
	const id = c.req.param("id");
	const rows = await c.env.DB.prepare(
		`SELECT t.* FROM condition_lab_types lt
	   JOIN lab_test_types t ON t.id = lt.lab_type_id
	   WHERE lt.condition_id = ?1
	   ORDER BY t.name`,
	)
		.bind(id)
		.all();
	return c.json(rows.results || []);
});

conditions.get("/conditions/:id/lab-results", async (c) => {
	const id = c.req.param("id");
	const rows = await c.env.DB.prepare(
		`SELECT r.* FROM condition_lab_results lr
	   JOIN lab_results r ON r.id = lr.lab_result_id
	   WHERE lr.condition_id = ?1
	   ORDER BY r.measured_at DESC`,
	)
		.bind(id)
		.all();
	return c.json(rows.results || []);
});

conditions.get("/conditions/:id/treatments", async (c) => {
	const id = c.req.param("id");
	const rows = await c.env.DB.prepare(
		`SELECT t.* FROM condition_treatments ct
	   JOIN treatments t ON t.id = ct.treatment_id
	   WHERE ct.condition_id = ?1
	   ORDER BY t.administered_at DESC`,
	)
		.bind(id)
		.all();
	return c.json(rows.results || []);
});
