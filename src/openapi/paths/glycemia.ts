import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
	GlyPointExpectedUpdateSchema,
	GlyPointUpdateSchema,
	GlySessionCreateSchema,
	GlySessionUpdateSchema,
} from "../../schemas";
import { GlyPointSchema, GlySessionSchema } from "../components/glycemia";

export function registerPathsGlycemia(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "get",
		path: "/glycemia/sessions",
		tags: ["Glycemia"],
		summary: "Lista de medições de curva glicêmica",
		request: {
			query: z.object({
				petId: z.string().optional(),
				limit: z.number().int().min(1).max(200).optional(),
				offset: z.number().int().min(0).optional(),
			}),
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: z.array(GlySessionSchema) },
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/glycemia/sessions",
		tags: ["Glycemia"],
		summary: "Cria medição de curva glicêmica",
		request: {
			body: {
				content: {
					"application/json": { schema: GlySessionCreateSchema },
				},
			},
		},
		responses: {
			201: {
				description: "Criado",
				content: {
					"application/json": {
						schema: z.object({ id: z.string() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/glycemia/sessions/{id}",
		tags: ["Glycemia"],
		summary: "Detalha medição da curva glicêmica",
		request: { params: z.object({ id: z.string() }) },
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({
							session: GlySessionSchema,
							points: z.array(GlyPointSchema),
						}),
					},
				},
			},
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "put",
		path: "/glycemia/sessions/{id}",
		tags: ["Glycemia"],
		summary: "Atualiza medição de curva glicêmica",
		request: {
			params: z.object({ id: z.string() }),
			body: {
				content: {
					"application/json": { schema: GlySessionUpdateSchema },
				},
			},
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ updated: z.boolean() }),
					},
				},
			},
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "put",
		path: "/glycemia/sessions/{id}/points/{idx}/expected",
		tags: ["Glycemia"],
		summary: "Atualiza horário esperado",
		request: {
			params: z.object({ id: z.string(), idx: z.string() }),
			body: {
				content: {
					"application/json": {
						schema: GlyPointExpectedUpdateSchema,
					},
				},
			},
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ updated: z.boolean() }),
					},
				},
			},
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "put",
		path: "/glycemia/sessions/{id}/points/{idx}",
		tags: ["Glycemia"],
		summary: "Atualiza medição específica",
		request: {
			params: z.object({ id: z.string(), idx: z.string() }),
			body: {
				content: {
					"application/json": { schema: GlyPointUpdateSchema },
				},
			},
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ updated: z.boolean() }),
					},
				},
			},
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "delete",
		path: "/glycemia/sessions/{id}",
		tags: ["Glycemia"],
		summary: "Exclui medição completa",
		request: { params: z.object({ id: z.string() }) },
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({
							deleted: z.boolean(),
							pointsDeleted: z.number().int(),
							sessionDeleted: z.number().int(),
						}),
					},
				},
			},
		},
	});
}
