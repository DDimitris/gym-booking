# Gym Booking System

A modern, full-stack application for managing gym classes, schedules, and bookings. Built with Spring Boot, Angular, and Keycloak for authentication.

Note on collaboration: This project is a cooperative work between the repository owner (Dimitris) and an AI programming assistant (GitHub Copilot). Many design decisions, refactors, and implementations were developed interactively.

## Features

- 🔐 Secure authentication and authorization with Keycloak
- 👥 User role management (Admin, Trainer, Member)
- 📅 Class scheduling and management
- 📋 Class booking system
- 📊 Real-time availability tracking
- 🎨 Modern, responsive UI with Angular Material
 - 🧰 Fully Dockerized local stack (Postgres, Keycloak, Backend, Frontend)
 - 🔁 Flyway-managed schema and seed data
 - 🛡️ Token-to-role normalization with legacy role support during transition

## Tech Stack

### Backend
- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL
- Flyway for database migrations
- Maven
 - Optional: Spring Boot Actuator (health) and Lombok (planned for refactor branch)

### Frontend
- Angular (Latest)
- Angular Material
- RxJS
- TypeScript
- date-fns
 - Modern theme with light/dark mode toggle

### Infrastructure
- Docker & Docker Compose
- Keycloak
- Nginx
- PostgreSQL

## Prerequisites

- Docker and Docker Compose
- Java 21 (for local development)
- Node.js 20+ (for local development)
- Maven (for local development)

## Quick Start (HTTPS-only)

### Running with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gym-booking.git
   cd gym-booking
   ```

2. Start the application using Docker Compose (HTTPS):
   ```bash
   docker compose up -d
   ```

3. Access the applications:
   - Frontend: https://localhost (HTTP redirects to HTTPS)
   - Keycloak Admin Console: https://localhost/auth/admin (realm import auto-applied)
   - Backend API via proxy: https://localhost/api
   - Direct backend (container-mapped): http://localhost:8080
   - Swagger UI (direct backend): http://localhost:8080/swagger-ui.html

### Local Development Setup (optional)

1. Start PostgreSQL and Keycloak using Docker Compose:
   ```bash
   docker compose up -d postgres keycloak
   ```

2. Configure the backend:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

3. Configure the frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Initial Configuration

### Keycloak Setup

1. Access Keycloak Admin Console at https://localhost/auth/admin
2. Login with:
   - Username: admin
   - Password: admin
3. A realm export is imported automatically on first Keycloak start from `keycloak/realms`. If configuring manually:
4. Create client: 'gym-booking-client'
5. Configure client:
   - Access Type: public
   - Valid Redirect URIs: https://localhost/*
   - Web Origins: https://localhost

### Roles
The canonical application roles are:
   - ADMIN
   - TRAINER
   - MEMBER

For backward compatibility, legacy roles INSTRUCTOR → TRAINER and ATHLETE → MEMBER are normalized by the backend security layer.

### Create Test Users
1. Create users and assign roles for testing
2. Default password for test accounts: 'password'
3. You can also promote a MEMBER to TRAINER from the Admin area in the UI.

## Project Structure

```
gym-booking/
├── backend/                 # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/      # Java source files
│   │   │   └── resources/ # Application properties and migrations
│   │   └── test/          # Test files
│   ├── Dockerfile
│   └── pom.xml
├── frontend/               # Angular application
│   ├── src/
│   │   ├── app/          # Application source
│   │   ├── assets/       # Static assets
│   │   └── environments/ # Environment configurations
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml     # Docker composition
```

## API Documentation

The API documentation is available through Swagger UI at http://localhost:8080/swagger-ui.html when running the backend (direct container mapping). Via the HTTPS proxy, use the API routes under https://localhost/api.

## Available Endpoints

### Classes
- GET /api/classes - List all gym classes
- POST /api/classes - Create a new class (Admin/Trainer)
- PUT /api/classes/{id} - Update a class (Admin/Trainer)
- DELETE /api/classes/{id} - Delete a class (Admin)

### Class Types
- GET /api/class-types - List all class types
- GET /api/class-types/active - List active class types
- POST /api/class-types - Create (Admin/Trainer)
- PUT /api/class-types/{id} - Update (Admin/Trainer)
- DELETE /api/class-types/{id} - Delete (Admin/Trainer; blocked if referenced)

### Bookings
- GET /api/bookings - List user's bookings
- POST /api/bookings - Create a booking
- DELETE /api/bookings/{id} - Cancel a booking

## Security
# Gym Booking System

Full-stack class scheduling and booking, powered by Spring Boot (Java 21), Angular, PostgreSQL, and Keycloak—fully Dockerized with CI/CD and production-ready profiles.

Note: This project is built collaboratively by Dimitris and an AI programming assistant. Many refinements (role model, migrations, CI/CD, metrics, Docker, and UI polish) were implemented iteratively.

## What’s inside

- Authentication/authorization via Keycloak; roles: ADMIN, TRAINER, MEMBER (legacy INSTRUCTOR/ATHLETE normalized)
- Booking, schedule, and class management with a modern Angular UI
- Docker Compose stacks: dev build, images, and production
- DB migrations with Flyway (dev-only seeds isolated from prod)
- Observability: Spring Boot Actuator + Micrometer Prometheus metrics, JSON logs
- CI/CD: tests, coverage, build and push images to GHCR, Trivy vulnerability scan
- Hardened containers (non-root users), nginx security headers, static asset caching

## Project structure

```
backend/     # Spring Boot service (Actuator, JWT security)
frontend/    # Angular app served by nginx
keycloak/    # Dev realm import (not used in prod compose)
docker-compose.yml            # Dev: builds from source (profile=dev)
docker-compose.images.yml     # Runs published images (latest)
docker-compose.prod.yml       # Prod-like: pinned tags, profile=prod
```

## Running locally

Prereqs: Docker Desktop. For local development outside Docker, you’ll also need Java 21 and Node 20, but Docker is recommended.

### Dev stack (build from source, with dev seeds)

```powershell
# from repo root
docker compose up -d
```

Endpoints:
- Frontend: https://localhost
- Backend (direct): http://localhost:8080
- Keycloak Admin: https://localhost/auth/admin
- Health (direct): http://localhost:8080/actuator/health

### Run from images (latest)

```powershell
docker compose -f docker-compose.images.yml up -d
```

### Prod-like stack (pinned tags, no dev seeds, extra hardening)

```powershell
# use a GH Actions run number (e.g., 123) as IMAGE_TAG
$env:IMAGE_TAG="123"; docker compose -f docker-compose.prod.yml up -d
```

Notes:
- In prod compose, Keycloak realm is not auto-imported; configure it once and persist in its DB.
- Backend runs `SPRING_PROFILES_ACTIVE=prod` in prod compose; dev compose uses `dev`.

## Profiles and data seeding

- dev profile:
   - Flyway locations: `db/migration` + `db/dev-data/high` (V1000+ dev seeds only)
   - Seeds trainer/member users and sample classes.

- prod profile:
   - Flyway location: `db/migration` only
   - No seed data, just schema and reference types.

Flyway versioning: dev-only seeds are at very high versions (V1000+) to avoid conflicts with main migrations.

## Metrics and logs

- Actuator endpoints (prod and dev):
   - `/actuator/health` – health status
   - `/actuator/metrics` – list of meter names
   - `/actuator/prometheus` – Prometheus-format metrics (enabled in prod profile too)

- What you get out-of-the-box:
   - JVM metrics: memory, GC pauses, threads
   - HTTP server metrics: request counts and timings (by method/status/route)
   - Hikari datasource metrics: connection pool
   - Process/system metrics: CPU, uptime

- How to view locally:
   - From host (if backend is mapped to 8080):
      - http://localhost:8080/actuator/metrics
      - http://localhost:8080/actuator/prometheus
   - From inside container:
      - `docker exec gym-booking-backend curl -s http://localhost:8080/actuator/prometheus`

