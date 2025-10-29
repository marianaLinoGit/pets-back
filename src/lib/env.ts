import type { D1Database } from "@cloudflare/workers-types";

export type Bindings = {
	DB: D1Database;
	API_KEY?: string;
};

export type Env = {
	Bindings: Bindings;
};

export const getDB = (c: { env: Bindings }) => c.env.DB;
export const getApiKey = (c: { env: Bindings }) => c.env.API_KEY || "";
