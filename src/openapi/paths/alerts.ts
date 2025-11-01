import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../lib/z";
import { AlertsQuerySchema } from "../../schemas";
import { AlertsDueResponseSchema } from "../components/alerts";

export function registerPathsAlerts(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "get",
		path: "/alerts/due",
		tags: ["Alerts"],
		summary: "Alertas próximos",
		request: {
			query: AlertsQuerySchema.extend({
				days: z.string().optional(),
				minutes: z.string().optional(),
				offsetMinutes: z.string().optional(),
			}),
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: AlertsDueResponseSchema },
				},
			},
		},
	});
}
