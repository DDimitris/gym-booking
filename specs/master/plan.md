# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a responsive, mobile-first web application for booking gym classes using a microservices architecture.
Primary technologies: Java 21 + Spring Boot (backend microservices), Maven build, Angular (latest) frontend, PostgreSQL database, Flyway for migrations, Keycloak for OAuth2/OpenID Connect authentication, Docker + docker-compose for local orchestration. Unit tests only (JUnit 5, Mockito for backend; Karma/Jasmine or Jest for Angular frontend). The initial admin account will be pre-seeded at provisioning; billing will record BillingEvents for offline reconciliation.


## Technical Context

**Language/Version**: Java 21 (backends), TypeScript/ECMAScript (frontend - Angular latest)  
**Primary Dependencies**: Spring Boot (backend microservices), Spring Security (resource server), Keycloak adapters or Spring Authorization Server integration, Flyway (DB migrations), Angular (frontend), Maven (build), RxJS/Angular Material (optional UI toolkit)  
**Storage**: PostgreSQL (latest stable)  
**Testing**: Backend: JUnit 5, Mockito; Frontend: Angular unit tests (Karma/Jasmine or Jest)  
**Target Platform**: Linux-based containers for production; developers will run via Docker Compose on local machines (Windows/macOS supported)  
**Project Type**: Web application (frontend + multiple backend microservices)  
**Performance Goals**: Responsive UI with <300ms interactive responses for UI actions under normal load; API P95 < 500ms for typical queries (subject to infra tuning)  
**Constraints**: Mobile-first responsive UI; microservices must be Dockerized; local orchestration via `docker compose`; only unit tests required for initial delivery (no integration tests mandated by constitution)  
**Scale/Scope**: MVP targets a single-gym deployment with up to a few thousand users; design for horizontal scaling (stateless services where possible)  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution requirements (from `.specify/memory/constitution.md`) mandate:
- Frontend: Angular — OK (plan uses latest Angular)
- Backend: Spring Boot on Java 21 — OK
- Authentication: Keycloak — OK
- Database: PostgreSQL + Flyway migrations — OK
- Architecture: microservices — OK (plan uses microservices)
- Containerization: Docker + docker-compose — OK
- Testing: unit tests required — OK (JUnit 5, Angular unit tests)

Conclusion: Plan conforms to the constitution's required technologies and minimal rules. No constitution gate violations identified for Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
