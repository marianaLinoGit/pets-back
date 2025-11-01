import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../lib/z";
import { VetVisitCreateSchema } from "../../schemas";
import { okArray } from "../components/common";

export function registerPathsVet(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "post",
		path: "/vet/visits",
		tags: ["Vet"],
		summary: "Registra visita ao veterinário",
		request: {
			body: {
				content: {
					"application/json": { schema: VetVisitCreateSchema },
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
		path: "/vet/visits",
		tags: ["Vet"],
		summary: "Lista visitas",
		request: { query: z.object({ petId: z.string().optional() }) },
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: okArray } },
			},
		},
	});
}
