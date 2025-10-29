import {
	OpenAPIRegistry,
	OpenApiGeneratorV3,
	extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { SettingsGetResponseSchema, SettingsSchema } from "../schemas/settings";
import {
	// alerts
	AlertsQuerySchema,
	// glycemia
	GlyPointExpectedUpdateSchema,
	GlyPointUpdateSchema,
	GlySessionCreateSchema,
	GlySessionUpdateSchema,
	// lab
	LabResultCreateSchema,
	LabTestTypeCreateSchema,
	// pets
	PetCreateSchema,
	PetUpdateSchema,
	// treatment
	TreatmentCreateSchema,
	// vaccine
	VaccineApplicationCreateSchema,
	VaccineTypeCreateSchema,
	// vets
	VetVisitCreateSchema,
} from "./../schemas";

extendZodWithOpenApi(z);

const okArray = z.array(z.any());
const okObj = z.any();

const WeightCreateBodySchema = z.object({
	weightKg: z.number().nonnegative(),
	measuredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const WeightSchema = z.object({
	id: z.string(),
	pet_id: z.string(),
	measured_at: z.string(),
	weight_kg: z.number(),
});

const PetSchema = PetCreateSchema.extend({
	id: z.string(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
	is_active: z.boolean().optional(),
});

const GlySessionSchema = z.object({
	id: z.string(),
	pet_id: z.string(),
	session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	notes: z.string().optional().nullable(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
});

const GlyPointSchema = z.object({
	id: z.string(),
	session_id: z.string(),
	idx: z.number().int(),
	expected_at: z.string(),
	glucose_mgdl: z.number().nullable().optional(),
	glucose_str: z.enum(["HI"]).nullable().optional(),
	measured_at: z.string().nullable().optional(),
	dosage_clicks: z.number().int().nullable().optional(),
	notes: z.string().nullable().optional(),
	warn_minutes_before: z.number().int().optional(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
});

const VaccineTypeSchema = z.object({
	id: z.string(),
	name: z.string(),
	total_doses: z.number(),
	description: z.string().nullable().optional(),
	created_at: z.string().optional(),
});

const VaccineApplicationSchema = z.object({
	id: z.string(),
	pet_id: z.string(),
	vaccine_type_id: z.string(),
	dose_number: z.number().int(),
	administered_at: z.string(),
	administered_by: z.string().nullable().optional(),
	clinic: z.string().nullable().optional(),
	next_dose_at: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	created_at: z.string().optional(),
	vaccine_name: z.string().optional(),
});

const TreatmentSchema = z.object({
	id: z.string(),
	pet_id: z.string(),
	type: z.string(),
	type_label: z.string().nullable().optional(),
	product_name: z.string().nullable().optional(),
	administered_at: z.string(),
	next_due_at: z.string().nullable().optional(),
	dose_info: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	created_at: z.string().optional(),
});

const AlertsDueResponseSchema = z.object({
	birthdays: z
		.array(
			z.object({
				pet_id: z.string(),
				pet_name: z.string(),
				at: z.string(),
			}),
		)
		.optional(),
	vaccines: z
		.array(
			z.object({
				id: z.string().optional(),
				pet_id: z.string(),
				pet_name: z.string().optional(),
				vaccine_name: z.string(),
				next_dose_at: z.string(),
			}),
		)
		.optional(),
	glycemia: z
		.array(
			z.object({
				session_id: z.string(),
				idx: z.number().int(),
				expected_at: z.string(),
				pet_id: z.string(),
				pet_name: z.string().optional(),
			}),
		)
		.optional(),
});

export function buildOpenApi(opts?: { serverUrl?: string }) {
	const registry = new OpenAPIRegistry();
	const serverUrl = opts?.serverUrl ?? "/";

	registry.register("Pet", PetSchema);
	registry.register("PetCreate", PetCreateSchema);
	registry.register("PetUpdate", PetUpdateSchema);
	registry.register("Weight", WeightSchema);
	registry.register("WeightCreateBody", WeightCreateBodySchema);
	registry.register("GlySession", GlySessionSchema);
	registry.register("GlyPoint", GlyPointSchema);
	registry.register("GlySessionCreate", GlySessionCreateSchema);
	registry.register("GlySessionUpdate", GlySessionUpdateSchema);
	registry.register("GlyPointUpdate", GlyPointUpdateSchema);
	registry.register("GlyPointExpectedUpdate", GlyPointExpectedUpdateSchema);
	registry.register("VaccineType", VaccineTypeSchema);
	registry.register("VaccineTypeCreate", VaccineTypeCreateSchema);
	registry.register("VaccineApplication", VaccineApplicationSchema);
	registry.register(
		"VaccineApplicationCreate",
		VaccineApplicationCreateSchema,
	);
	registry.register("Treatment", TreatmentSchema);
	registry.register("TreatmentCreate", TreatmentCreateSchema);
	registry.register("LabTestTypeCreate", LabTestTypeCreateSchema);
	registry.register("LabResultCreate", LabResultCreateSchema);
	registry.register("VetVisitCreate", VetVisitCreateSchema);
	registry.register("AlertsQuery", AlertsQuerySchema);
	registry.register("AlertsDueResponse", AlertsDueResponseSchema);
	registry.register("Settings", SettingsSchema);
	registry.register("SettingsGetResponse", SettingsGetResponseSchema);

	registry.registerPath({
		method: "get",
		path: "/pets",
		tags: ["Pets"],
		summary: "Lista pets",
		request: {
			query: z.object({
				q: z.string().optional(),
				species: z.enum(["dog", "cat", "other"]).optional(),
				gender: z.enum(["M", "F", "N"]).optional(),
				sortBy: z
					.enum(["name", "birth_date", "adoption_date"])
					.optional(),
				sortDir: z.enum(["asc", "desc"]).optional(),
			}),
		},
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: z.array(PetSchema) } },
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/pets",
		tags: ["Pets"],
		summary: "Cadastra pet",
		request: {
			body: {
				content: { "application/json": { schema: PetCreateSchema } },
			},
		},
		responses: {
			201: {
				description: "Criado",
				content: {
					"application/json": {
						schema: z.object({ id: z.string() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/pets/{id}",
		tags: ["Pets"],
		summary: "Obtém pet por id",
		request: { params: z.object({ id: z.string() }) },
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: PetSchema } },
			},
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "put",
		path: "/pets/{id}",
		tags: ["Pets"],
		summary: "Atualiza pet",
		request: {
			params: z.object({ id: z.string() }),
			body: {
				content: { "application/json": { schema: PetUpdateSchema } },
			},
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ updated: z.boolean() }),
					},
				},
			},
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "delete",
		path: "/pets/{id}",
		tags: ["Pets"],
		summary: "Exclui pet",
		request: { params: z.object({ id: z.string() }) },
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ deleted: z.boolean() }),
					},
				},
			},
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "get",
		path: "/pets/{id}/weights",
		tags: ["Weights"],
		summary: "Lista pesos do pet",
		request: {
			params: z.object({ id: z.string() }),
			query: z.object({
				limit: z.number().int().min(1).max(500).optional(),
				offset: z.number().int().min(0).optional(),
			}),
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: z.array(WeightSchema) },
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/pets/{id}/weights",
		tags: ["Weights"],
		summary: "Insere peso do pet",
		request: {
			params: z.object({ id: z.string() }),
			body: {
				content: {
					"application/json": { schema: WeightCreateBodySchema },
				},
			},
		},
		responses: {
			201: {
				description: "Criado",
				content: {
					"application/json": {
						schema: z.object({ id: z.string() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/glycemia/sessions",
		tags: ["Glycemia"],
		summary: "Lista de medições de curva glicêmica",
		request: {
			query: z.object({
				petId: z.string().optional(),
				limit: z.number().int().min(1).max(200).optional(),
				offset: z.number().int().min(0).optional(),
			}),
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: z.array(GlySessionSchema) },
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/glycemia/sessions",
		tags: ["Glycemia"],
		summary: "Cria medição de curva glicêmica",
		request: {
			body: {
				content: {
					"application/json": { schema: GlySessionCreateSchema },
				},
			},
		},
		responses: {
			201: {
				description: "Criado",
				content: {
					"application/json": {
						schema: z.object({ id: z.string() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/glycemia/sessions/{id}",
		tags: ["Glycemia"],
		summary: "Detalha medição da curva glicêmica",
		request: { params: z.object({ id: z.string() }) },
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({
							session: GlySessionSchema,
							points: z.array(GlyPointSchema),
						}),
					},
				},
			},
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "put",
		path: "/glycemia/sessions/{id}",
		tags: ["Glycemia"],
		summary: "Atualiza medição de curva glicêmica",
		request: {
			params: z.object({ id: z.string() }),
			body: {
				content: {
					"application/json": { schema: GlySessionUpdateSchema },
				},
			},
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ updated: z.boolean() }),
					},
				},
			},
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "put",
		path: "/glycemia/sessions/{id}/points/{idx}/expected",
		tags: ["Glycemia"],
		summary: "Atualiza horário esperado",
		request: {
			params: z.object({ id: z.string(), idx: z.string() }),
			body: {
				content: {
					"application/json": {
						schema: GlyPointExpectedUpdateSchema,
					},
				},
			},
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ updated: z.boolean() }),
					},
				},
			},
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "put",
		path: "/glycemia/sessions/{id}/points/{idx}",
		tags: ["Glycemia"],
		summary: "Atualiza medição específica",
		request: {
			params: z.object({ id: z.string(), idx: z.string() }),
			body: {
				content: {
					"application/json": { schema: GlyPointUpdateSchema },
				},
			},
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({ updated: z.boolean() }),
					},
				},
			},
			404: { description: "Não encontrado" },
		},
	});

	registry.registerPath({
		method: "delete",
		path: "/glycemia/sessions/{id}",
		tags: ["Glycemia"],
		summary: "Exclui medição completa",
		request: { params: z.object({ id: z.string() }) },
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.object({
							deleted: z.boolean(),
							pointsDeleted: z.number().int(),
							sessionDeleted: z.number().int(),
						}),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/lab/test-types",
		tags: ["Lab"],
		summary: "Cria tipo de exame",
		request: {
			body: {
				content: {
					"application/json": { schema: LabTestTypeCreateSchema },
				},
			},
		},
		responses: {
			201: {
				description: "Criado",
				content: {
					"application/json": {
						schema: z.object({ id: z.string() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/lab/test-types",
		tags: ["Lab"],
		summary: "Lista tipos de exame",
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: okArray } },
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/lab/results",
		tags: ["Lab"],
		summary: "Cria resultado de exame",
		request: {
			body: {
				content: {
					"application/json": { schema: LabResultCreateSchema },
				},
			},
		},
		responses: {
			201: {
				description: "Criado",
				content: {
					"application/json": {
						schema: z.object({ id: z.string() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/lab/results",
		tags: ["Lab"],
		summary: "Lista resultados de exame por pet",
		request: {
			query: z.object({
				petId: z.string().optional(),
				limit: z.number().int().min(1).max(200).optional(),
				offset: z.number().int().min(0).optional(),
			}),
		},
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: okArray } },
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/vaccines/types",
		tags: ["Vaccines"],
		summary: "Cria tipo de vacina",
		request: {
			body: {
				content: {
					"application/json": { schema: VaccineTypeCreateSchema },
				},
			},
		},
		responses: {
			201: {
				description: "Criado",
				content: {
					"application/json": {
						schema: z.object({ id: z.string() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/vaccines/types",
		tags: ["Vaccines"],
		summary: "Lista tipos de vacina",
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: z.array(VaccineTypeSchema) },
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/vaccines/applications",
		tags: ["Vaccines"],
		summary: "Registra aplicação de vacina",
		request: {
			body: {
				content: {
					"application/json": {
						schema: VaccineApplicationCreateSchema,
					},
				},
			},
		},
		responses: {
			201: {
				description: "Criado",
				content: {
					"application/json": {
						schema: z.object({ id: z.string() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/vaccines/applications",
		tags: ["Vaccines"],
		summary: "Lista aplicações de vacina por pet",
		request: {
			query: z.object({
				petId: z.string().optional(),
				limit: z.number().int().min(1).max(200).optional(),
				offset: z.number().int().min(0).optional(),
			}),
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: z.array(VaccineApplicationSchema),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/treatments",
		tags: ["Treatments"],
		summary: "Cria tratamento",
		request: {
			body: {
				content: {
					"application/json": { schema: TreatmentCreateSchema },
				},
			},
		},
		responses: {
			201: {
				description: "Criado",
				content: {
					"application/json": {
						schema: z.object({ id: z.string() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/treatments",
		tags: ["Treatments"],
		summary: "Lista tratamentos",
		request: { query: z.object({ petId: z.string().optional() }) },
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: z.array(TreatmentSchema) },
				},
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/vet/visits",
		tags: ["Vet"],
		summary: "Registra visita ao veterinário",
		request: {
			body: {
				content: {
					"application/json": { schema: VetVisitCreateSchema },
				},
			},
		},
		responses: {
			201: {
				description: "Criado",
				content: {
					"application/json": {
						schema: z.object({ id: z.string() }),
					},
				},
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/vet/visits",
		tags: ["Vet"],
		summary: "Lista visitas",
		request: { query: z.object({ petId: z.string().optional() }) },
		responses: {
			200: {
				description: "OK",
				content: { "application/json": { schema: okArray } },
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/alerts/due",
		tags: ["Alerts"],
		summary: "Alertas próximos",
		request: {
			query: z.object({
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

	registry.registerPath({
		method: "get",
		path: "/settings/me",
		summary: "Obter minhas configurações",
		tags: ["Settings"],
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
		summary: "Atualizar minhas configurações",
		tags: ["Settings"],
		request: {
			body: {
				content: { "application/json": { schema: SettingsSchema } },
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

	const TAGS = [
		{ name: "Pets", description: "Cadastro e consulta de pets" },
		{ name: "Weights", description: "Pesagens do pet" },
		{ name: "Glycemia", description: "Curvas glicêmicas" },
		{ name: "Lab", description: "Exames laboratoriais" },
		{ name: "Vaccines", description: "Tipos e aplicações de vacinas" },
		{ name: "Treatments", description: "Tratamentos preventivos e outros" },
		{ name: "Vet", description: "Consultas/visitas ao veterinário" },
		{
			name: "Alerts",
			description: "Próximos alertas (vacinas, glicemia, etc.)",
		},
		{ name: "Settings", description: "Configurações do sistema e conta" },
	];

	const generator = new OpenApiGeneratorV3(registry.definitions);

	return generator.generateDocument({
		openapi: "3.0.3",
		info: { title: "Pet API", version: "1.0.0" },
		servers: [{ url: serverUrl }],
		tags: TAGS,
	});
}
