import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../lib/z";
import { PetCreateSchema, PetUpdateSchema } from "../../schemas";
import { SpeciesEnum } from "../components/common";
import {
	PetSchema,
	WeightCreateBodySchema,
	WeightSchema,
} from "../components/pets";

export function registerPathsPets(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "get",
		path: "/pets",
		tags: ["Pets"],
		summary: "Lista pets",
		request: {
			query: z.object({
				q: z.string().optional(),
				species: SpeciesEnum.optional(),
				gender: z.enum(["M", "F", "N"]).optional(),
				sortBy: z
					.enum(["name", "birth_date", "adoption_date"])
					.optional(),
				sortDir: z.enum(["asc", "desc"]).optional(),
			}),
		},
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: z.array(PetSchema) } },
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/pets",
		tags: ["Pets"],
		summary: "Cadastra pet",
		request: {
			body: {
				content: { "application/json": { schema: PetCreateSchema } },
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
		path: "/pets/{id}",
		tags: ["Pets"],
		summary: "Obtém pet por id",
		request: { params: z.object({ id: z.string() }) },
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: PetSchema } },
			},
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "put",
		path: "/pets/{id}",
		tags: ["Pets"],
		summary: "Atualiza pet",
		request: {
			params: z.object({ id: z.string() }),
			body: {
				content: { "application/json": { schema: PetUpdateSchema } },
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
		path: "/pets/{id}",
		tags: ["Pets"],
		summary: "Exclui pet",
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
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "get",
		path: "/pets/{id}/weights",
		tags: ["Weights"],
		summary: "Lista pesos do pet",
		request: {
			params: z.object({ id: z.string() }),
			query: z.object({
				limit: z.number().int().min(1).max(500).optional(),
				offset: z.number().int().min(0).optional(),
			}),
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: z.array(WeightSchema) },
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/pets/{id}/weights",
		tags: ["Weights"],
		summary: "Insere peso do pet",
		request: {
			params: z.object({ id: z.string() }),
			body: {
				content: {
					"application/json": { schema: WeightCreateBodySchema },
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
}
