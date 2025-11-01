import {
	OpenAPIRegistry,
	OpenApiGeneratorV3,
	extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "../lib/z";
import { registerComponentsAlerts } from "./components/alerts";
import { registerComponentsConditions } from "./components/conditions";
import { registerComponentsGlycemia } from "./components/glycemia";
import { registerComponentsLab } from "./components/lab";
import { PARAMETERS } from "./components/parameters";
import { registerComponentsPets } from "./components/pets";
import { RESPONSES } from "./components/responses";
import { SECURITY_SCHEMES } from "./components/security";
import { registerComponentsSettings } from "./components/settings";
import { registerComponentsTreatments } from "./components/treatments";
import { registerComponentsVaccines } from "./components/vaccines";
import { registerComponentsVet } from "./components/vet";
import { registerPathsAlerts } from "./paths/alerts";
import { registerPathsConditions } from "./paths/conditions";
import { registerPathsGlycemia } from "./paths/glycemia";
import { registerPathsLab } from "./paths/lab";
import { registerPathsPets } from "./paths/pets";
import { registerPathsSettings } from "./paths/settings";
import { registerPathsTreatments } from "./paths/treatments";
import { registerPathsVaccine } from "./paths/vaccines";
import { registerPathsVet } from "./paths/vet";
import { TAGS } from "./tags";

extendZodWithOpenApi(z);

export function buildOpenApi(opts?: { serverUrl?: string }) {
	const registry = new OpenAPIRegistry();
	patchRegistryForDebug(registry);

	function patchRegistryForDebug(registry: OpenAPIRegistry) {
		const orig = registry.registerPath.bind(registry);
		registry.registerPath = ((def: any) => {
			try {
				return orig(def);
			} catch (e) {
				// Mostra qual METHOD + PATH travou
				console.error(
					"[OPENAPI] registerPath failed:",
					def?.method,
					def?.path,
				);
				throw e;
			}
		}) as any;
	}

	const serverUrl = opts?.serverUrl ?? "/";

	registerComponentsPets(registry);
	registerComponentsGlycemia(registry);
	registerComponentsLab(registry);
	registerComponentsVaccines(registry);
	registerComponentsTreatments(registry);
	registerComponentsConditions(registry);
	registerComponentsSettings(registry);
	registerComponentsVet(registry);
	registerComponentsAlerts(registry);

	registerPathsPets(registry);
	registerPathsGlycemia(registry);
	registerPathsLab(registry);
	registerPathsVaccine(registry);
	registerPathsTreatments(registry);
	registerPathsConditions(registry);
	registerPathsSettings(registry);
	registerPathsVet(registry);
	registerPathsAlerts(registry);

	const generator = new OpenApiGeneratorV3(registry.definitions);

	const doc = generator.generateDocument({
		openapi: "3.0.3",
		info: { title: "Pet API", version: "1.0.0" },
		servers: [{ url: serverUrl }],
		tags: TAGS,
	});

	doc.components = doc.components || {};
	doc.components.securitySchemes = {
		...(doc.components.securitySchemes || {}),
		...SECURITY_SCHEMES,
	};
	doc.components.parameters = {
		...(doc.components.parameters || {}),
		...PARAMETERS,
	};
	doc.components.responses = {
		...(doc.components.responses || {}),
		...RESPONSES,
	};
	doc.security = [{ bearerAuth: [] }];

	return doc;
}
