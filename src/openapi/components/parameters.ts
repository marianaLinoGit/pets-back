import type { ParameterObject } from "openapi3-ts";

export const PARAMETERS: Record<string, ParameterObject> = {
	Id: { name: "id", in: "path", required: true, schema: { type: "string" } },
	PetId: {
		name: "petId",
		in: "path",
		required: true,
		schema: { type: "string" },
	},
	LabTypeId: {
		name: "labTypeId",
		in: "path",
		required: true,
		schema: { type: "string" },
	},
	TreatmentId: {
		name: "treatmentId",
		in: "path",
		required: true,
		schema: { type: "string" },
	},
	NoteId: {
		name: "noteId",
		in: "path",
		required: true,
		schema: { type: "string" },
	},
	GlyIdx: {
		name: "idx",
		in: "path",
		required: true,
		schema: { type: "string" },
	},
	PaginationLimit: {
		name: "limit",
		in: "query",
		required: false,
		schema: { type: "integer", minimum: 1, maximum: 500 },
	},
	PaginationOffset: {
		name: "offset",
		in: "query",
		required: false,
		schema: { type: "integer", minimum: 0 },
	},
};
