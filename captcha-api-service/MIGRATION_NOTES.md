# MIGRATION_NOTES.md

This file describes how to apply the new migrations and backfill data safely.

## Overview
New migrations added under `backend/migrations/`:
- `0001_create_clients.sql`
- `0002_create_api_keys.sql`
- `0003_create_usage_events.sql`
- `0004_create_refresh_tokens.sql`
- `0005_create_verification_tokens.sql`

These migrations create:
- A multi-tenant `clients` table with api_key_hash column (for legacy lookups)
- A new `api_keys` table for multiple keys per client (recommended)
- Usage and immutable metering table `usage_events`
- `refresh_tokens` table for rotated refresh tokens
- `verification_tokens` table for storing short-lived issued JWT tokens for auditing

## Production migration plan (recommended)
1. **Backup DB**: take a full snapshot/backup of your PostgreSQL database.
2. **Run migrations in a transaction**: If you have a migration runner, apply migrations in order (0001 → 0005).
   - Example:
     ```bash
     psql $DATABASE_URL -f backend/migrations/0001_create_clients.sql
     psql $DATABASE_URL -f backend/migrations/0002_create_api_keys.sql
     psql $DATABASE_URL -f backend/migrations/0003_create_usage_events.sql
     psql $DATABASE_URL -f backend/migrations/0004_create_refresh_tokens.sql
     psql $DATABASE_URL -f backend/migrations/0005_create_verification_tokens.sql
     ```
   - Or use your migration tool (Flyway, Liquibase, Knex, etc).

3. **Backfill existing API keys (if any)**:
   - If you had previously stored raw `clients.api_key` (legacy), rotate them:
     - For each client row with `api_key` present, *do not* re-store raw key. Instead:
       1. Compute hash with server pepper (same method used now).
       2. Insert a new record into `api_keys` with `api_key_hash` set to the hash, name set to 'migrated-legacy', created_at = client.created_at.
       3. Remove (or null) the raw `clients.api_key` column from the live system after verification.
   - Example SQL (run per-client or scripted):
     ```sql
     INSERT INTO api_keys (client_id, name, api_key_hash, created_at)
     VALUES ('<client-id>', 'migrated-legacy', '<computed-hash>', NOW());
     ```
   - You must compute the hash using the same algorithm/environment variable `API_KEY_PEPPER` that will be used in production. If the pepper is not set yet, set it before backfilling.

4. **Rotate keys**:
   - After backfill, rotate keys for clients as needed by creating new keys via the API endpoints (the raw key will be returned once per key).
   - Instruct clients to replace any embedded keys.

5. **Enable tenant middleware and rate limiting**:
   - Deploy code that uses new tenant middleware (tenant resolution by API key hash or JWT).
   - Ensure `API_KEY_PEPPER` is set in environment (secret store) before incoming production traffic.

6. **Monitor**:
   - Watch logs and metrics for authentication failures.
   - If lots of invalid api key errors appear, roll back by re-evaluating the pepper/backfill process.

## Important operational notes
- **API_KEY_PEPPER**: must be set in environment before new keys are created or before looking up migrated legacy keys — otherwise hashing will not match.
- **JWT_SECRET**: must be set for signing verification tokens and admin sessions.
- **Rotate secrets**: When rotating `API_KEY_PEPPER`, you'll need to re-hash all stored keys (or maintain dual-hash strategy). Plan secret rotation carefully.
- **Backfilling**: Use an offline job that reads `clients.api_key` and writes to `api_keys` after computing the hash. Keep raw keys offline and never store them in logs.
- **Zero-downtime**: Migrations here are additive (create new tables) and safe for zero-downtime. If you alter existing columns, ensure compatibility.

## Rollback
- If needed, rollback by restoring DB backup. Do not attempt to reconstruct raw API keys from hashes.

