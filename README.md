# Campaign Automation — MVP

A fullstack marketing campaign automation tool that lets users define performance rules, target audiences, and simulate rule evaluation against live metrics in real time.

## Quick Start

Copy the environment files, install dependencies, and start both servers. No .env file is required:

```bash
git clone <repository-url>
npm install
npm run dev
# Open http://localhost:3000/campaigns/new
```

> Requires Node.js >= 20.0.0. The root `npm install` installs dependencies for both workspaces via `concurrently`.

## Stack

| Layer              | Technology    | Version | Reason                                                                                        |
| ------------------ | ------------- | ------- | --------------------------------------------------------------------------------------------- |
| Frontend framework | Next.js       | 14.2    | App Router, stable LTS line — chosen over 15.x/16.x to avoid breaking changes in async params |
| Language           | TypeScript    | 5.x     | Strict mode enforced across both workspaces; shared type discipline between layers            |
| Data fetching      | React Query   | 5.x     | First-class mutation state, built-in loading/error tracking, no boilerplate                   |
| HTTP client        | Axios         | 1.x     | Response interceptors enable transparent envelope unwrapping in one place                     |
| Styling            | Tailwind      | 3.x     | Utility-first; eliminates context switching between component and style files                 |
| Backend framework  | Express       | 4.x     | Minimal, well-understood, fast to set up; no ceremony for a two-endpoint API                  |
| Validation         | Zod           | 3.x     | Schema-first; inferred TypeScript types eliminate the DTO/schema duplication problem          |
| Testing            | Vitest        | 3.x     | ESM-native, fast cold start, compatible with TypeScript strict mode without extra config      |
| Persistence        | In-memory Map | —       | Zero config, no migration setup, sufficient for MVP scope; swappable via ICampaignRepository  |

## Project Structure

```
campaign-automation/
├── frontend/src/
│   ├── app/            # Next.js App Router pages and layouts
│   │                   # NOTE: uses App Router (/app) instead of Pages Router (/pages)
│   │                   # as suggested in the original spec — see docs/architecture.md
│   ├── components/     # Controlled UI components — no API calls, no hooks
│   ├── lib/            # Axios client, React Query config, and custom mutation hooks
│   └── types/          # Frontend domain types (intentionally mirrored from backend)
└── backend/src/
    ├── domain/         # Pure business logic — zero framework dependencies
    ├── data/           # Repository pattern — in-memory Map persistence
    ├── services/       # Orchestration layer between routes and domain
    ├── routes/         # Express handlers and Zod validation schemas
    └── tests/          # Unit and integration tests (co-located inside src)
                        # NOTE: original spec suggests /backend/test at root level —
                        # moved inside src to keep test import paths consistent
```

## API Contract

### POST /api/campaigns

Creates a new campaign and persists it to the in-memory store.

```json
{
  "name": "Black Friday EMEA",
  "budget": 15000,
  "creativities": ["banner-v1.png", "video-30s.mp4"],
  "audience": [
    { "field": "country", "value": "US" },
    { "field": "device", "value": "mobile" }
  ],
  "rule": {
    "metric": "ROAS",
    "operator": "<",
    "value": 3,
    "action": "pause"
  }
}
```

**Response 201:**

```json
{
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Black Friday EMEA",
    "budget": 15000,
    "creativities": ["banner-v1.png", "video-30s.mp4"],
    "audience": [
      { "field": "country", "value": "US" },
      { "field": "device", "value": "mobile" }
    ],
    "rule": {
      "metric": "ROAS",
      "operator": "<",
      "value": 3,
      "action": "pause"
    },
    "createdAt": "2025-03-15T11:00:00.000Z"
  }
}
```

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| 201    | Campaign created successfully            |
| 400    | Validation error — see `details` in body |
| 500    | Internal server error                    |

---

### POST /api/campaigns/:id/simulate

Evaluates a campaign's performance rule against a provided metric value.

```json
{ "metric": "ROAS", "value": 2 }
```

**Response 200 — rule triggered:**

```json
{
  "data": {
    "triggered": true,
    "action": "pause",
    "code": "TRIGGERED",
    "reason": "ROAS 2 < 3 — rule triggered, action: pause"
  }
}
```

**Response 200 — rule not triggered:**

```json
{
  "data": {
    "triggered": false,
    "action": null,
    "code": "NOT_TRIGGERED",
    "reason": "ROAS 5 is not < 3 — rule not triggered"
  }
}
```

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| 200    | Simulation complete (check `triggered`)  |
| 400    | Validation error — see `details` in body |
| 404    | Campaign not found                       |
| 500    | Internal server error                    |

## curl Reference

> Requires both servers running (`npm run dev`). Pipe to `| jq` for formatted output — remove if jq is not installed.

### POST /api/campaigns

