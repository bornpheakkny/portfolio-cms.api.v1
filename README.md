# portfolio-cms.api.v1

REST API for my portfolio. Serves public content to [portfolio.tech.v1](https://github.com/bornpheakkny/portfolio.tech.v1) and powers the admin [cms.v1](https://github.com/bornpheakkny/cms.v1).

**Stack:** Express 5 · Prisma 7 · Neon Postgres · Cloudinary · zod · JWT — deployed on **Render**.

## Run locally
```bash
pnpm install
cp .env.example .env            # Neon URLs, Cloudinary keys, secrets, admin login
pnpm db:deploy                  # create tables
pnpm db:seed                    # admin user + starter content
pnpm dev                        # http://localhost:4000
```
Schema change: edit `prisma/schema.prisma` → `pnpm db:migrate --name what-changed` → commit the migration.

## Deploy to Render
New → **Blueprint** → this repo (uses `render.yaml`). Or a Web Service with:
- Build: `corepack enable && pnpm install --frozen-lockfile && pnpm build && pnpm db:deploy`
- Start: `pnpm start` · Health check: `/health`
- Env: everything in `.env.example`, plus `NODE_ENV=production`
  - `CORS_ORIGINS=https://<portfolio>.vercel.app,https://<cms>.vercel.app`
  - `PORTFOLIO_REVALIDATE_URL=https://<portfolio>.vercel.app/api/revalidate`

After the first deploy run `pnpm db:seed` once from the Render **Shell**.

**Neon:** use the *pooled* string (host has `-pooler`) for `DATABASE_URL` and the *direct* one for `DIRECT_URL`.

## Endpoints (`/api/v1`)
- **Public:** `GET /portfolio` (everything in one call), `/profile`, `/skills`, `/projects`, `/projects/:slug`, `/experience`, `/education` · `POST /contact` (5/hour per IP)
- **Auth:** `POST /auth/login`, `/auth/refresh` (httpOnly cookie), `/auth/logout`, `/auth/logout-all` · `GET /auth/me`
- **Admin (Bearer):** `GET|PUT /admin/profile` · CRUD + `PATCH /reorder` on `/admin/skills|projects|experience|education` · `/admin/media` (`POST /sign` for Cloudinary) · `/admin/messages`

Every content change pings the portfolio's revalidate URL so the site updates in seconds.
