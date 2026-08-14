#!/usr/bin/env python3
"""Sync Neony docs into this site's VitePress source (neony-src/).

Usage:
  # From GitHub (used by the sync workflow):
  python3 scripts/sync_neony_docs.py --ref master

  # From a local Neony checkout (for local preview):
  python3 scripts/sync_neony_docs.py --source ../Neony

What it does:
  1. Obtain the Neony docs/ tree (GitHub tarball or a local checkout).
  2. Rewrite markdown links:
       - intra-docs links        -> in-site routes (/zh/..., /...)
       - repo-root links         -> GitHub blob URLs
       - the language-switch
         blockquote at the top   -> removed (replaced by the built-in
                                    language dropdown)
     Fenced code blocks are skipped while rewriting.
  3. Generate bilingual VitePress sources under neony-src/{en,zh}/.
  4. Write neony-src/versions.json (current + recent commit history),
     consumed by .vitepress/config.mts for the version dropdown.

Only the Python standard library is used, so it runs on any CI runner
without installing anything.
"""

import argparse
import json
import os
import posixpath
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import urllib.request
from datetime import datetime

REPO = "HarcicYang/Neony"
GITHUB_BLOB = "https://github.com/HarcicYang/Neony/blob/{ref}/{path}"
UA = {"User-Agent": "harcicyang.github.io-sync-neony-docs"}

# docs 内需要路由的页面映射：源文件（相对 docs/，含语言后缀）-> 生成文件名
# （相对 neony-src/，root 语言在源根，zh 在 zh/ 下；不含语言后缀）。
# 不在列表中的 .md（如旧合并入口 api.en.md / api.zh.md）不生成页面，
# 但文档内指向它们的链接会被映射到 api/index。
PAGE_MAP = {
    "README": "index",  # -> home 落地页（见 HOME_TEMPLATES），不使用 README 正文
    "getting-started": "getting-started",
    "guides/installation-platforms": "guides/installation-platforms",
    "api/README": "api/index",
    "api/core": "api/core",
    "api/components": "api/components",
    "api/layout-chrome": "api/layout-chrome",
    "api/dom-css": "api/dom-css",
    "api/reactive": "api/reactive",
    "api/platform-i18n": "api/platform-i18n",
}

# 主页：VitePress home 布局，文案提炼自 Neony 仓库根 README。
HOME_TEMPLATES = {
    "en": """---
layout: home

hero:
  name: Neony
  text: Reactive desktop UI in pure Python
  tagline: Compose desktop interfaces from Python objects — components, layouts, styles — rendered in a native window and diff-updated automatically. No HTML, no JavaScript. (pre-beta)
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/HarcicYang/Neony

features:
  - title: Pure Python API
    details: Components, layouts and events are plain Python objects — application code never writes HTML or JavaScript.
  - title: Fine-grained reactivity
    details: Signal / Computed / Effect primitives with declarative bindings; dirty-subtree diffing updates only what changed.
  - title: Same stack as Tauri
    details: Rust tao/wry WebViews via LumiView; custom window chrome, transparency and native window effects.
  - title: Bilingual docs
    details: Complete documentation in English and 中文, with built-in search and version history.
---
""",
    "zh": """---
layout: home

hero:
  name: Neony
  text: 纯 Python 的响应式桌面 UI 框架
  tagline: 用 Python 对象——组件、布局、样式——拼装界面，在原生窗口中渲染，DOM 自动增量更新。无需编写 HTML 或 JavaScript。(pre-beta)
  actions:
    - theme: brand
      text: 入门教程
      link: /zh/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/HarcicYang/Neony

features:
  - title: 纯 Python API
    details: 组件、布局、事件全部由 Python 对象构成，应用代码不必编写 HTML 或 JavaScript。
  - title: 细粒度响应式
    details: Signal / Computed / Effect 原语与声明式绑定；脏子树 diff 只更新变化的元素。
  - title: 与 Tauri 同源
    details: 经 LumiView 使用 Rust tao/wry WebView；自定义窗口装饰、透明窗口与原生窗口效果。
  - title: 双语文档
    details: 中英文完整文档，内置搜索与版本历史。
---
""",
}


