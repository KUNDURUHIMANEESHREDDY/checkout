# LensStories — Full-stack editorial platform

LensStories is a cinematic brand storytelling site built with Next.js App Router, React, TypeScript, Tailwind CSS v4, Prisma, PostgreSQL, Supabase, Zod, and Lucide.

## Stack
- **Next.js + React + TypeScript:** server-rendered pages, static story routes, metadata, and typed UI
- **Tailwind CSS v4:** styling foundation with custom editorial design tokens
- **Prisma + PostgreSQL:** relational editorial schema and migrations
- **Supabase:** planned authentication and object storage integration
- **Zod:** runtime validation for editorial inputs
- **GitHub Actions:** Node 22 CI for typecheck, lint, and production build

## Run locally
Requires Node.js 20.9+ (Node 22 LTS recommended).

```bash
cd lensstories
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The public pages use typed sample content and can render without Supabase credentials.

## Database setup
Configure `DATABASE_URL` and `DIRECT_URL` for PostgreSQL, then run:

```bash
npm run db:generate
npm run db:push
```

The Prisma schema models users and editorial roles, categories, stories with draft/review/scheduled/published/archived states, tags, and media assets.

## Production readiness
The public home and story detail routes are server-rendered, and the Studio foundation is included. Supabase is scaffolded but not connected to a provisioned project. Authentication enforcement, live publishing CRUD, storage upload policies, rate limits, audit logs, and end-to-end tests still need implementation and verification before treating this as a production CMS. Replace the sample media email and editorial copy before launch. Never expose the Supabase service-role key to the browser.
