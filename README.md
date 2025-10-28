# Pet API (Cloudflare Workers + Hono + D1)

API para gestão de pets, pesos, curvas glicêmicas, exames de laboratório, vacinas, tratamentos, visitas ao veterinário e alertas.  
Stack: **Cloudflare Workers**, **Hono**, **D1**, **TypeScript**, **OpenAPI/Swagger**.

## Requisitos

- Node.js 20+
- npm 9+ (ou pnpm/yarn, se preferir)
- Conta Cloudflare
- Wrangler `npx wrangler --version` (instalação automática via npx)

## Rodando em desenvolvimento

```bash
# na raiz do projeto (onde fica o wrangler.toml)
npm i
npm run dev
# ou
npx wrangler dev
```

- Servidor local: `http://127.0.0.1:8787`
- Healthcheck: `GET /health`
- Se OpenAPI estiver habilitado:  
  - JSON: `GET /openapi.json`  
  - UI: `GET /docs`

## Deploy (produção)

```bash
# autenticar no Cloudflare (uma vez)
npx wrangler login

# publicar a versão atual
npx wrangler publish
```

Logs em produção:
```bash
npx wrangler tail pet-api
```

## Configuração do Cloudflare

### `wrangler.toml` (raiz)

```toml
name = "pet-api"
main = "src/index.ts"
compatibility_date = "2024-11-06"

[d1_databases]
DB = { binding = "DB", database_name = "pet_api_db", database_id = "<preencha>" }

[vars]
# variáveis de DEV (alternativa ao .dev.vars)
# API_KEY = "dev-key"

[env.production]
# se precisar, configure DB separado para prod aqui
# [env.production.d1_databases]
# DB = { binding = "DB", database_name = "pet_api_db", database_id = "<id-prod>" }
```

Criar o banco D1 (uma vez) e preencher `database_id`:
```bash
npx wrangler d1 create pet_api_db
```

### Segredos/variáveis

- Local (dev): arquivo `.dev.vars` na raiz
  ```
  API_KEY=dev-key
  ```
- Produção: via secret do Worker
  ```bash
  npx wrangler secret put API_KEY
  ```

## Migrations (D1)

Estrutura recomendada:
```
migrations/
  0001_init.sql
  0002_add_indexes.sql
  ...
```

Criar um arquivo de migration:
```bash
npx wrangler d1 migrations create init
# edite o SQL gerado em migrations/xxxx_init.sql
```

Aplicar migrations:

```bash
# banco local (usado pelo wrangler dev)
npx wrangler d1 migrations apply pet_api_db --local

# banco remoto (produção)
npx wrangler d1 migrations apply pet_api_db --remote
```

Executar SQL solto:
```bash
# local
npx wrangler d1 execute pet_api_db --local --command "SELECT COUNT(*) FROM pets"

# remoto
npx wrangler d1 execute pet_api_db --remote --command "SELECT COUNT(*) FROM pets"

# a partir de arquivo
npx wrangler d1 execute pet_api_db --local  --file seeds/dev-seed.sql
npx wrangler d1 execute pet_api_db --remote --file seeds/prod-seed.sql
```

## Estrutura de pastas

```
.
├─ src/
│  ├─ index.ts            # Entrypoint do Hono (rotas)
│  └─ lib/
│     └─ openapi.ts       # Registro do OpenAPI/Swagger (se habilitado)
├─ migrations/            # Scripts versionados de schema
├─ seeds/                 # SQL de seed (opcional)
├─ wrangler.toml          # Config do Worker e bindings do D1
├─ .dev.vars              # Variáveis locais (opcional)
└─ README.md
```

## Rotas principais (resumo)

- Pets: `GET /pets`, `GET /pets/:id`, `POST /pets`, `PUT /pets/:id`, `DELETE /pets/:id`
- Pesos: `GET /pets/:id/weights`, `POST /pets/:id/weights`
- Curva glicêmica: `POST /glycemia/sessions`, `GET /glycemia/sessions/:id`, `PUT /glycemia/sessions/:id/points/:idx`
- Laboratório: `POST /lab/test-types`, `GET /lab/test-types`, `POST /lab/results`, `GET /lab/results?petId=...`
- Vacinas: `POST /vaccines/types`, `GET /vaccines/types`, `POST /vaccines/applications`, `GET /vaccines/applications?petId=...`
- Tratamentos: `POST /treatments`, `GET /treatments?petId=...`
- Veterinário: `POST /vet/visits`, `GET /vet/visits?petId=...`
- Alertas: `GET /alerts/due?days=7&minutes=15&offsetMinutes=-180`
- Health: `GET /health`

> Rotas de **escrita** exigem header `x-api-key`.

## Exemplos rápidos (curl)

```bash
# listar pets
curl http://127.0.0.1:8787/pets

# criar pet
curl -X POST http://127.0.0.1:8787/pets   -H "Content-Type: application/json"   -H "x-api-key: dev-key"   -d '{"name":"Bob","species":"dog","breed":null,"birthYear":2020,"birthMonth":5,"birthDay":12,"gender":"M"}'

# próximos alertas (7 dias; avisar glicemia 15 min antes; offset -180 = BRT)
curl "http://127.0.0.1:8787/alerts/due?days=7&minutes=15&offsetMinutes=-180"
```

## OpenAPI / Swagger

Se você habilitou o registro OpenAPI (`src/lib/openapi.ts` + integração no `index.ts`):

- Documentação JSON: `GET /openapi.json`  
- Swagger UI: `GET /docs`

Exportar arquivo:
```bash
# local
curl http://127.0.0.1:8787/openapi.json -o openapi.json

# produção (ajuste a URL do seu Worker)
curl https://<seu-subdominio>.workers.dev/openapi.json -o openapi.json
```

## Tipos TypeScript (Workers/D1)

Para resolver tipos como `D1Database`:

```bash
npm i -D @cloudflare/workers-types
```

`tsconfig.json` (trecho):
```json
{
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"]
  }
}
```

## Boas práticas e notas

- `x-api-key`: use `.dev.vars` no dev e `wrangler secret put` em produção.
- `offsetMinutes` padrão dos utilitários está em `-180` (BRT). Ajuste conforme necessário.
- Evite mutações de schema sem migration (`migrations/*.sql`).
- Para simular produção no dev usando o DB remoto: `npx wrangler dev --remote`.

## Solução de problemas

- **`zodSchema.openapi is not a function`**  
  Verifique se:
  1) as versões são compatíveis: `zod` 3.x e `@asteasolutions/zod-to-openapi` 7.x  
  2) você chamou `extendZodWithOpenApi(z)` **uma única vez** antes de registrar rotas no OpenAPI.
  3) está importando `z` do `zod` e passando o **mesmo** `z` para `extendZodWithOpenApi`.

  Exemplo de instalação estável:
  ```bash
  npm i zod@^3 @asteasolutions/zod-to-openapi@^7
  ```

- **`Cannot find name 'D1Database'`**  
  Instale e referencie `@cloudflare/workers-types` e adicione em `tsconfig.json` (seção acima).

- **Banco local vazio no dev**  
  Aplique as migrations localmente:
  ```bash
  npx wrangler d1 migrations apply pet_api_db --local
  ```

## Licença

MIT — use à vontade.
