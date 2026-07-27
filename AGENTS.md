# AGENTS.md

## Project

Static GitHub Pages site deployed to `harcic.is-a.dev` (CNAME). No build step, no framework — raw HTML/CSS/JS served as-is.

## Dev server

```bash
python dev.py   # serves at http://localhost:8080, simulates GitHub Pages directory redirects
```

A Python venv exists at `.venv/`.

## Architecture

- `resource/theme.css` — current unified theme (CSS custom properties). Prefer this over `resource/style.css`.
- `resource/style.css` — older stylesheet with overlapping variables; some pages may still reference it.
- `resource/theme.js` — shared theme toggle script.
- Subdirectories (`chat/`, `musics/`, `search/`, `imgs/`, `schools/`, `jvav/`, `hyper-bot/`) are self-contained sub-pages, each with their own `index.html`.

## Blog (`/blog/`)

Jekyll-powered blog with Decap CMS and giscus comments. GitHub Pages auto-builds Jekyll from the repo root.

```bash
bundle exec jekyll serve   # blog dev server at http://localhost:4000/blog/
```

Key files:
- `_config.yml` — Jekyll config (permalinks, defaults, excludes)
- `_posts/` — blog posts (markdown with YAML front matter)
- `_layouts/blog.html` — blog homepage layout (intro card + post list + search)
- `_layouts/post.html` — single post layout (content + giscus)
- `_includes/comments.html` — giscus script (configure repo + category IDs)
- `blog/index.html` — entrypoint with `layout: blog` front matter
- `blog/search.json` — Liquid-generated search index consumed by client-side JS
- `admin/` — Decap CMS admin panel (needs GitHub OAuth proxy at `https://decap-server.vercel.app`)

Gotchas:
- `dev.py` serves raw files (no Liquid processing) — use `jekyll serve` for blog
- Three `jvav/` files contain `{% raw %}...{% endraw %}` wrappers to prevent Jekyll parsing `{{` in legacy scripts
- Decap CMS OAuth needs a proxy (`admin/config.yml` → `backend.base_url`)

## Deployment

Push to `main` → GitHub Pages auto-deploys (runs Jekyll build). No CI, no checks.
