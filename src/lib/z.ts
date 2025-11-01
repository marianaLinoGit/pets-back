import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z as zod } from "zod";

extendZodWithOpenApi(zod);

export const z = zod;
