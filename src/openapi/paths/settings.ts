import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { SettingsGetResponseSchema, SettingsUpdateSchema } from "../../schemas";

export function registerPathsSettings(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "get",
		path: "/settings/me",
		tags: ["Settings"],
		summary: "Obter minhas configurações",
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: SettingsGetResponseSchema },
				},
			},
		},
	});

	registry.registerPath({
		method: "put",
		path: "/settings/me",
		tags: ["Settings"],
		summary: "Atualizar minhas configurações",
		request: {
			body: {
				content: {
					"application/json": { schema: SettingsUpdateSchema },
				},
			},
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: SettingsGetResponseSchema },
				},
			},
		},
	});
}
