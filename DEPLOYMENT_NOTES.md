## Deployment Notes

These notes explain how to run and deploy the gym-booking stack (Angular frontend, Spring Boot backend, Keycloak) over HTTPS-only, how to switch hosts/domains, manage certificates, and keep secrets out of git history.

### 1. Overview
Services (frontend, backend, Keycloak, Postgres) are orchestrated via a single HTTPS-first `docker-compose.yml`. The frontend nginx serves the SPA and reverse-proxies `/api` (backend) and `/auth` (Keycloak) on the same origin to eliminate CORS issues. Port 80 redirects to 443.

### 2. Environment Variables (.env)
Copy `.env.example` to `.env` at the repository root.

Key variables (all read by docker compose):
- `PUBLIC_SCHEME` – Should be `https` (stack is HTTPS-first)
- `PUBLIC_HOST` – Hostname (e.g. `localhost`, `dev.example.com`)
- `KEYCLOAK_VERSION` – Keycloak container tag (default 22.0.1)
- `CERTS_HOST_PATH` – Host path that contains `fullchain.pem` and `privkey.pem` mounted into nginx
- `KC_LOG_LEVEL` – Keycloak log level (e.g., DEBUG)

Changing these and recreating the stack (down + up) re-renders `keycloak/realms/gym-booking-realm.json` from `gym-booking-realm.template.json` via the realm prep service.

### 3. Switching Between IP, localhost, and Domain
1. Edit `.env` with desired `PUBLIC_HOST` and `PUBLIC_SCHEME=https`.
2. If using a real domain, set `CERTS_HOST_PATH` to the folder that contains `fullchain.pem` and `privkey.pem` (e.g., `/etc/letsencrypt/live/your-domain/`). For local dev keep the default `./certs`.
3. Run a full recreate so Keycloak imports the new realm with updated redirect URIs:
   - `docker compose down -v`
   - `docker compose up -d --build`

### 4. Certificates
Self-signed dev certs live in `certs/` (ignored by git). Regenerate with provided scripts (see `scripts/`). For real domains use certificates from a trusted CA (e.g. Let's Encrypt) and set `CERTS_HOST_PATH` accordingly.

Recommended permissions: restrict `privkey.pem` to owner read only.

### 5. HTTPS Stack
The default `docker-compose.yml` uses TLS termination at the frontend.
Key points:
- Port 80 redirects to 443.
- HSTS enabled (adjust max-age if needed).
- `/auth` proxied preserving prefix; Keycloak served at `/auth`.
- SPA Content Security Policy applied only to application routes; excluded from Keycloak sub-paths.

### 6. Keycloak Realm Templating
The template file: `keycloak/realms/gym-booking-realm.template.json` contains `${PUBLIC_HOST}` and `${PUBLIC_SCHEME}` placeholders.
Startup prep service runs `envsubst` to produce `gym-booking-realm.json` consumed by Keycloak import.
To force re-import after variable changes: remove Keycloak volume (compose down with `-v`).

### 7. Redirect & Logout URIs
Client redirect URIs and post-logout URIs must match exactly (including trailing slash). Our realm template uses a wildcard `https://<host>/*` to simplify. If you still see a logout 400, capture the failing `redirect_uri` from Keycloak logs and adjust the realm template.

### 8. Backend Token Validation
Backend expects issuer `.../auth/realms/gym-booking`. Ensure the compose and nginx keep `/auth` prefix. When switching domain or scheme, the issuer changes accordingly; restart backend after realm change.

### 9. Generating Self-Signed Certificates (Dev Only)
Use one of the scripts under `scripts/`:
- Bash: `scripts/generate-self-signed-cert.sh`
- PowerShell: `scripts/generate-self-signed-cert.ps1`

Both overwrite existing `certs/fullchain.pem` and `certs/privkey.pem`.

### 10. Purging Sensitive Files From Git History
Current branch excludes certs via `.gitignore`. If certs were previously committed, history was (or should be) rewritten to remove blobs and force-pushed.
Procedure (summary):
1. Backup: `git branch backup/pre-history-purge`.
2. Rewrite (example using filter-branch):
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch certs/fullchain.pem certs/privkey.pem' --prune-empty --tag-name-filter cat -- --all
   ```
3. Garbage collect & verify: `git reflog expire --expire=now --all && git gc --prune=now --aggressive`.
4. Force push each affected branch: `git push origin <branch> --force`.

All collaborators must re-clone or hard reset their local branches after this rewrite.

### 11. Operational Checklist (Prod)
- [ ] Set `PUBLIC_HOST` to real domain.
- [ ] Set `PUBLIC_SCHEME=https`.
- [ ] Place valid certs in `certs/`.
- [ ] Recreate stack (`down -v` then `up -d`).
- [ ] Verify OIDC discovery: `curl -k https://<host>/auth/realms/gym-booking/.well-known/openid-configuration`.
- [ ] Test login & logout flows.
- [ ] Confirm backend protected endpoints with a valid access token.

### 12. Troubleshooting Quick Reference
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| 404 on login assets | Wrong Keycloak base path | Ensure `/auth` prefix in nginx and frontend config |
| invalid_redirect_uri (login/logout) | Missing or mismatched URI (trailing slash) | Update realm template, enforce slash |
| 401 on `/api` even with token | Issuer mismatch | Check `application.properties` issuer & JWKS, restart backend |
| CSP errors in Keycloak pages | SPA CSP leaking into `/auth` | Ensure nginx excludes CSP headers for `/auth` block |
| Keycloak startup error about hostname | Both `KC_HOSTNAME` & `KC_HOSTNAME_URL` set | Remove `KC_HOSTNAME`, keep `KC_HOSTNAME_URL` |

### 13. Next Improvements (Optional)
- Automate realm updates via admin REST instead of import on every start.
- Add script to rotate self-signed cert monthly.
- Introduce health check endpoint aggregation in frontend for diagnostics page.

---
Last updated: 2025-11-13