def log(msg):
    print(msg, flush=True)


def http_json(url, token=None):
    req = urllib.request.Request(url, headers=UA)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_tarball(ref, token=None):
    """Download the Neony tarball for `ref` and return the extracted root dir."""
    url = f"https://codeload.github.com/{REPO}/tar.gz/{ref}"
    log(f"Downloading {url}")
    req = urllib.request.Request(url, headers=UA)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    tmp = tempfile.mkdtemp(prefix="neony-sync-")
    tarpath = os.path.join(tmp, "neony.tar.gz")
    with urllib.request.urlopen(req, timeout=300) as resp, open(tarpath, "wb") as fh:
        shutil.copyfileobj(resp, fh)
    with tarfile.open(tarpath, "r:gz") as tf:
        tf.extractall(tmp)
    os.unlink(tarpath)
    # locate the single top-level directory (Neony-<ref>)
    for entry in os.listdir(tmp):
        full = os.path.join(tmp, entry)
        if os.path.isdir(full):
            return full
    raise RuntimeError("tarball did not contain a top-level directory")


def github_commit_info(ref, token=None):
    data = http_json(f"https://api.github.com/repos/{REPO}/commits/{ref}", token)
    return {
        "sha": data["sha"],
        "date": data["commit"]["author"]["date"][:10],
        "message": data["commit"]["message"].splitlines()[0],
    }


def github_docs_history(token=None, limit=10):
    data = http_json(
        f"https://api.github.com/repos/{REPO}/commits?path=docs&per_page={limit}",
        token,
    )
    out = []
    for item in data:
        out.append({
            "sha": item["sha"],
            "date": item["commit"]["author"]["date"][:10],
            "message": item["commit"]["message"].splitlines()[0],
        })
    return out


def github_tags(token=None, limit=20):
    """Neony release tags, newest first (sorted by tag date)."""
    data = http_json(
        f"https://api.github.com/repos/{REPO}/tags?per_page={limit}", token,
    )
    tags = []
    for item in data:
        sha = item["commit"]["sha"]
        try:
            info = http_json(f"https://api.github.com/repos/{REPO}/commits/{sha}", token)
            date = info["commit"]["author"]["date"][:10]
        except Exception:
            date = ""
        tags.append({"name": item["name"], "sha": sha, "short": sha[:7], "date": date})
    tags.sort(key=lambda t: t["date"], reverse=True)
    return tags


def git(args, cwd):
    return subprocess.run(
        ["git", "-C", cwd, *args],
        capture_output=True, text=True, check=True,
    ).stdout.strip()


def local_commit_info(source):
    sha = git(["rev-parse", "HEAD"], source)
    date = git(["log", "-1", "--format=%cI"], source)[:10]
    message = git(["log", "-1", "--format=%s"], source)
    return {"sha": sha, "date": date, "message": message}


def local_docs_history(source, limit=10):
    lines = git(["log", f"-{limit}", "--format=%H|%cI|%s", "--", "docs"], source)
    out = []
    for line in lines.splitlines():
        sha, date, message = line.split("|", 2)
        out.append({"sha": sha, "date": date[:10], "message": message})
    return out


def local_tags(source, limit=20):
    """Neony release tags, newest first (creatordate)."""
    lines = git(
        ["for-each-ref", "refs/tags", f"--count={limit}", "--sort=-creatordate",
         "--format=%(refname:short)|%(objectname:short)|%(*objectname:short)|%(creatordate:short)"],
        source,
    )
    tags = []
    for line in lines.splitlines():
        name, obj, peeled, date = line.split("|", 3)
        if not name:
            continue
        sha = peeled or obj
        tags.append({"name": name, "sha": sha, "short": sha[:7], "date": date[:10]})
    return tags


def clip(msg, n=44):
    return msg if len(msg) <= n else msg[: n - 1] + "…"


# ---------------------------------------------------------------------------
# Link rewriting
# ---------------------------------------------------------------------------

