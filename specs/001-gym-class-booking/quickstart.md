# Quickstart — Run locally with Docker Compose (draft)

This quickstart shows a minimal local development flow using Docker Compose. It assumes Docker and Docker Compose are installed.

1. Copy `.env.example` to `.env` and fill required values (local dev defaults are provided for testing).

2. Build images (from project root):

```powershell
docker compose build
```

3. Start the stack:

```powershell
docker compose up --build
```

4. Access services (when using the Docker stack):
- Frontend: https://localhost
- Keycloak Admin: https://localhost/auth/admin
- API (via nginx proxy): https://localhost/api

5. Run unit tests for backend (example with Maven):

```powershell
cd services/booking-service
mvn -DskipTests=false test
```

Notes:
- Flyway migrations will run as part of the backend startup or as a dedicated migration job configured in `docker-compose.yml`.
- Admin account should be pre-seeded per deployment docs (see `deploy/README.md` once added).
