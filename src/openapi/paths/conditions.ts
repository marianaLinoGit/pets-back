import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { ConditionCreateSchema, ConditionUpdateSchema } from "../../schemas";
import { ConditionSchema } from "../components/conditions";

export function registerPathsConditions(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "get",
		path: "/pets/{petId}/conditions",
		tags: ["Conditions"],
		summary: "Lista condições do pet",
		request: { params: z.object({ petId: z.string() }) },
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: z.array(ConditionSchema) },
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/pets/{petId}/conditions",
		tags: ["Conditions"],
		summary: "Cria condição para o pet",
		request: {
			params: z.object({ petId: z.string() }),
			body: {
				content: {
					"application/json": { schema: ConditionCreateSchema },
				},
			},
		},
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: ConditionSchema } },
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/conditions/{id}",
		tags: ["Conditions"],
		summary: "Detalha condição",
		request: { params: z.object({ id: z.string() }) },
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: ConditionSchema } },
			},
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "put",
		path: "/conditions/{id}",
		tags: ["Conditions"],
		summary: "Atualiza condição",
		request: {
			params: z.object({ id: z.string() }),
			body: {
				content: {
					"application/json": { schema: ConditionUpdateSchema },
				},
			},
		},
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: ConditionSchema } },
			},
		},
	});

	registry.registerPath({
		method: "delete",
		path: "/conditions/{id}",
		tags: ["Conditions"],
		summary: "Exclui condição",
		request: { params: z.object({ id: z.string() }) },
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ deleted: z.boolean() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/conditions/{id}/lab-types",
		tags: ["Conditions"],
		summary: "Associa tipo de exame à condição",
		request: {
			params: z.object({ id: z.string() }),
			body: {
				content: {
					"application/json": {
						schema: z.object({ labTypeId: z.string() }),
					},
				},
			},
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ linked: z.boolean() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "delete",
		path: "/conditions/{id}/lab-types/{labTypeId}",
		tags: ["Conditions"],
		summary: "Remove associação de tipo de exame",
		request: {
			params: z.object({ id: z.string(), labTypeId: z.string() }),
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ unlinked: z.boolean() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/conditions/{id}/lab-results",
		tags: ["Conditions"],
		summary: "Associa resultado de exame",
		request: {
			params: z.object({ id: z.string() }),
			body: {
				content: {
					"application/json": {
						schema: z.object({ labResultId: z.string() }),
					},
				},
			},
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ linked: z.boolean() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "delete",
		path: "/conditions/{id}/lab-results/{labResultId}",
		tags: ["Conditions"],
		summary: "Remove associação de resultado",
		request: {
			params: z.object({ id: z.string(), labResultId: z.string() }),
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ unlinked: z.boolean() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/conditions/{id}/treatments/{treatmentId}",
		tags: ["Conditions"],
		summary: "Associa tratamento",
		request: {
			params: z.object({ id: z.string(), treatmentId: z.string() }),
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ linked: z.boolean() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "delete",
		path: "/conditions/{id}/treatments/{treatmentId}",
		tags: ["Conditions"],
		summary: "Remove associação de tratamento",
		request: {
			params: z.object({ id: z.string(), treatmentId: z.string() }),
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ unlinked: z.boolean() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/conditions/{id}/notes",
		tags: ["Conditions"],
		summary: "Lista notas da condição",
		request: { params: z.object({ id: z.string() }) },
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: z.array(z.any()) } },
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/conditions/{id}/notes",
		tags: ["Conditions"],
		summary: "Cria nota",
		request: {
			params: z.object({ id: z.string() }),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							content: z.string(),
							status_snapshot: z.any().nullable().optional(),
							severity_snapshot: z.any().nullable().optional(),
						}),
					},
				},
			},
		},
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: z.any() } },
			},
		},
	});

	registry.registerPath({
		method: "put",
		path: "/condition-notes/{noteId}",
		tags: ["Conditions"],
		summary: "Atualiza nota",
		request: {
			params: z.object({ noteId: z.string() }),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							content: z.string().optional(),
							status_snapshot: z.any().nullable().optional(),
							severity_snapshot: z.any().nullable().optional(),
						}),
					},
				},
			},
		},
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: z.any() } },
			},
		},
	});

	registry.registerPath({
		method: "delete",
		path: "/condition-notes/{noteId}",
		tags: ["Conditions"],
		summary: "Exclui nota",
		request: { params: z.object({ noteId: z.string() }) },
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ deleted: z.boolean() }),
					},
				},
			},
		},
	});
}
