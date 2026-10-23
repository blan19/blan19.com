# [blan19.xyz](https://www.blan19.xyz)

A personal Korean tech blog. Designed, built, and maintained by [@blan19](https://github.com/blan19).

Posts live in `contents/` as Markdown files and are rendered with the Next.js App Router. Postgres stores only per-post view counts.

### Stack

- [Next.js](https://github.com/vercel/next.js) 16 (App Router, Cache Components) and React 19
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) 4
- [unified](https://github.com/unifiedjs/unified) (remark / rehype), [Shiki](https://github.com/shikijs/shiki) for code highlighting, [mermaid](https://github.com/mermaid-js/mermaid) for diagrams
- [Prisma](https://github.com/prisma/prisma) 7 with Postgres (Neon) for view counts
- Deployed on [Vercel](https://vercel.com) (branch push → Preview, `main` → Production)

### Requirements

- Node.js 24 and npm 11

### Quick Start

```bash
npm ci
npm run dev:safe   # dev server with every database URL blocked
```

Open http://localhost:3000. With the database blocked, view counts and the home "most read" list are left out; the rest of each page renders normally. To preview posts without any database errors in the log, run `node scripts/with-blocked-db.mjs --preview next dev` instead.

> **Warning:** there is no separate development database. If `.env` points at the production database, `npm run dev`, `npm start` and `npm run build` read it, and every `/tech/<slug>` visit on a server started that way increments the production view count. Use `npm run dev:safe` and `npm run verify` for local work. Never run `npm run vercel-build` or `prisma db push` / `migrate` locally.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev:safe` | `prisma generate` + `next dev` with all database URLs overridden to an unreachable address |
| `npm run verify` | Full check with the database blocked: prisma generate, typecheck, lint, content check (`--strict`), tests, build, smoke. CI runs exactly this |
| `npm test` | Hook tests (`test:hooks`) and content validator tests (`test:content`) |
| `npm run typecheck` | `prisma generate` + `tsc --noEmit` |
| `npm run lint` | `eslint .` |
| `npm run content:check` | Validate `contents/` structure, frontmatter and post bodies (`--strict` turns `TODO:` into an error) |
| `npm run smoke` | Serve the existing `.next` build with the database blocked and request the main routes |
| `npm run dev` / `npm start` | `next dev` / `next start` using the database in `.env` (production) |
| `npm run build` | `prisma generate` + `next build`. No schema changes, but reads `.env`; `npm run verify` builds with the database blocked |
| `npm run vercel-build` | `prisma generate` + `prisma db push` + `next build`. Vercel runs this; do not run it locally |

CI (`.github/workflows/ci.yml`) runs `npm run verify` on pull requests and pushes to `main`.

### Environment Variables

The code reads these (on Vercel they come from the Postgres integration). Create a local `.env` only if you need them.

```
POSTGRES_URL=""                     # when empty, the app skips the database entirely (no view counts, no "most read")
POSTGRES_PRISMA_URL=""              # runtime connection (pooled)
POSTGRES_URL_NON_POOLING=""         # Prisma CLI (db push on Vercel)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=""  # optional; when empty, Google Analytics is not loaded
```

### Writing a Post

Add `contents/<tech|log>/<YYYY-MM-DD>/<slug>.mdx`: one file per date folder, and the file name is the URL slug and the view-count key, so it never changes after publishing. The files use the `.mdx` extension but are plain Markdown (GFM), not MDX: JSX and raw HTML are shown as text. Frontmatter is YAML with `publishedAt` (quoted `"YYYY-MM-DD"`), `title`, `tags`, `description` and `reference`. Then run `npm run content:check`.

`log` posts are plain paragraphs shown on `/log` without Markdown rendering.

### Documentation

- [`docs/intent.md`](docs/intent.md): why things are built the way they are
- [`docs/architecture.md`](docs/architecture.md): modules, data flow and rendering
- [`docs/design.md`](docs/design.md): design tokens, type scale, layout and components

Rules for AI coding agents (Claude Code) live in `CLAUDE.md` and `.claude/`.

---

## Inspiration

[amirardalan](https://github.com/amirardalan/amirardalan.com)

[leerob](https://github.com/leerob/leerob.io)
