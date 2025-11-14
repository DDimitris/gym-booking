## Deployment notes (concise)

These notes complement the `README` with a slightly more detailed view of environment variables and HTTPS setup.

### Core idea

A single HTTPS-first `docker-compose.yml` orchestrates:
- Postgres
- Keycloak (under `/auth`)
- Spring Boot backend (proxied under `/api`)
- Angular frontend (served by nginx, TLS termination)

### Key environment variables (`.env` at repo root)

Copy `.env.example` → `.env` and adjust:

- `PUBLIC_SCHEME` – should be `https`.
- `PUBLIC_HOST` – hostname (e.g. `localhost`, `dev.example.com`).
- `KEYCLOAK_VERSION` – Keycloak image tag (default `22.0.1`).
- `CERTS_HOST_PATH` – host folder with `fullchain.pem` and `privkey.pem` mounted into nginx.
- `KC_LOG_LEVEL` – Keycloak log level (e.g. `INFO`, `DEBUG`).

On `docker compose up`, a small helper container renders `keycloak/realms/gym-booking-realm.json` from the template using these values and Keycloak imports it on first start.

### Switching hosts / domains

1. Edit `.env` and set `PUBLIC_HOST` and `PUBLIC_SCHEME=https`.
2. For real domains, point `CERTS_HOST_PATH` to your certificate folder (e.g. `/etc/letsencrypt/live/your-domain`).
3. Recreate the stack so Keycloak sees the updated realm:
   ```bash
   docker compose down -v
   docker compose up -d --build
   ```

### Certificates

- Dev: self-signed certs live in `certs/` (ignored by git). Regenerate using scripts in `scripts/`.
- Prod: use a trusted CA (e.g. Let's Encrypt) and reference that folder from `CERTS_HOST_PATH`.

### Quick production checklist

- [ ] `PUBLIC_HOST` set to real domain.
- [ ] `PUBLIC_SCHEME=https`.
- [ ] Valid certs available and `CERTS_HOST_PATH` points to them.
- [ ] Stack recreated (`docker compose down -v && docker compose up -d`).
- [ ] Verify: `https://<host>` loads, and `https://<host>/auth` + `https://<host>/api` respond as expected.

Last updated: 2025-11-14
