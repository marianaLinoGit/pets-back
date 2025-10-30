import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { LabResultCreateSchema } from "../../schemas";
import { okArray, SpeciesEnum } from "../components/common";
import {
	LabTestTypeCreate,
	LabTestTypeSchema,
	LabTestTypeUpdate,
} from "../components/lab";

export function registerPathsLab(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "post",
		path: "/lab/test-types",
		tags: ["Lab"],
		summary: "Cria tipo de exame",
		request: {
			body: {
				content: { "application/json": { schema: LabTestTypeCreate } },
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
			409: { description: "Duplicado" },
		},
	});

	registry.registerPath({
		method: "put",
		path: "/lab/test-types/{id}",
		tags: ["Lab"],
		summary: "Atualiza tipo de exame",
		request: {
			params: z.object({ id: z.string() }),
			body: {
				content: { "application/json": { schema: LabTestTypeUpdate } },
			},
		},
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: LabTestTypeSchema } },
			},
			404: { description: "Não encontrado" },
			409: { description: "Duplicado" },
		},
	});

	registry.registerPath({
		method: "get",
		path: "/lab/test-types",
		tags: ["Lab"],
		summary: "Lista tipos de exame",
		request: {
			query: z.object({
				q: z.string().optional(),
				species: SpeciesEnum.optional(),
			}),
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: z.array(LabTestTypeSchema) },
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/lab/results",
		tags: ["Lab"],
		summary: "Cria resultado de exame",
		request: {
			body: {
				content: {
					"application/json": { schema: LabResultCreateSchema },
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
		path: "/lab/results",
		tags: ["Lab"],
		summary: "Lista resultados de exame por pet",
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
				content: { "application/json": { schema: okArray } },
			},
		},
	});
}
