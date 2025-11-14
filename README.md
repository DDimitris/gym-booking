# Gym Booking System

Production-ready class scheduling and booking system built with Spring Boot (Java 21), Angular, PostgreSQL and Keycloak, fully Dockerized for local dev and deployment.

> This project is co-developed by Dimitris and an AI programming assistant through iterative pairing sessions.

## Architecture (high level)

- **Backend**: Spring Boot service (JWT resource server, Flyway DB migrations) talking to PostgreSQL.
- **Frontend**: Angular SPA served by nginx, talking to the backend via `/api`.
- **Auth**: Keycloak, reverse-proxied under `/auth` on the same HTTPS origin.
- **Infra**: Single `docker-compose.yml` orchestrates Postgres, Keycloak, backend, and frontend behind HTTPS.

## Usage

### Run the full stack with Docker (recommended)

1. Copy `.env.example` → `.env` and adjust at least:
   - `PUBLIC_HOST` (default `localhost`)
   - `PUBLIC_SCHEME` (keep `https`)
2. From the repo root:

   ```powershell
   docker compose up -d
   ```

3. Open:
   - Frontend: `https://localhost`
   - API (via proxy): `https://localhost/api`
   - Keycloak admin: `https://localhost/auth/admin`

### Local development (optional)

You can also run backend and frontend outside Docker for day‑to‑day development:

```powershell
# Backend
cd backend
./mvnw spring-boot:run

# Frontend (in a second terminal)
cd frontend
npm install
npm start
```

The Docker setup is the source of truth for env wiring; keep `.env` in sync with your local dev configs.

## Deployment (summary)

- Use the same `docker-compose.yml` on a server where the repo is cloned (e.g. `/home/dimitris/gym-booking`).
- Provide a production `.env` with:
  - `PUBLIC_HOST` set to your domain (e.g. `gym.example.com`).
  - `PUBLIC_SCHEME=https`.
  - `CERTS_HOST_PATH` pointing to a folder containing `fullchain.pem` and `privkey.pem` for nginx.
- On the server:

  ```bash
  cd /home/dimitris/gym-booking
  docker compose pull
  docker compose up -d
  ```

CI builds and pushes images to GHCR; the compose file can be driven by an `IMAGE_TAG` env var to select which build to deploy.

## Branching & CI

- Use feature branches (e.g. `feature/...`) and open pull requests into `master`.
- Avoid pushing directly to `master`; let GitHub run the CI workflow on your PR and merge only when green.

## License

This project is licensed under the MIT License. See `LICENSE`.