LANG_SUFFIX = re.compile(r"\.(en|zh)\.md$")


def map_link(target, cur_dir, ref):
    """Map one markdown link target to a site route / GitHub URL / as-is."""
    if target.startswith(("http://", "https://", "mailto:", "#", "/")):
        return target

    path_part, _, anchor = target.partition("#")
    if not path_part:
        return target
    resolved = posixpath.normpath(posixpath.join(cur_dir, path_part))

    # intra-docs link -> in-site route
    if resolved.startswith("docs/"):
        rel = resolved[len("docs/"):]
        m = LANG_SUFFIX.search(rel)
        if m:
            lang = m.group(1)
            stem = rel[: m.start()]
            # legacy merged entry api.en.md / api.zh.md -> API index page
            if stem == "api":
                stem = "api/index"
            elif stem.split("/")[-1] == "README":
                stem = stem[:-len("README")] + "index"
            route = "/zh/" if lang == "zh" else "/"
            if stem.split("/")[-1] == "index":
                route += stem[: -len("index")]
            else:
                route += stem
            return route + (f"#{anchor}" if anchor else "")

    # anything else (repo-root files: ../demo_hello.py, ../CHANGELOG.md, ...)
    # -> GitHub blob URL
    return GITHUB_BLOB.format(ref=ref, path=resolved) + (f"#{anchor}" if anchor else "")


def rewrite_links(text, cur_dir, ref):
    """Rewrite markdown links, skipping fenced code blocks."""
    out = []
    in_fence = False
    for line in text.split("\n"):
        stripped = line.lstrip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            out.append(line)
            continue
        if in_fence:
            out.append(line)
            continue
        out.append(re.sub(
            r"\[([^\]]*)\]\(([^)\s]+)\)",
            lambda m: f"[{m.group(1)}]({map_link(m.group(2), cur_dir, ref)})",
            line,
        ))
    return "\n".join(out)


def strip_header_lang_links(text):
    """Remove the language-switch blockquote near the top of each doc.

    e.g. `> [English version](getting-started.en.md) · [文档首页](README.zh.md)`
    The built-in VitePress language dropdown replaces it.
    """
    lines = text.split("\n")
    for i in range(min(5, len(lines))):
        if lines[i].startswith(">"):
            j = i
            while j < len(lines) and lines[j].startswith(">"):
                j += 1
            block = lines[i:j]
            if any(re.search(r"\]\([^)]*\.(?:en|zh)\.md\)", ln) for ln in block):
                return "\n".join(lines[:i] + lines[j:]).lstrip("\n")
            break
    return text


