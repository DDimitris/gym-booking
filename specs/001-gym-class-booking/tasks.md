---
description: "Generated task list for Gym Class Booking feature"
---

# Tasks: Gym Class Booking

**Input**: Design documents from `/specs/001-gym-class-booking/` (plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, containerization and repo scaffolding so developers can build and run the system locally.

- [ ] T001 Create repository directories and README at `services/booking-service/`, `frontend/`, `deploy/`, `migrations/`, `docs/` (create `README.md` in repo root)
- [ ] T002 [P] Create root `docker-compose.yml` placeholder at `/docker-compose.yml` (services: keycloak, postgres, flyway job, booking-service, frontend)
- [ ] T003 [P] Add `.env.sample` at `/.env.sample` listing required env vars (POSTGRES_*, KEYCLOAK_*, SPRING_PROFILES_ACTIVE, FRONTEND_API_BASE_URL)
- [ ] T004 [P] Add `services/booking-service/Dockerfile` multi-stage Java/Maven build placeholder
- [ ] T005 [P] Add `frontend/Dockerfile` multi-stage Angular build + Nginx placeholder
- [ ] T006 Initialize a Maven Spring Boot skeleton at `services/booking-service/` (create `pom.xml`, `src/main/java/com/gymbooking/Application.java`)
- [ ] T007 Initialize an Angular skeleton at `frontend/` (create `frontend/package.json`, `frontend/src/` placeholder files)
- [ ] T008 [P] Add basic CI workflow placeholder at `.github/workflows/unit-tests.yml` to run unit tests for backend (mvn test) and frontend (npm test)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infra that must be completed before implementing user stories (DB, auth, base models, migrations, health endpoints).

- [ ] T009 Setup PostgreSQL migration structure for Flyway: `services/booking-service/src/main/resources/db/migration/V1__init.sql`
- [ ] T010 [P] Add `services/booking-service/src/main/resources/application.yml` with DB and Keycloak placeholders and a `/health` actuator endpoint enabled
- [ ] T011 [P] Configure Keycloak integration placeholders: `services/booking-service/src/main/resources/keycloak.json` and Spring Security config class at `services/booking-service/src/main/java/com/gymbooking/config/SecurityConfig.java`
- [ ] T012 Create base entities used across stories: `services/booking-service/src/main/java/com/gymbooking/model/User.java`, `services/booking-service/src/main/java/com/gymbooking/model/ClassType.java`, `services/booking-service/src/main/java/com/gymbooking/model/ClassInstance.java`
- [ ] T013 [P] Implement a shared `HealthController` at `services/booking-service/src/main/java/com/gymbooking/api/HealthController.java` exposing `/health`
- [ ] T014 [P] Add logging configuration `services/booking-service/src/main/resources/logback.xml` and request correlation filter `services/booking-service/src/main/java/com/gymbooking/filter/RequestCorrelationFilter.java`
- [ ] T015 Setup Flyway migration runner in the booking-service `pom.xml` and ensure migrations are run at startup (documented in quickstart)
- [ ] T016 [P] Add basic frontend app shell in `frontend/src/app/app.module.ts` and `frontend/src/index.html` with placeholder API base URL usage (`environment.ts`)

---

## Phase 3: User Story 1 - Athlete books a class (Priority: P1) 🎯 MVP

**Goal**: Allow an Athlete to browse class types, view class-instance calendar, reserve a slot (capacity 5), cancel a reservation and view personal history.

**Independent Test**: Create an Athlete, authenticate, GET `/class-types`, GET `/class-instances?classType={id}&date=YYYY-MM-DD`, POST `/reservations` to reserve, then GET `/reservations` to confirm entry.

### Implementation tasks

- [ ] T017 [US1] Create `Reservation` model at `services/booking-service/src/main/java/com/gymbooking/model/Reservation.java`
- [ ] T018 [US1] Create JPA repositories: `services/booking-service/src/main/java/com/gymbooking/repository/UserRepository.java`, `.../ClassTypeRepository.java`, `.../ClassInstanceRepository.java`, `.../ReservationRepository.java`
- [ ] T019 [US1] Implement `BookingService` business logic at `services/booking-service/src/main/java/com/gymbooking/service/BookingService.java` (methods: listClassTypes, listClassInstances(filter), createReservation, cancelReservation, listUserHistory)
- [ ] T020 [US1] Implement REST controllers for backend endpoints:
  - `services/booking-service/src/main/java/com/gymbooking/api/ClassTypeController.java` (GET/POST/PUT/DELETE)
  - `services/booking-service/src/main/java/com/gymbooking/api/ClassInstanceController.java` (GET/POST/DELETE)
  - `services/booking-service/src/main/java/com/gymbooking/api/ReservationController.java` (POST, GET, DELETE)
- [ ] T021 [US1] Implement concurrency-safe reservation creation in `BookingService.createReservation` (DB row-level lock / optimistic check) and add unit tests
- [ ] T022 [US1] Add unit tests for BookingService business rules at `services/booking-service/src/test/java/com/gymbooking/service/BookingServiceTest.java` (cover overbooking and cancellation rule)
- [ ] T023 [US1] Frontend: Add class-type dropdown component `frontend/src/app/components/class-type-select/class-type-select.component.ts` and calendar view `frontend/src/app/pages/calendar/calendar.component.ts`
- [ ] T024 [US1] Frontend: Add reservation flow UI (select slot, confirm) `frontend/src/app/pages/calendar/reservation-dialog.component.ts` and service `frontend/src/app/services/booking.service.ts` calling `/api/reservations`
- [ ] T025 [US1] Frontend: Add user history page `frontend/src/app/pages/history/history.component.ts` that GETs `/api/reservations`
- [ ] T026 [US1] Add unit tests for frontend components in `frontend/src/app/components/.../*.spec.ts` covering selection and API invocation (Karma/Jasmine or Jest)

---

## Phase 4: User Story 4 - Authentication flows (Priority: P1)

**Goal**: Allow users to register/login with email/password and social providers (Google, Facebook) via Keycloak and obtain tokens for protected API access.

**Independent Test**: Create account via Keycloak (email or social), obtain token, call GET `/auth/me` and assert correct role and profile.

- [ ] T027 [US4] Add `/auth/me` endpoint in booking-service: `services/booking-service/src/main/java/com/gymbooking/api/AuthController.java`
- [ ] T028 [US4] Configure Keycloak realm and client placeholders in `deploy/keycloak/` (docker-compose + realm import JSON)
- [ ] T029 [US4] Implement role mapping and method-level security on controllers (use Spring Security annotations) at `services/booking-service/src/main/java/com/gymbooking/config/SecurityConfig.java`
- [ ] T030 [US4] Add unit tests for security config and controller auth behaviors at `services/booking-service/src/test/java/com/gymbooking/api/AuthControllerTest.java`
- [ ] T031 [US4] Frontend: Implement login/logout flows using OIDC client in `frontend/src/app/services/auth.service.ts` and protect routes in `frontend/src/app/app-routing.module.ts`
- [ ] T032 [US4] Frontend: Add social login buttons wired to Keycloak OIDC flows in `frontend/src/app/components/login/login.component.ts`

---

## Phase 5: User Story 3 - Admin manages users, billing and exports (Priority: P1)

**Goal**: Admin can view all athletes, assign base costs and bonus days, view weekly/monthly summaries, and export per-athlete stats (Excel/CSV).

**Independent Test**: Admin authenticates, GET `/admin/athletes`, set a base cost for an athlete, assign bonus days, request `/admin/athletes/export?start=YYYY-MM-DD&end=YYYY-MM-DD` and verify XLSX/CSV content.

- [ ] T033 [US3] Implement `AdminController` endpoints in `services/booking-service/src/main/java/com/gymbooking/api/AdminController.java` (list athletes, set base cost, set bonus days, export)
- [ ] T034 [US3] Implement `BillingService` at `services/booking-service/src/main/java/com/gymbooking/service/BillingService.java` to record `BillingEvent` entities and generate export rows
- [ ] T035 [US3] Create `BillingEvent` entity at `services/booking-service/src/main/java/com/gymbooking/model/BillingEvent.java` and repository
- [ ] T036 [US3] Add unit tests for billing rules (same-day cancellation triggers BillingEvent) at `services/booking-service/src/test/java/com/gymbooking/service/BillingServiceTest.java`
- [ ] T037 [US3] Frontend: Add Admin dashboard page `frontend/src/app/pages/admin/dashboard.component.ts` with athlete list and export button
- [ ] T038 [US3] Implement server-side export generation utility at `services/booking-service/src/main/java/com/gymbooking/util/ExportUtil.java` (produce CSV/XLSX)

---

## Phase 6: User Story 2 - Instructor manages classes (Priority: P2)

**Goal**: Instructors create/edit/delete class types and class instances and view reservations for their classes.

**Independent Test**: Instructor authenticates, creates a class type, creates a class instance, and verifies it appears for athletes; instructor views reservations for that instance.

- [ ] T039 [US2] Implement Instructor endpoints in `services/booking-service/src/main/java/com/gymbooking/api/InstructorController.java` (create/edit/delete class types & instances)
- [ ] T040 [US2] Add unit tests for instructor flows at `services/booking-service/src/test/java/com/gymbooking/api/InstructorControllerTest.java`
- [ ] T041 [US2] Frontend: Add Instructor UI components `frontend/src/app/pages/instructor/*.component.ts` to create/edit/delete class types and instances and to view reservations
- [ ] T042 [US2] Add reservation notification/email placeholder task in `services/booking-service/src/main/java/com/gymbooking/service/NotificationService.java` (stub for later integration)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, final unit-tests, security hardening, and quickstart validation.

- [ ] T043 [P] Add end-to-end Quickstart docs `specs/001-gym-class-booking/quickstart.md` (verify and update with real ports and example env)
- [ ] T044 [P] Improve logging and add request correlation end-to-end (`frontend` -> backend headers) in `services/booking-service` and `frontend`
- [ ] T045 [P] Add unit test coverage target check in CI config (fail build if core modules under 80% coverage)
- [ ] T046 [P] Add `deploy/README.md` documenting admin provisioning (pre-seed), billing defaults and how to change them

---

## Dependencies & Execution Order

- Setup (T001..T008) must complete before Foundational (T009..T016).
- Foundational must complete before any User Story phases (T017..T042).
- User Story phases with P1 priority: US1 (T017..T026), US4 (T027..T032), US3 (T033..T038) — these can be implemented in parallel after foundation is ready.
- US2 (T039..T042) is P2 and may follow or run in parallel after foundation.

## Parallel Opportunities

- Tasks marked `[P]` are safe to run in parallel (T002, T003, T004, T005, T008, T011, T014, T016, T043..T046).
- After foundational: US1, US3, US4 can be developed in parallel by separate devs.

## Counts & Summary

- Total tasks generated: 46
- Tasks per user story:
  - US1 (Athlete booking): 10 tasks (T017..T026)
  - US2 (Instructor): 4 tasks (T039..T042)
  - US3 (Admin): 6 tasks (T033..T038)
  - US4 (Auth): 6 tasks (T027..T032)
  - Setup/Foundation/Polish: 20 tasks (T001..T016, T043..T046)

## Suggested MVP

- Implement Phase 1 + Phase 2 + Phase 3 (User Story 1) only, then validate independently and demo.

---

All tasks follow the required checklist format and include explicit file paths. If you want, I can now scaffold the files for Phase 1 (create Dockerfiles, `.env.sample`, `docker-compose.yml`, basic Maven and Angular skeletons) and implement a minimal booking-service with one passing unit test to validate the pipeline.
