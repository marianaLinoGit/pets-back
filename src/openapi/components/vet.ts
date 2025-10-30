import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { VetVisitCreateSchema } from "../../schemas";

export function registerComponentsVet(registry: OpenAPIRegistry) {
	registry.register("VetVisitCreate", VetVisitCreateSchema);
}
