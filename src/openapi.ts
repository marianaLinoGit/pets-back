import {
	extendZodWithOpenApi,
	OpenApiGeneratorV3,
	OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTime =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+\-]\d{2}:\d{2})$/;
const timeHHmm = /^\d{2}:\d{2}$/;
const DateOnly = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/)
	.openapi({ format: "date" });
export const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

export const PetCreateSchema = z.object({
	name: z.string().min(1),
	species: z.enum(["dog", "cat", "other"]),
	breed: z.string().optional().nullable(),
	gender: z.enum(["M", "F", "N"]).optional().nullable(),
	coat: z.string().optional().nullable(),
	microchip: z.string().optional().nullable(),
	birthDate: ymd.nullable().optional(),
	adoptionDate: ymd.nullable().optional(),
});

const PetSchema = PetCreateSchema.extend({
	id: z.string(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
	is_active: z.boolean().optional(),
});

export const PetUpdateSchema = PetCreateSchema.partial();

export const PetsListQuerySchema = z.object({
	q: z.string().optional(),
	species: z.enum(["dog", "cat", "other"]).optional(),
	gender: z.enum(["M", "F", "N"]).optional(),
	sortBy: z.enum(["name", "birth_date", "adoption_date"]).optional(),
	sortDir: z.enum(["asc", "desc"]).optional(),
});

const WeightCreateBodySchema = z.object({
	weightKg: z.number().nonnegative(),
	measuredAt: z.string().regex(isoDate),
});

const WeightSchema = z.object({
	id: z.string(),
	pet_id: z.string().optional(),
	measured_at: z.string(),
	weight_kg: z.number(),
});

const VaccineTypeSchema = z.object({
	id: z.string(),
	name: z.string(),
	total_doses: z.number().int().min(1),
	description: z.string().optional().nullable(),
});

const VaccineApplicationCreateSchema = z.object({
	petId: z.string(),
	vaccineTypeId: z.string(),
	doseNumber: z.number().int().min(1),
	administeredAt: z.string().regex(isoDateTime),
	administeredBy: z.string().optional().nullable(),
	clinic: z.string().optional().nullable(),
	nextDoseAt: z.string().regex(isoDateTime).optional().nullable(),
	notes: z.string().optional().nullable(),
});

const VaccineApplicationSchema = z.object({
	id: z.string(),
	pet_id: z.string(),
	vaccine_type_id: z.string(),
	dose_number: z.number().int(),
	administered_at: z.string(),
	administered_by: z.string().optional().nullable(),
	clinic: z.string().optional().nullable(),
	next_dose_at: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
	created_at: z.string().optional(),
});

const TreatmentCreateSchema = z.object({
	petId: z.string(),
	type: z.enum(["dewormer", "flea"]),
	typeLabel: z.string().max(100).optional().nullable(),
	productName: z.string().optional().nullable(),
	administeredAt: z.string().regex(isoDateTime),
	nextDueAt: z.string().regex(isoDateTime).optional().nullable(),
	doseInfo: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
});

const TreatmentSchema = z.object({
	id: z.string(),
	pet_id: z.string(),
	type: z.enum(["dewormer", "flea"]),
	type_label: z.string().optional().nullable(),
	product_name: z.string().optional().nullable(),
	administered_at: z.string(),
	next_due_at: z.string().optional().nullable(),
	dose_info: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
	created_at: z.string().optional(),
});

const GlySessionCreateByTimesSchema = z.object({
	petId: z.string(),
	sessionDate: DateOnly,
	times: z.array(z.string().regex(timeHHmm)).length(5),
	warnMinutesBefore: z.number().int().min(1).max(120).optional(),
	offsetMinutes: z.number().int().min(-720).max(840).optional(),
	notes: z.string().optional().nullable(),
});

const GlySessionCreateByPointsSchema = z.object({
	petId: z.string(),
	points: z
		.array(z.object({ expectedAt: z.string().regex(isoDateTime) }))
		.length(5),
	warnMinutesBefore: z.number().int().min(1).max(120).optional(),
	notes: z.string().optional().nullable(),
});

const GlySessionSchema = z.object({
	id: z.string(),
	pet_id: z.string(),
	session_date: DateOnly,
	notes: z.string().optional().nullable(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
});

const GlySessionUpdateSchema = z.object({
	sessionDate: DateOnly.optional(),
	notes: z.string().nullable().optional(),
	times: z
		.array(z.string().regex(/^(\d{2}):(\d{2})$/))
		.length(5)
		.optional(),
	offsetMinutes: z.number().int().optional(),
});

const GlyPointExpectedUpdateSchema = z.object({
	expectedTime: z
		.string()
		.regex(/^(\d{2}):(\d{2})$/)
		.optional(),
	expectedAt: z.string().optional(),
	offsetMinutes: z.number().int().optional(),
});

const GlyPointSchema = z.object({
	id: z.string(),
	session_id: z.string(),
	idx: z.number().int(),
	expected_at: z.string(),
	glucose_mgdl: z.number().optional().nullable(),
	glucose_str: z.enum(["HI"]).optional().nullable(),
	measured_at: z.string().optional().nullable(),
	dosage_clicks: z.number().int().optional().nullable(),
	notes: z.string().optional().nullable(),
	warn_minutes_before: z.number().int().optional(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
});

const GlyPointUpdateSchema = z.object({
	glucoseMgDl: z.number().nonnegative().optional(),
	glucoseStr: z.enum(["HI"]).optional(),
	measuredAt: z
		.union([z.string().regex(isoDateTime), z.string().regex(timeHHmm)])
		.optional(),
	dosageClicks: z.number().int().min(0).optional(),
	notes: z.string().optional().nullable(),
});

const GlyDelResponseSchema = z.object({
	deleted: z.boolean(),
	pointsDeleted: z.number().int(),
	sessionDeleted: z.number().int(),
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
	treatments: z
		.array(
			z.object({
				id: z.string(),
				pet_id: z.string(),
				pet_name: z.string().optional(),
				next_due_at: z.string(),
				type: z.string(),
				type_label: z.string().optional().nullable(),
				product_name: z.string().optional().nullable(),
			}),
		)
		.optional(),
});

export function buildOpenApi(opts?: { serverUrl?: string }) {
	const registry = new OpenAPIRegistry();
	const serverUrl = opts?.serverUrl ?? "http://localhost:8787";

	registry.register("Pet", PetSchema);
	registry.register("PetCreate", PetCreateSchema);
	registry.register("PetUpdate", PetUpdateSchema);
	registry.register("Weight", WeightSchema);
	registry.register("WeightCreateBody", WeightCreateBodySchema);
	registry.register("VaccineType", VaccineTypeSchema);
	registry.register(
		"VaccineApplicationCreate",
		VaccineApplicationCreateSchema,
	);
	registry.register("VaccineApplication", VaccineApplicationSchema);
	registry.register("Treatment", TreatmentSchema);
	registry.register("TreatmentCreate", TreatmentCreateSchema);
	registry.register("GlySession", GlySessionSchema);
	registry.register("GlySessionUpdate", GlySessionUpdateSchema);
	registry.register("GlyPointExpectedUpdate", GlyPointExpectedUpdateSchema);
	registry.register("GlyPoint", GlyPointSchema);
	registry.register("GlySessionCreateByTimes", GlySessionCreateByTimesSchema);
	registry.register(
		"GlySessionCreateByPoints",
		GlySessionCreateByPointsSchema,
	);
	registry.register("GlyPointUpdate", GlyPointUpdateSchema);
	registry.register("AlertsDueResponse", AlertsDueResponseSchema);

	registry.registerPath({
		method: "get",
		path: "/pets",
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
		summary: "Cria pet",
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
			400: { description: "Erro de validação" },
		},
	});

	registry.registerPath({
		method: "get",
		path: "/pets/{id}",
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
		summary: "Lista sessões de curva glicêmica",
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
		summary: "Cria sessão de curva glicêmica",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.union([
							GlySessionCreateByTimesSchema,
							GlySessionCreateByPointsSchema,
						]),
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
		path: "/glycemia/sessions/{id}",
		summary: "Detalha sessão de curva glicêmica",
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
		summary:
			"Atualiza sessão (data, observações e, opcionalmente, horários esperados)",
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
		summary: "Atualiza o horário esperado de um ponto",
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
		summary: "Atualiza ponto da curva glicêmica",
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
		summary: "Exclui permanentemente a sessão de glicemia e suas medições",
		request: { params: z.object({ id: z.string() }) },
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": { schema: GlyDelResponseSchema },
				},
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/vaccines/types",
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
		summary: "Lista aplicações de vacina",
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
		method: "get",
		path: "/alerts/due",
		summary: "Agenda de próximos alertas",
		request: {
			query: z.object({
				days: z.string().optional(),
				minutes: z.string().optional(),
				offsetMinutes: z.string().optional(),
				include: z.string().optional(),
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

	const generator = new OpenApiGeneratorV3(registry.definitions);
	const doc = generator.generateDocument({
		openapi: "3.0.3",
		info: {
			title: "Pet API",
			version: "1.0.0",
			description:
				"API para cadastro de pets, pesos, vacinas, curva glicêmica, exames, tratamentos e alertas.",
		},
		servers: [{ url: serverUrl }],
	});

	return doc;
}
