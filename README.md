# Gym Booking System

Production-ready class scheduling and booking system built with Spring Boot (Java 21), Angular, PostgreSQL and Keycloak, fully Dockerized for local dev and deployment.

> This project is co-developed by Dimitris and an AI programming assistant through iterative pairing sessions.

## Architecture (high level)

- **Backend**: Spring Boot service (JWT resource server, Flyway DB migrations) talking to PostgreSQL.
- **Frontend**: Angular SPA served by nginx, talking to the backend via `/api`.
- **Auth**: Keycloak, reverse-proxied under `/auth` on the same HTTPS origin.
- **Infra**: Single `docker-compose.yml` orchestrates Postgres, Keycloak, backend, and frontend behind HTTPS.

### Billing & admin workflows

- **Billing events & settlement types**
   - Same-day or late cancellations can generate billing events for athletes.
   - Each billing event carries a **settlement type**:
      - `NONE` – pending/unsettled.
      - `PAYMENT` – settled by normal payment.
      - `BONUS` – settled by consuming a bonus day from the athlete.
   - The backend exposes admin endpoints to:
      - List per-athlete and global billing reports.
      - Settle individual events explicitly as payment or bonus.
      - Perform bulk "mark selected as paid" operations as payments.

- **Admin billing UI**
   - Admins can see, per athlete:
      - Outstanding charges and historical billing events.
      - The **class name** and **instructor** associated with each charge.
      - Current settlement state (Unassigned, Payment, Bonus day).
   - From the billing screen, admins can:
      - Mark one or more events as paid.
      - Settle a single event using a bonus day (when the athlete has bonus days available).
      - Get a quick view of remaining bonus days.

- **Bonus days**
   - Bonus days act as pre-paid class credits.
   - When an admin settles a billing event as `BONUS`, the athlete's bonus day count is decremented and the event is marked as settled.

### Class scheduling & editing

- Classes are stored with `startTime` and `endTime` timestamps.
- Capacity is enforced per class instance; bookings respect maximum capacity.
- Admins and instructors can create and edit classes via a dialog that includes:
   - Class metadata (name, description, duration, trainer, capacity).
   - A **date picker** for the class date.
   - A separate time input for the start time.
- On save, the UI combines the selected date and start time and computes an `endTime` based on the duration, ensuring that editing a class does not reset its date/time.

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