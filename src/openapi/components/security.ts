import type { SecuritySchemeObject } from "openapi3-ts";

export const SECURITY_SCHEMES: Record<string, SecuritySchemeObject> = {
	bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
	apiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
};
