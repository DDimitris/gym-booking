# Quickstart — Run locally with Docker Compose (draft)

This quickstart shows a minimal local development flow using Docker Compose. It assumes Docker and Docker Compose are installed.

1. Copy `.env.sample` to `.env` and fill required secrets (local dev values are acceptable for testing).

2. Build images (from project root):

```powershell
docker compose build
```

3. Start the stack:

```powershell
docker compose up --build
```

4. Access services:
- Keycloak: http://localhost:8080 (or configured port)
- Frontend: http://localhost:4200 (or served by frontend container)
- API: http://localhost:8081/api (example backend port)

5. Run unit tests for backend (example with Maven):

```powershell
cd services/booking-service
mvn -DskipTests=false test
```

Notes:
- Flyway migrations will run as part of the backend startup or as a dedicated migration job configured in `docker-compose.yml`.
- Admin account should be pre-seeded per deployment docs (see `deploy/README.md` once added).
