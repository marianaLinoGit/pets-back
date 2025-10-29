import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { buildOpenApi } from "./openapi/openapi";
import { alerts } from "./routes/alerts";
import { glycemia } from "./routes/glycemia";
import { lab } from "./routes/lab";
import { pets } from "./routes/pets";
import settings from "./routes/settings";
import { treatments } from "./routes/treatments";
import { vaccines } from "./routes/vaccines";
import { vet } from "./routes/vet";

type Env = { Bindings: { DB: D1Database; API_KEY?: string } };

const app = new Hono<Env>();
app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));

app.route("/pets", pets);
app.route("/glycemia", glycemia);
app.route("/lab", lab);
app.route("/vaccines", vaccines);
app.route("/treatments", treatments);
app.route("/vet", vet);
app.route("/alerts", alerts);
app.route("/settings", settings);

app.get("/openapi.json", (c) => c.json(buildOpenApi({ serverUrl: "/" })));
app.get(
	"/docs",
	swaggerUI({
		url: "/openapi.json",
		docExpansion: "list",
		deepLinking: true,
	}),
);

export default app;
