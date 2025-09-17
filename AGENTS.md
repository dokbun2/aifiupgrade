# Repository Guidelines

## Project Structure & Module Organization
- `server.js` is the Express entry point exposing `/api/v1` endpoints and serving the `admin/` dashboard build.
- Business logic lives in route modules under `routes/` (auth, users, products, orders, stats) and per-request helpers in `middleware/`.
- Persistence utilities are centralized in `models/database.js`, which bootstraps the SQLite schema stored in `database/admin.db`.
- Static admin UI lives in `admin/`; shared styles and media sit under `assets/`, `css/`, and `gallery/`.
- Database provisioning scripts live in `scripts/` (`init-database.js`, `seed-data.js`); run them before hitting protected routes.

## Build, Test, and Development Commands
- `npm install` — install API dependencies; rerun after editing `package.json`.
- `npm run dev` — start the backend with Nodemon for rapid iteration.
- `npm start` — launch the production-style server entry point.
- `npm run init-db` — create tables and seed the default administrator from `.env` values.
- `npm run seed` — populate demo catalog and metrics once tables exist.

## Coding Style & Naming Conventions
- Use modern JavaScript (Node 18 target) and prefer async/await over promise chains.
- Follow two-space indentation, `camelCase` for symbols, and `PascalCase` for React-like components in `admin/`.
- Keep `express-validator` chains beside route handlers and share helpers from `middleware/`; return JSON with `success`/`error` keys.

## Testing Guidelines
- Adopt Jest with Supertest for API coverage; store specs in `tests/` mirroring `routes/` (e.g., `tests/routes/auth.test.js`).
- Name files `.test.js`, keep descriptions imperative, and seed the SQLite test DB (`DB_PATH=./database/test.db`) before suites.
- Replace the placeholder `npm test` script with Jest and aim for ≥80% statement coverage on new modules.

## Commit & Pull Request Guidelines
- Start commit subjects with an imperative scope (`auth: enforce password policy`) and avoid numeric-only messages.
- Reference issue IDs in the body (`Refs #123`) and note behavioral changes plus required migrations.
- Pull requests must outline purpose, testing evidence, UI screenshots for `admin/` tweaks, and call out any `npm run init-db` steps; request backend review for auth, schema, or middleware changes.