def process_doc(src_path, stem, lang, ref, cur_dir):
    """Read a doc, rewrite it, and return (out_rel_path, content)."""
    if stem == "README":
        return "index.md", HOME_TEMPLATES[lang]
    with open(src_path, encoding="utf-8") as fh:
        text = fh.read()
    text = strip_header_lang_links(text)
    text = rewrite_links(text, cur_dir, ref)
    out_rel = PAGE_MAP.get(stem)
    if out_rel is None:
        return None, None
    return out_rel + ".md", text


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Sync Neony docs -> neony-src/")
    ap.add_argument("--source", help="local Neony checkout path (default: fetch from GitHub)")
    ap.add_argument("--ref", default="master", help="GitHub ref to sync (default: master)")
    ap.add_argument("--out", default="neony-src", help="VitePress source dir (default: neony-src)")
    ap.add_argument("--repo-root", default=None,
                    help="override repo-root for link mapping (default: derived from source)")
    ap.add_argument("--history-limit", type=int, default=10)
    ap.add_argument("--token", default=os.environ.get("GITHUB_TOKEN"), help="GitHub token (optional)")
    args = ap.parse_args()

    out_dir = os.path.abspath(args.out)
    tmp_root = None

    if args.source:
        repo_root = os.path.abspath(args.source)
        docs_dir = os.path.join(repo_root, "docs")
        if not os.path.isdir(docs_dir):
            sys.exit(f"error: no docs/ directory under {repo_root}")
        current = local_commit_info(repo_root)
        history = local_docs_history(repo_root, args.history_limit)
        tags = local_tags(repo_root)
        log(f"Local source: {repo_root} @ {current['sha'][:7]}")
    else:
        ref = args.ref
        tmp_root = fetch_tarball(ref, args.token)
        repo_root = tmp_root
        docs_dir = os.path.join(repo_root, "docs")
        current = github_commit_info(ref, args.token)
        history = github_docs_history(args.token, args.history_limit)
        tags = github_tags(args.token)
        log(f"GitHub source: {REPO}@{ref} -> {current['sha'][:7]}")

    # collect docs: dict lang -> {stem: (abs path, rel path from repo root)}
    docs = {"en": {}, "zh": {}}
    for name in sorted(os.listdir(docs_dir)):
        m = LANG_SUFFIX.search(name)
        if not m or not name.endswith(".md"):
            continue
        lang = m.group(1)
        stem = name[: m.start()]
        rel = f"docs/{name}"
        docs[lang][stem] = (os.path.join(docs_dir, name), rel)
    # subdirectories (api/, guides/)
    for sub in ("api", "guides"):
        subdir = os.path.join(docs_dir, sub)
        if not os.path.isdir(subdir):
            continue
        for name in sorted(os.listdir(subdir)):
            m = LANG_SUFFIX.search(name)
            if not m or not name.endswith(".md"):
                continue
            lang = m.group(1)
            stem = f"{sub}/{name[: m.start()]}"
            rel = f"docs/{sub}/{name}"
            docs[lang][stem] = (os.path.join(subdir, name), rel)

    # rewrite + write
    # VitePress i18n layout: the root locale (en) lives at the source root,
    # other locales (zh) live under a per-locale subdirectory.
    generated = set()
    rewrote = 0
    for lang in ("en", "zh"):
        lang_dir = out_dir if lang == "en" else os.path.join(out_dir, lang)
        for stem, (src_path, rel_path) in docs[lang].items():
            out_rel, content = process_doc(
                src_path, stem, lang, current["sha"][:7],
                posixpath.dirname(rel_path),
            )
            if out_rel is None:
                log(f"  skip (no page): {stem}.{lang}.md")
                continue
            dest = os.path.join(lang_dir, out_rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "w", encoding="utf-8") as fh:
                fh.write(content)
            generated.add(out_rel)
            rewrote += 1
            log(f"  {lang}/{out_rel}  <- docs/{stem}.{lang}.md")

        # drop stale generated files (never touch .vitepress/, zh/, node_modules/)
        skip = {".vitepress", "zh", "node_modules"} if lang == "en" else set()
        for root, dirs, files in os.walk(lang_dir):
            dirs[:] = [d for d in dirs if d not in skip]
            for name in files:
                if not name.endswith(".md"):
                    continue
                rel = os.path.relpath(os.path.join(root, name), lang_dir).replace(os.sep, "/")
                if rel not in generated:
                    os.unlink(os.path.join(root, name))
                    log(f"  removed stale: {lang}/{rel}")

    # versions.json
    current_short = current["sha"][:7]
    history = [h for h in history if h["sha"] != current["sha"]]
    versions = {
        "current": {
            "sha": current["sha"],
            "short": current_short,
            "ref": args.ref if not args.source else None,
            "date": current["date"],
            "message": clip(current["message"]),
        },
        "tags": tags,
        "history": [
            {"sha": h["sha"], "short": h["sha"][:7],
             "date": h["date"], "message": clip(h["message"])}
            for h in history[: args.history_limit - 1]
        ],
    }
    vpath = os.path.join(out_dir, "versions.json")
    with open(vpath, "w", encoding="utf-8") as fh:
        json.dump(versions, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    log(f"versions.json: current {current_short} @ {current['date']}, "
        f"{len(tags)} tags, {len(versions['history'])} history entries")

    if tmp_root:
        shutil.rmtree(tmp_root, ignore_errors=True)

    log(f"done: {rewrote} pages written under {out_dir}/{{en,zh}}")


if __name__ == "__main__":
    main()