**Create a campaign:**
```bash
curl -s -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Black Friday EMEA",
    "budget": 15000,
    "creativities": ["banner-v1.png", "video-30s.mp4"],
    "audience": [
      { "field": "country", "value": "US" },
      { "field": "device", "value": "mobile" }
    ],
    "rule": {
      "metric": "ROAS",
      "operator": "<",
      "value": 3,
      "action": "pause"
    }
  }' | jq
```

**Validation error — missing required fields:**
```bash
curl -s -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name": "x"}' | jq
```

**Validation error — empty creativities:**
```bash
curl -s -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "budget": 1000,
    "creativities": [],
    "audience": [{ "field": "country", "value": "US" }],
    "rule": { "metric": "CTR", "operator": ">", "value": 5, "action": "alert" }
  }' | jq
```

### POST /api/campaigns/:id/simulate — Seeded Mock Campaigns

The backend seeds three campaigns on startup with deterministic UUIDs — no creation step needed.

**ROAS < 3 — triggered (input 2 < 3):**
```bash
curl -s -X POST http://localhost:3001/api/campaigns/a1b2c3d4-0001-4000-8000-000000000001/simulate \
  -H "Content-Type: application/json" \
  -d '{ "metric": "ROAS", "value": 2 }' | jq
```

**ROAS < 3 — not triggered (input 5 is not < 3):**
```bash
curl -s -X POST http://localhost:3001/api/campaigns/a1b2c3d4-0001-4000-8000-000000000001/simulate \
  -H "Content-Type: application/json" \
  -d '{ "metric": "ROAS", "value": 5 }' | jq
```

**CPC > 5 — triggered (input 8 > 5):**
```bash
curl -s -X POST http://localhost:3001/api/campaigns/a1b2c3d4-0002-4000-8000-000000000002/simulate \
  -H "Content-Type: application/json" \
  -d '{ "metric": "CPC", "value": 8 }' | jq
```

**CPC > 5 — not triggered (input 3 is not > 5):**
```bash
curl -s -X POST http://localhost:3001/api/campaigns/a1b2c3d4-0002-4000-8000-000000000002/simulate \
  -H "Content-Type: application/json" \
  -d '{ "metric": "CPC", "value": 3 }' | jq
```

**CTR >= 10 — triggered on boundary (input 10 >= 10):**
```bash
curl -s -X POST http://localhost:3001/api/campaigns/a1b2c3d4-0003-4000-8000-000000000003/simulate \
  -H "Content-Type: application/json" \
  -d '{ "metric": "CTR", "value": 10 }' | jq
```

**CTR >= 10 — not triggered (input 9 is not >= 10):**
```bash
curl -s -X POST http://localhost:3001/api/campaigns/a1b2c3d4-0003-4000-8000-000000000003/simulate \
  -H "Content-Type: application/json" \
  -d '{ "metric": "CTR", "value": 9 }' | jq
```

**Metric mismatch — wrong metric name:**
```bash
curl -s -X POST http://localhost:3001/api/campaigns/a1b2c3d4-0001-4000-8000-000000000001/simulate \
  -H "Content-Type: application/json" \
  -d '{ "metric": "CPM", "value": 2 }' | jq
```

**Metric case-insensitivity — lowercase matches:**
```bash
curl -s -X POST http://localhost:3001/api/campaigns/a1b2c3d4-0001-4000-8000-000000000001/simulate \
  -H "Content-Type: application/json" \
  -d '{ "metric": "roas", "value": 2 }' | jq
```

**404 — campaign not found:**
```bash
curl -s -X POST http://localhost:3001/api/campaigns/00000000-0000-0000-0000-000000000000/simulate \
  -H "Content-Type: application/json" \
  -d '{ "metric": "ROAS", "value": 2 }' | jq
```

**400 — invalid simulate payload:**
```bash
curl -s -X POST http://localhost:3001/api/campaigns/a1b2c3d4-0001-4000-8000-000000000001/simulate \
  -H "Content-Type: application/json" \
  -d '{ "metric": "", "value": "not-a-number" }' | jq
```

## Running Tests

```bash
cd backend && npm test
# Runs: rule-engine unit tests — all five operators, metric mismatch, result shape (18 tests)
# Runs: simulate endpoint integration tests — triggered, not-triggered, 404, 400 (4 tests)

cd frontend && npm test
# Runs: component tests with Vitest + React Testing Library
```

**What IS tested:**
- Rule evaluation logic — all five operators (`<`, `>`, `=`, `>=`, `<=`), boundary cases, metric case-insensitivity, result shape
- Simulate endpoint — full HTTP integration through Express, Zod validation, service, and rule engine; covers triggered, not-triggered, 404, and 400 scenarios

**What is NOT tested (intentional given the 4-hour constraint):**
- POST /api/campaigns endpoint (creation flow)
- Frontend components
- CampaignService in isolation (no mock-repository unit tests)
- Zod validation error serialization paths beyond what the integration test covers

