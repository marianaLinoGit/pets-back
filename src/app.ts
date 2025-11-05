import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { buildOpenApi } from "./openapi";
import { alerts } from "./routes/alerts";
import { conditions } from "./routes/conditions";
import { glycemia } from "./routes/glycemia";
import { lab } from "./routes/lab";
import { pets } from "./routes/pets";
import { settings } from "./routes/settings";
import { treatments } from "./routes/treatments";
import { vaccines } from "./routes/vaccines";
import { vetVisits } from "./routes/vet-visits";

type Env = { Bindings: { DB: D1Database; API_KEY?: string } };

const app = new Hono<Env>();
app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));

app.route("/pets", pets);
app.route("/glycemia", glycemia);
app.route("/lab", lab);
app.route("/vaccines", vaccines);
app.route("/treatments", treatments);
app.route("/vet-visits", vetVisits);
app.route("/alerts", alerts);
app.route("/settings", settings);
app.route("/", conditions);

let openapiDoc: any | null = null;

app.get("/openapi.json", (c) => {
	try {
		if (!openapiDoc) {
			openapiDoc = buildOpenApi({ serverUrl: "/" });
		}
		return c.json(openapiDoc);
	} catch (err: any) {
		console.error("[OPENAPI] build failed:", err?.stack || err);
		return c.json(
			{ error: "openapi_build_failed", message: String(err) },
			500,
		);
	}
});

app.get(
	"/docs",
	swaggerUI({
		url: "/openapi.json",
		docExpansion: "list",
		deepLinking: true,
	}),
);

export default app;
