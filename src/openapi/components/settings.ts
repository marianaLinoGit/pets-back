import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { SettingsGetResponseSchema, SettingsUpdateSchema } from "../../schemas";

export function registerComponentsSettings(registry: OpenAPIRegistry) {
	registry.register("SettingsUpdate", SettingsUpdateSchema);
	registry.register("SettingsGetResponse", SettingsGetResponseSchema);
}