- Prometheus/Grafana (optional):
   - Add a Prometheus job scraping `backend:8080/actuator/prometheus`.
   - Import a standard Spring Boot dashboard in Grafana (JVM + HTTP panels).

- Logging:
   - Prod profile prints JSON logs to stdout for easy ingestion (ELK/Loki/Datadog).

## Security headers (frontend)

`frontend/nginx-https.conf` includes:
- Content-Security-Policy (tighten for your domain if hosting under HTTPS)
- HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Aggressive static asset caching, no-cache for `index.html`

## CI/CD pipeline

Workflow `.github/workflows/ci-cd.yml`:
- Tests: Maven backend tests (Jacoco coverage), Angular tests (headless Chrome) + typecheck
- Build: Docker Buildx; push to GHCR with incremental tags (`run_number` and `run_number-shortSHA`)
- Latest tags only on master via imagetools
- Security: Trivy image scan (non-blocking; can be made gating)

Artifacts: Jacoco HTML report and frontend coverage are uploaded for quick inspection.

## API documentation

Swagger UI (if enabled) at http://localhost:8080/swagger-ui.html.

## Common endpoints

- Classes
   - GET /api/classes – list
   - POST /api/classes – create (Admin/Trainer)
   - PUT /api/classes/{id} – update (Admin/Trainer)
   - DELETE /api/classes/{id} – delete (Admin)

- Class types
   - GET /api/class-types – list
   - GET /api/class-types/active – list active
   - POST /api/class-types – create (Admin/Trainer)
   - PUT /api/class-types/{id} – update (Admin/Trainer)
   - DELETE /api/class-types/{id} – delete (guarded if referenced)

- Bookings
   - GET /api/bookings – user’s bookings
   - POST /api/bookings – create booking
   - DELETE /api/bookings/{id} – cancel booking

## Security

- JWT-based auth via Keycloak (resource server)
- Role normalization (INSTRUCTOR→TRAINER, ATHLETE→MEMBER)
- CORS handled by backend and nginx; set CSP for your domain in production
- Containers run as non-root

## Development quick commands

Backend:
```powershell
cd backend; ./mvnw test
```

Frontend:
```powershell
cd frontend; npm test
```

## Deployment

Use `docker-compose.images.yml` for quick runs, and `docker-compose.prod.yml` with pinned tags for production.

## Environment variables

Backend:
- `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
- `SPRING_PROFILES_ACTIVE`
- `OAUTH2_JWKS_URI`

Frontend:
- `API_URL`, `KEYCLOAK_URL`

Compose-level (.env at repo root):
- `PUBLIC_SCHEME`, `PUBLIC_HOST` (realm URLs and proxy base)
- `KEYCLOAK_VERSION` (Keycloak image tag)
- `CERTS_HOST_PATH` (host path to TLS certs mounted into nginx)
- `KC_LOG_LEVEL` (Keycloak log verbosity)

## License

MIT. See `LICENSE`.

---

Built with ❤️ by Dimitris & Copilot