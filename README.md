# [blan19.com](https://www.blan19.com)

A Markdown Blog built with Next.js, Tailwind and Vercel. Designed, built, and maintained by [@blan19](https://github.com/blan19)

### Primarily Built with:

[next.js](https://github.com/vercel/next.js)  
[tailwind](https://github.com/tailwind)  
[react-markdown](https://github.com/remarkjs/react-markdown)  
[prisma](https://github.com/prisma/prisma)  
[vercel](https://github.com/vercel)

---

### Environment Variables

Create an `.env` file for local environment variables. These are the variables the code reads (on Vercel they come from the Postgres integration).

```
//.env
POSTGRES_URL=""               # when empty, view counts display as 0 (increments and home lists still use POSTGRES_PRISMA_URL)
POSTGRES_PRISMA_URL=""        # runtime connection (pooled)
POSTGRES_URL_NON_POOLING=""   # Prisma CLI (db push on Vercel)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=""
```

> **Note:** there is no separate development database. If `.env` points at the production database, `npm run dev` / `npm start` read and write production data (every `/tech/<slug>` visit increments its view count). Use `npm run dev:safe` for local work. With the database blocked, pages that query it (`/`, `/tech`, `/tech/<slug>`) switch to the error screen after loading; to preview posts, run `node scripts/with-blocked-db.mjs --preview next dev` (view counts show as 0).

### Install Dependencies

```bash
npm install
```

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | `prisma generate` + `next dev` using the database in `.env` |
| `npm run dev:safe` | Dev server with all database URLs overridden to an unreachable address |
| `npm run build` | `prisma generate` + `next build` (no schema changes, but reads the database URLs in `.env`; `npm run verify` builds with the database blocked) |
| `npm run vercel-build` | `prisma generate` + `prisma db push` + `next build`. Vercel runs this instead of `build` (unless a Build Command override is set in the project settings); do not run it locally |
| `npm run verify` | Full check with the database blocked: generate, typecheck, lint, content check, build, smoke |
| `npm run typecheck` | `prisma generate` + `tsc --noEmit` |
| `npm run lint` | `eslint .` |
| `npm run content:check` | Validate `contents/**/*.mdx` structure and frontmatter |
| `npm run smoke` | Serve the existing `.next` build with the database blocked and request the main routes |

CI (`.github/workflows/ci.yml`) runs the same checks on pull requests and pushes to `main`.

Rules for AI coding agents (Claude Code) live in `CLAUDE.md` and `.claude/`.

### Writing a Post

Add `contents/<tech|log>/<YYYY-MM-DD>/<slug>.mdx` (one `.mdx` per date folder; the file name is the URL slug) with `publishedAt` (quoted), `title`, `tags`, `description` and `reference` frontmatter, then run `npm run content:check`.

---

## Inspiration:

[amirardalan](https://github.com/amirardalan/amirardalan.com)

[leerob](https://github.com/leerob/leerob.io)
