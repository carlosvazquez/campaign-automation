# Campaign Automation — Project Rules

## Language
- All code, comments, and docblocks must be in English
- Naming: kebab-case for files, camelCase for variables/functions, PascalCase for types/classes/components

## Architecture
- Strict layer dependency direction: routes → services → domain ← data
- Domain layer has zero framework dependencies (no Express, no Zod, no uuid)
- HTTP concerns (status codes, req, res) must never appear in campaign-service.ts
- Business logic must never appear in campaign-routes.ts

## TypeScript
- strict: true everywhere — never disable or bypass
- No `any` types — enforced as error in ESLint
- All exported types and functions must have TSDoc docblocks
- Named exports only — never default exports in domain or data layers
- No implicit typing — every variable, parameter, and return value must have
  an explicit type annotation. Never rely on type inference for public APIs
- No magic strings or magic numbers — all literal values used as identifiers
  must be represented as a type (union type, enum, or const)
  WRONG:  const field = 'country'
  RIGHT:  const field: AudienceCondition['field'] = 'country'
- No untyped object literals passed across layer boundaries — always
  annotate the target type explicitly at the call site

## Critical field
- `creativities: string[]` is required on Campaign in every layer
- Never make it optional (no `?`), never omit it from schemas, services, responses, or types

## Per-phase discipline
- Only modify files listed in the current phase
- Do not implement logic ahead of its phase
- Run tests before declaring a phase complete

## Monorepo
- Backend runs on port 3001
- Frontend runs on port 3000
- Root `npm run dev` uses concurrently to start both
