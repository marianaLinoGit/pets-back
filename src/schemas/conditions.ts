import { z } from "zod";
import { DateOnly } from "./common";

export const Curability = z.enum(["CURÁVEL", "NÃO_CURÁVEL", "INDEFINIDO"]);
export const ConditionStatus = z.enum([
	"ATIVA",
	"RESOLVIDA",
	"EM_MANEJO",
	"DESCARTADA",
]);
export const Severity = z.enum(["BAIXA", "MODERADA", "ALTA"]);

const NormalizeDates = <T extends z.ZodTypeAny>(schema: T) =>
	z.preprocess((raw) => {
		if (raw && typeof raw === "object") {
			const o: any = raw;
			if (o.diagnosed_at !== undefined && o.diagnosedAt === undefined)
				o.diagnosedAt = o.diagnosed_at;
			if (o.resolved_at !== undefined && o.resolvedAt === undefined)
				o.resolvedAt = o.resolved_at;
		}
		return raw;
	}, schema);

export const ConditionCreateSchema = NormalizeDates(
	z.object({
		name: z.string().min(1),
		curability: Curability.default("INDEFINIDO").optional(),
		status: ConditionStatus.default("ATIVA").optional(),
		severity: Severity.default("MODERADA").optional(),
		diagnosedAt: DateOnly.optional().nullable(),
		resolvedAt: DateOnly.optional().nullable(),
		notes: z.string().optional().nullable(),
	}),
);

export const ConditionUpdateSchema = NormalizeDates(
	z.object({
		name: z.string().min(1).optional(),
		curability: Curability.optional(),
		status: ConditionStatus.optional(),
		severity: Severity.optional(),
		diagnosedAt: DateOnly.optional().nullable(),
		resolvedAt: DateOnly.optional().nullable(),
		notes: z.string().optional().nullable(),
	}),
);

export const ConditionLinkLabTypeSchema = z.object({
	labTypeId: z.string().min(1),
});

export const ConditionLinkLabResultSchema = z.object({
	labResultId: z.string().min(1),
});

export const ConditionNoteCreateSchema = z.object({
	content: z.string().min(1),
	status_snapshot: ConditionStatus.optional().nullable(),
	severity_snapshot: Severity.optional().nullable(),
});

export const ConditionNoteUpdateSchema = ConditionNoteCreateSchema.partial();
