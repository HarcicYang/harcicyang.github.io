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

## Neony docs (`/neony/`)

VitePress-built bilingual documentation site for the Neony framework, at `/neony/` (English, root locale) and `/neony/zh/` (Chinese).

```bash
cd neony-src && pnpm install && pnpm dev   # VitePress dev server (default :5173)
python3 scripts/sync_neony_docs.py --source ../Neony   # regenerate sources from local Neony
rm -rf neony && pnpm build                 # build output into repo-root neony/
```

- `neony-src/` — VitePress source: `en` docs live at the source root (root locale), `zh/` for Chinese. Sources are **generated** by `scripts/sync_neony_docs.py` from the Neony repo `docs/` — never edit generated `.md` files directly; edit Neony and re-sync.
- `neony/` — committed build output (VitePress `outDir`, base `/neony/`), served as-is by GitHub Pages.
- `neony-src/versions.json` — current + recent commit list, drives the "version" nav dropdown (history links to GitHub).
- `_config.yml` excludes `neony-src` (Jekyll must not render the sources).

Gotchas:
- Sync is manual: GitHub Actions workflow `Sync Neony Docs` (`workflow_dispatch`, ref input) fetches the Neony tarball, regenerates sources, rebuilds, and commits `neony/` + `neony-src/`. Local builds need `rm -rf neony` first (VitePress won't empty an outDir outside its root).
- The site theme (`localStorage['theme']`) is synced into VitePress via `neony-src/.vitepress/theme/index.ts`.

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
- `Gemfile` — local blog dependencies (Jekyll + `jekyll-commonmark-ghpages`; run `bundle install` before `bundle exec`)
- `blog/index.html` — entrypoint with `layout: blog` front matter
- `blog/search.json` — Liquid-generated search index consumed by client-side JS
- `admin/` — Decap CMS admin panel (needs GitHub OAuth proxy at `https://decap-server.vercel.app`)
- `resource/blog-renderer.js` — post-page enhancements (collapsible auto TOC + GFM alerts + Mermaid)

Rendering notes:
- `_config.yml` uses `CommonMarkGhPages` with `autolink`; bare URLs are auto-linked at build time.
- Use `<details markdown="1">` so content inside `<details>` is rendered as Markdown and the closing tag is respected.
- `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, and `> [!CAUTION]` are converted by `resource/blog-renderer.js`.
- ` ```mermaid ` code fences are rendered client-side by `resource/blog-renderer.js` (CDN-loaded Mermaid).
- `resource/blog-renderer.js` builds the `#post-toc` outline from `.post-body` headings with stable ids; clicking a TOC link opens ancestor `<details>` blocks before jumping. The TOC sidebar is collapsible: desktop uses an in-panel collapse control plus a fixed reopen button, while mobile uses a fixed `.toc-toggle` button and a left drawer that defaults to collapsed.

Gotchas:
- `dev.py` serves raw files (no Liquid processing) — use `jekyll serve` for blog
- Three `jvav/` files contain `{% raw %}...{% endraw %}` wrappers to prevent Jekyll parsing `{{` in legacy scripts
- Decap CMS OAuth needs a proxy (`admin/config.yml` → `backend.base_url`)

## Deployment

Push to `main` → GitHub Pages auto-deploys (runs Jekyll build). No CI, no checks.
