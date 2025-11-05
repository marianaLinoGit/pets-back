import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { nextBirthdayFromDate } from "../lib/utils";
import { AlertsQuerySchema } from "../schemas";

type Env = { Bindings: { DB: D1Database } };

export const alerts = new Hono<Env>();

alerts.get("/due", zValidator("query", AlertsQuerySchema), async (c) => {
	const q = c.req.valid("query");

	const days = q.days;
	const minutes = q.minutes ?? null;
	const offsetMinutes = q.offsetMinutes ?? -180;
	const petId = q.petId ?? "";
	const kinds = q.kinds ?? [
		"birthdays",
		"vaccines",
		"glycemia",
		"treatments",
	];

	const includeBirthdays = kinds.includes("birthdays");
	const includeVaccines = kinds.includes("vaccines");
	const includeGlycemia = kinds.includes("glycemia");
	// const includeTreatments = kinds.includes("treatments"); // reservado p/ futuro

	const now = new Date();
	const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
	const untilIso = until.toISOString();

	let birthdays: any[] = [];
	let vaccines: any[] = [];
	let glycemia: any[] = [];

	if (includeVaccines) {
		let vacSql = `
      WITH last_app AS (
        SELECT
          a.*,
          ROW_NUMBER() OVER (
            PARTITION BY a.pet_id, a.vaccine_type_id
            ORDER BY
              a.administered_at DESC,
              a.created_at DESC,
              a.id DESC
          ) AS rn
        FROM vaccine_applications a
      )
      SELECT
        la.*,
        vt.name_biz AS vaccine_name
      FROM last_app la
      JOIN vaccine_types vt
        ON vt.id = la.vaccine_type_id
      WHERE
        la.rn = 1
        AND la.next_dose_at IS NOT NULL
        AND la.next_dose_at <= ?1
    `;

		const vacParams: any[] = [untilIso];

		if (petId) {
			vacSql += " AND la.pet_id = ?2";
			vacParams.push(petId);
		}

		vacSql += " ORDER BY la.next_dose_at ASC";

		const vacRs = await c.env.DB.prepare(vacSql)
			.bind(...vacParams)
			.all();

		vaccines = vacRs.results || [];
	}

	if (includeBirthdays) {
		let petsSql =
			"SELECT id,name,birth_date FROM pets WHERE birth_date IS NOT NULL";
		const petParams: any[] = [];
		if (petId) {
			petsSql += " AND id = ?";
			petParams.push(petId);
		}
		const pets = await c.env.DB.prepare(petsSql)
			.bind(...petParams)
			.all();

		birthdays = (pets.results || [])
			.map((p: any) => {
				const at = nextBirthdayFromDate(
					p.birth_date as string,
					offsetMinutes,
				);
				const turns =
					new Date(at).getUTCFullYear() -
					new Date(p.birth_date as string).getUTCFullYear();
				return {
					pet_id: p.id,
					pet_name: p.name,
					at,
					turns,
				};
			})
			.filter((x: any) => x.at <= untilIso);
	}

	if (includeGlycemia && minutes != null) {
		const soon = new Date(
			now.getTime() + minutes * 60 * 1000,
		).toISOString();

		let ptsSql =
			"SELECT p.*, s.pet_id FROM glycemic_curve_points p " +
			"JOIN glycemic_curve_sessions s ON p.session_id = s.id " +
			"WHERE p.measured_at IS NULL AND p.expected_at <= ?1";
		const ptsParams: any[] = [soon];
		if (petId) {
			ptsSql += " AND s.pet_id = ?2";
			ptsParams.push(petId);
		}
		ptsSql += " ORDER BY p.expected_at ASC";
		const points = await c.env.DB.prepare(ptsSql)
			.bind(...ptsParams)
			.all();

		glycemia = (points.results || [])
			.filter((pt: any) => {
				const warnMs = (pt.warn_minutes_before || 10) * 60 * 1000;
				const pre = new Date(
					new Date(pt.expected_at).getTime() - warnMs,
				);
				return pre <= now && new Date(pt.expected_at) > now;
			})
			.map((pt: any) => ({
				session_id: pt.session_id,
				idx: pt.idx,
				expected_at: pt.expected_at,
				pet_id: pt.pet_id,
			}));
	}

	return c.json({
		birthdays,
		vaccines,
		glycemia,
	});
});
