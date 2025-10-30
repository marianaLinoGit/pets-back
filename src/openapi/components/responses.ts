import type { ResponseObject } from "openapi3-ts";

export const RESPONSES: Record<string, ResponseObject> = {
	NotFound: { description: "Não encontrado" },
	Duplicate: { description: "Duplicado" },
};
