# research.md

## Purpose
Collect Phase 0 decisions and rationale for the Gym Class Booking feature. Resolve outstanding technical choices and document alternatives considered.

---

## Decisions

- Decision: Use Java 21 + Spring Boot for backend microservices.
  - Rationale: Spring Boot provides mature support for microservices, easy Keycloak integration, and a large ecosystem (Flyway, JUnit). Java 21 offers LTS-level features and modern JVM improvements.
  - Alternatives considered: Kotlin + Spring (similar ergonomics), Node.js (lighter, but less suited for enterprise Java ecosystems). Chosen for ecosystem fit and team familiarity.

- Decision: Use Angular (latest) for the frontend.
  - Rationale: Angular provides strong TypeScript-based structure, first-class tooling for large SPAs, and built-in testing support. The constitution mandates Angular.
  - Alternatives considered: React or Vue. Rejected because the constitution and stakeholder requested Angular.

- Decision: Use PostgreSQL with Flyway for DB and migrations.
  - Rationale: PostgreSQL is reliable and fits relational booking data well. Flyway is simple to embed into CI and Docker flows to manage schema migrations.

- Decision: Use Keycloak as the identity provider (OAuth2/OIDC).
  - Rationale: Keycloak supports social login providers (Google/Facebook), standard OIDC flows, role mapping, and integrates well with Spring Security.

- Decision: Dockerize all services and orchestrate with docker-compose for local/full-stack development.
  - Rationale: Matches constitution requirements and simplifies local developer experience. Production orchestration (Kubernetes) can be documented later.

- Decision: Admin provisioning default = pre-seeded admin account during provisioning.
  - Rationale: Simplifies initial setup and avoids bootstrap UI; documented in deployment notes so operators can adjust.

- Decision: Billing default = record BillingEvent and use offline invoicing/manual reconciliation for initial delivery.
  - Rationale: Keeps MVP scope small; exportable reports allow accounting teams to process charges without immediate gateway integration.

- Decision: Same-day cancellation window default = <24 hours before class start (gym local time).
  - Rationale: A commonly used business rule (24-hour window) is a reasonable default and is configurable.

---

## Next research tasks (if team wants alternatives explored)

- If product owner prefers immediate charges, research recommended payment gateway options (Stripe recommended for global coverage) and the changes required to record/settle payments.
- If admin provisioning needs self-service, research secure invite flows and secrets-invite mechanisms for first admin setup.
