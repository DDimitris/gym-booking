# [PROJECT_NAME] Constitution
<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### [PRINCIPLE_1_NAME]
<!-- Example: I. Library-First -->
[PRINCIPLE_1_DESCRIPTION]
<!-- Example: Every feature starts as a standalone library; Libraries must be self-contained, independently testable, documented; Clear purpose required - no organizational-only libraries -->

### [PRINCIPLE_2_NAME]
<!-- Example: II. CLI Interface -->
[PRINCIPLE_2_DESCRIPTION]
<!-- Example: Every library exposes functionality via CLI; Text in/out protocol: stdin/args → stdout, errors → stderr; Support JSON + human-readable formats -->

### [PRINCIPLE_3_NAME]
<!-- Example: III. Test-First (NON-NEGOTIABLE) -->
[PRINCIPLE_3_DESCRIPTION]
<!-- Example: TDD mandatory: Tests written → User approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced -->

### [PRINCIPLE_4_NAME]
<!-- Example: IV. Integration Testing -->
[PRINCIPLE_4_DESCRIPTION]
<!-- Example: Focus areas requiring integration tests: New library contract tests, Contract changes, Inter-service communication, Shared schemas -->

### [PRINCIPLE_5_NAME]
<!-- Example: V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity -->
[PRINCIPLE_5_DESCRIPTION]
<!-- Example: Text I/O ensures debuggability; Structured logging required; Or: MAJOR.MINOR.BUILD format; Or: Start simple, YAGNI principles -->

## [SECTION_2_NAME]
<!-- Example: Additional Constraints, Security Requirements, Performance Standards, etc. -->

[SECTION_2_CONTENT]
<!-- Example: Technology stack requirements, compliance standards, deployment policies, etc. -->

## [SECTION_3_NAME]
<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

[SECTION_3_CONTENT]
<!-- Example: Code review requirements, testing gates, deployment approval process, etc. -->

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

```markdown
# [PROJECT_NAME] Constitution — Required Technologies & Minimal Rules
> Purpose: required, non-negotiable runtime and development constraints for this project.

## 1 — Project Identity
- Name: `[PROJECT_NAME]` (populate)
- Short description: one-line statement of purpose.

## 2 — Required Technology Stack
- Frontend: latest stable Angular (use the latest Angular major at time of ratification). Produce a production build via `ng build`.
- Backend: latest stable Spring Boot compatible with Java 21. All services must target Java 21.
- Authentication: Keycloak for OAuth2 / OpenID Connect (use Keycloak as the identity provider; backends act as resource servers).
- Database: latest PostgreSQL (use official image in Docker). All schema changes managed via Flyway.
- Migrations: Flyway for initialization and migrations; migrations included in each relevant service or centralized migration service.
- Architecture: microservices. Each bounded context is a separate service (separate Docker image), with clear API contracts.

## 3 — Containerization & Orchestration
- Every service (frontend and each backend microservice) must have a `Dockerfile` producing a runnable image.
- A `docker-compose.yml` must be provided at repo root to orchestrate local development and full-stack runs, including services:
	- `keycloak` (or `auth` if delegating to external Keycloak),
	- `postgres`,
	- one or more backend microservices,
	- `frontend` (Angular static assets served by a lightweight webserver or a dedicated UI container),
	- optional `flyway` job or migration service to run migrations before backends start.
- Compose files should provide a `depends_on` mesh and healthchecks so services start in the correct order.

## 4 — Environment Variables & Secrets
Include a `.env.sample` listing required variables for compose and services. At minimum:
- POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT
- FLYWAY_URL, FLYWAY_USER, FLYWAY_PASSWORD (or reuse POSTGRES_*)
- KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET
- SPRING_PROFILES_ACTIVE (e.g., dev|prod)
- JAVA_OPTS (optional runtime JVM options)
- FRONTEND_API_BASE_URL (used by Angular to contact backends)

Secrets must never be committed. Use `.env` for local development only and document production secret management.

## 5 — Commands & Scripts
The repo must expose standard top-level scripts (in `Makefile`, `package.json`, or root scripts):
- `install` — install any frontend tooling and prepare build environment
- `build:frontend` — `ng build --configuration production`
- `build:service:<name>` — build and package each Spring Boot service (e.g., `mvn -DskipTests package`)
- `docker:build` — build all Docker images
- `docker:up` — `docker compose up --build` to start full stack locally
- `migrate` — run Flyway migrations (can be run as a container in compose)
- `test` — run unit tests for all services (no integration tests required)

## 6 — API & REST Architecture
- All backend services must expose RESTful JSON APIs following resource-based URI design and standard HTTP methods (GET, POST, PUT/PATCH, DELETE).
- APIs must be documented (OpenAPI/Swagger endpoint available per service).
- Authentication/authorization must be enforced via Keycloak (JWT access tokens); services must validate tokens and enforce scopes/roles.
- Error responses must use consistent JSON structure and proper HTTP status codes.

## 7 — Data & Migrations
- Use Flyway for all database migrations. Migration scripts must be stored under each service that owns a schema or in a centralized `migrations/` directory if using a dedicated migration step.
- Backends must fail-fast if migrations are missing or DB incompatible.

## 8 — Testing (explicit requirement)
- Only unit tests are required for this constitution. Integration tests are optional but not required here.
- Backend: JUnit 5 + Mock frameworks (Mockito). Tests must cover service/business-layer logic and controller edge cases (mocking external dependencies and DB access).
- Frontend: Angular unit tests (Karma/Jasmine or Jest) covering components and services.
- Running `test` must execute all unit tests for every service and the frontend and exit non-zero on failures.

## 9 — Logging & Health
- Each service must expose a `/health` endpoint returning 200 and JSON with at minimum `{ "status": "UP", "db": "OK|FAIL" }`.
- Use structured logs; include request correlation IDs in logs for tracing.

## 10 — Security & Best Practices
- TLS/HTTPS must be used in production deployments. Document TLS termination point.
- Do not store secrets in source control. Use environment variables or secret managers.
- Validate and sanitize all incoming data. Use server-side input validation and appropriate HTTP status codes.

## 11 — Deployment & Runtime Expectations
- Services must be deployable as immutable Docker images. Prefer multi-stage Dockerfiles to produce minimal runtime images.
- Provide `docker-compose.yml` for local full-stack orchestration. Production orchestration (Kubernetes etc.) may be documented but is out of scope for this constitution.

## 12 — Minimal File & Artifact Checklist (must exist in repository)
- `README.md` — project purpose and quick-start using `docker compose up --build`
- `docker-compose.yml` — orchestrates Keycloak, Postgres, Flyway (or migration job), backend services, and frontend
- `Dockerfile` per service (backend services + frontend)
- `migrations/` or per-service `db/migration` folders with Flyway SQL scripts
- `services/<service-name>/` for each microservice with its own `pom.xml`/`build.gradle`, `src/`, and tests
- `frontend/` with Angular project and unit tests
- `.env.sample` — example environment variables (no secrets)

## 13 — Governance
- Any change to API contracts or database schema requires a migration plan and updated unit tests.
- PRs touching authentication, API contracts, or schema must include: description of change, migration scripts (if applicable), and updated unit tests.

**Version**: 1.0.0 | **Ratified**: [DATE]

<!-- MANUAL ADDITIONS START -->
<!-- Add project-specific extensions below this line. Keep them concise. -->

```
