# Captcha Backend — run & migrate

Required env vars (see `.env.example`):
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- API_KEY_PEPPER
- ALTCHA_SECRET
- NODE_ENV

Migrations:
- Place SQL files from `backend/migrations` in your migration runner or run manually:
  ```bash
  psql "$DATABASE_URL" -f backend/migrations/20251127_add_sitekey_api_keyhash.sql