## AI Prompts Used

1. **[Phase 0 — Monorepo scaffold]:** "Create the base folder structure and configuration files for a monorepo with /frontend (Next.js 14, strict TypeScript, Tailwind) and /backend (Node.js + Express + strict TypeScript). Include all package.json files with exact dependency versions, tsconfig.json, .eslintrc.json, and scaffold source files with TSDoc @file docblocks and export {}."
   → Produced all 39 scaffold files and config in one pass; exact version pinning prevented peer-dependency conflicts later.

2. **[Phase 1 — Rule engine design]:** "Implement evaluateRule as a pure function using a Record<RuleOperator, OperatorFn> map instead of a switch statement. Handle metric mismatch with case-insensitive comparison. Never throw — always return SimulateResult with a code field (TRIGGERED | NOT_TRIGGERED | METRIC_MISMATCH) and a human-readable reason string."
   → Produced the operator map pattern and SimulateResultCode type, which made the test assertions cleaner and gave the frontend a machine-readable outcome.

3. **[Phase 2 — Repository seeding]:** "Seed exactly three mock campaigns with hardcoded UUID IDs exported as MOCK_CAMPAIGN_IDS so integration tests can reference predictable IDs without creating new campaigns. Campaign 1: ROAS < 3 triggers with value 2. Campaign 2: CPC > 5 does not trigger with value 3. Campaign 3: CTR >= 10 triggers on boundary."
   → Produced deterministic test fixtures that made the Phase 3 integration tests straightforward to write.

4. **[Phase 3 — Express error propagation]:** "In Express 4, async route handlers do not forward rejected promises to the global error handler automatically. Wrap the simulate handler in try/catch and call next(err) so CampaignNotFoundError reaches the global error handler and is mapped to 404."
   → Diagnosed a test timeout caused by an unhandled rejection hanging the supertest connection; fixed by adding next(err) in the catch block.

5. **[Phase 4 — Axios interceptor typing]:** "The interceptor success handler returns response.data.data (the unwrapped inner payload), but axios's TypeScript types expect the handler to return AxiosResponse. Use as unknown as AxiosResponse in the interceptor and as Promise<T> at the call sites to satisfy strict mode without using any."
   → Resolved a TS2345 type error in the interceptor without disabling strict mode or introducing any. Also, error assertNever / ts-node runtime error was resolved.

6. **[Phase 5 — Controlled form architecture]:** "The page owns all form state including creativities: string[] and simulateValue: string. Components receive value + onChange and never call hooks directly. The submit flow is: local validate → createCampaign.mutateAsync → simulateCampaign.mutateAsync, all in a single try/catch that maps ApiError to formError."
   → Kept the component tree shallow and the data flow unidirectional; SimulateResult stayed a pure display component with no side effects.

## Time Spent

| Phase | Description                                                     | Time (min) |
| ----- | --------------------------------------------------------------- | ---------- |
| 0     | Analysis, prompt design, monorepo setup, config files, scaffold | 45         |
| 1     | Domain types, rule engine, unit tests                           | 35         |
| 2     | In-memory repository, mock data seeding                         | 15         |
| 3     | Express routes, service, app config, integration tests          | 40         |
| 4     | Frontend types, Axios client, React Query hooks                 | 25         |
| 5     | UI components, page, form flow                                  | 55         |
| 6     | Documentation                                                   | 25         |
| —     | **Total**                                                       | **240**    |

## If I Had More Time

1. **Authentication** — JWT-based auth with refresh tokens, middleware-protected routes, and user-scoped campaign storage. Without it, any user can read and simulate any campaign; in production this is a non-starter.

2. **Persistence** — SQLite with Prisma as a zero-infra step before PostgreSQL. `ICampaignRepository` is defined in the domain layer as an interface, so adding a Prisma implementation is a data-layer swap only — services and routes are untouched. This is the lowest-effort path to durable storage.

3. **Integration test coverage** — Expand supertest coverage to POST /api/campaigns and all Zod validation error paths. Unit tests on the rule engine prove the logic; they do not catch middleware ordering bugs, Zod error serialization shape, or CORS header presence. The HTTP layer needs its own test suite.

4. **Observability** — Structured logging with pino (JSON lines, request IDs, response times) and error tracking with Sentry. `console.error` in the global error handler does not survive log aggregation at scale — it produces unstructured output with no correlation IDs.

5. **Event-driven simulation** — Move simulate to an async queue (BullMQ + Redis). The current synchronous HTTP call blocks the request for the full evaluation duration. Under load, a slow rule engine or a downstream call (in a real system) would exhaust the Node.js event loop. Async processing also enables retries, dead-letter queues, and audit trails.

6. **CI/CD** — GitHub Actions pipeline: lint → test → build on every PR, deploy on merge to main. Merging without automated checks means broken code reaches production; the cost of the first incident exceeds the cost of setting up the pipeline.
