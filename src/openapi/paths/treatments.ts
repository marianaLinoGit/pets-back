import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { TreatmentCreateSchema } from "../../schemas";
import { TreatmentSchema } from "../components/treatments";

export function registerPathsTreatments(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "post",
		path: "/treatments",
		tags: ["Treatments"],
		summary: "Cria tratamento",
		request: {
			body: {
				content: {
					"application/json": { schema: TreatmentCreateSchema },
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
		path: "/treatments",
		tags: ["Treatments"],
		summary: "Lista tratamentos",
		request: { query: z.object({ petId: z.string().optional() }) },
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: z.array(TreatmentSchema) },
				},
			},
		},
	});
}
