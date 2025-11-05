import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../lib/z";
import {
	SpeciesEnum,
	VaccineApplicationCreateSchema,
	VaccineTypeCreateSchema,
} from "../../schemas";
import {
	VaccineApplicationSchema,
	VaccineTypeSchema,
} from "../components/vaccines";

export function registerPathsVaccine(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "post",
		path: "/vaccines/types",
		tags: ["Vaccines"],
		summary: "Cria tipo de vacina",
		request: {
			body: {
				content: {
					"application/json": { schema: VaccineTypeCreateSchema },
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
			409: { description: "Duplicado" },
		},
	});

	registry.registerPath({
		method: "get",
		path: "/vaccines/types",
		tags: ["Vaccines"],
		summary: "Lista tipos de vacina",
		request: {
			query: z.object({
				q: z
					.string()
					.openapi({
						param: {
							name: "q",
							in: "query",
							required: false,
							description: "Busca por nome/descrição/marca",
						},
					})
					.optional(),
				species: SpeciesEnum.openapi({
					param: {
						name: "species",
						in: "query",
						required: false,
						description:
							"Filtro de espécie (dog/cat/dog_cat/other)",
					},
				}).optional(),
			}),
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: z.array(VaccineTypeSchema) },
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/vaccines/applications",
		tags: ["Vaccines"],
		summary: "Registra aplicação de vacina",
		request: {
			body: {
				content: {
					"application/json": {
						schema: VaccineApplicationCreateSchema,
					},
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
		path: "/vaccines/applications",
		tags: ["Vaccines"],
		summary: "Lista aplicações de vacina por pet",
		request: {
			query: z.object({
				petId: z
					.string()
					.openapi({
						param: {
							name: "petId",
							in: "query",
							required: false,
							description: "Filtra por pet",
						},
					})
					.optional(),
				limit: z.coerce
					.number()
					.int()
					.min(1)
					.max(200)
					.openapi({
						param: {
							name: "limit",
							in: "query",
							required: false,
							description: "Limite de itens (1-200)",
						},
					})
					.optional(),
				offset: z.coerce
					.number()
					.int()
					.min(0)
					.openapi({
						param: {
							name: "offset",
							in: "query",
							required: false,
							description: "Deslocamento de paginação",
						},
					})
					.optional(),
			}),
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.array(VaccineApplicationSchema),
					},
				},
			},
		},
	});
}
