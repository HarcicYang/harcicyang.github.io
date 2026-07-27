#!/usr/bin/env python3
"""Blog dev server — parses Jekyll templates and serves blog at http://localhost:4000/blog/

Usage:
    python blog_dev.py

Combines: post parsing (front matter + markdown), template rendering, and HTTP serving.
Runs alongside dev.py — use a different port (4000) to avoid conflicts.
"""

import http.server
import mimetypes
import os
import re
import json
import yaml
from datetime import datetime
from html import escape

ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD_DIR = os.path.join(ROOT, "_blog_build")
PORT = 4000

# ---------------------------------------------------------------------------
# 1. Post loading
# ---------------------------------------------------------------------------
def load_posts():
    posts_dir = os.path.join(ROOT, "_posts")
    posts = []
    if not os.path.isdir(posts_dir):
        return posts
    for fname in sorted(os.listdir(posts_dir), reverse=True):
        if not fname.endswith(".md"):
            continue
        path = os.path.join(posts_dir, fname)
        with open(path, encoding="utf-8") as f:
            content = f.read()
        front, body = parse_front_matter(content)
        if front is None:
            continue
        title = front.get("title", "Untitled")
        d = front.get("date")
        if isinstance(d, datetime):
            date = d
        elif isinstance(d, str):
            date = datetime.fromisoformat(d)
        else:
            date = datetime.now()
        tags = front.get("tags", []) or []
        slug = front.get("slug") or slugify(title)
        date_str = date.strftime("%Y-%m-%d")
        url = f"/blog/{date.year}/{date.month:02d}/{date.day:02d}/{slug}/"
        excerpt = strip_html(render_markdown(body))[:200]
        posts.append({
            "title": title,
            "date": date,
            "date_str": date_str,
            "date_display": date.strftime("%Y 年 %m 月 %d 日"),
            "tags": tags,
            "url": url,
            "excerpt": excerpt,
            "body": body,
            "body_html": render_markdown(body),
            "content": render_markdown(body),
        })
    return posts


def parse_front_matter(text):
    text = text.strip()
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None, text
    front_raw = parts[1].strip()
    body = parts[2].strip()
    try:
        front = yaml.safe_load(front_raw) or {}
    except yaml.YAMLError:
        front = {}
    return front, body


def slugify(text):
    return re.sub(r"[^\w\-]+", "-", text.lower()).strip("-")


def strip_html(text):
    return re.sub(r"<[^>]+>", "", text)


def render_markdown(text):
    """Basic markdown to HTML (handles common elements)."""
    # code blocks
    text = re.sub(r"```(\w*)\n(.*?)```", r"<pre><code>\2</code></pre>", text, flags=re.DOTALL)
    # inline code
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    # headers
    text = re.sub(r"^#### (.+)$", r"<h4>\1</h4>", text, flags=re.MULTILINE)
    text = re.sub(r"^### (.+)$", r"<h3>\1</h3>", text, flags=re.MULTILINE)
    text = re.sub(r"^## (.+)$", r"<h2>\1</h2>", text, flags=re.MULTILINE)
    text = re.sub(r"^# (.+)$", r"<h1>\1</h1>", text, flags=re.MULTILINE)
    # bold
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    # italic
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    # links
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)
    # images
    text = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", r'<img src="\2" alt="\1">', text)
    # unordered lists
    text = re.sub(r"^- (.+)$", r"<li>\1</li>", text, flags=re.MULTILINE)
    text = re.sub(r"(<li>.*?</li>\n?)+", r"<ul>\g<0></ul>", text)
    # horizontal rule
    text = re.sub(r"^---+$", r"<hr>", text, flags=re.MULTILINE)
    # blockquote
    text = re.sub(r"^> (.+)$", r"<blockquote>\1</blockquote>", text, flags=re.MULTILINE)
    # paragraphs
    paragraphs = text.split("\n\n")
    out = []
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        if re.match(r"^<(h[1-6]|ul|ol|pre|blockquote|hr|li)", p):
            out.append(p)
        else:
            out.append(f"<p>{p}</p>")
    return "\n".join(out)


# ---------------------------------------------------------------------------
# 2. Template rendering (simple regex-based)
# ---------------------------------------------------------------------------
def render_template(template, **ctx):
    result = template

    # {% raw %}...{% endraw %}
    raw_blocks = {}
    def _save_raw(m):
        key = f"___RAW_{len(raw_blocks)}___"
        raw_blocks[key] = m.group(1)
        return key
    result = re.sub(r"\{%\s*raw\s*%\}(.*?)\{%\s*endraw\s*%\}", _save_raw, result, flags=re.DOTALL)

    # {% include file.html %}
    def _include(m):
        fname = m.group(1).strip()
        inc_path = os.path.join(ROOT, "_includes", fname)
        if os.path.isfile(inc_path):
            with open(inc_path, encoding="utf-8") as f:
                return f.read()
        return ""
    result = re.sub(r"\{%\s*include\s+([\w.]+)\s*%\}", _include, result)

    # {% for post in site.posts %}...{% endfor %}
    posts = ctx.get("posts", [])
    result = render_for_loop(result, "post", "site.posts", posts)
    result = render_for_loop(result, "post", "posts", posts)

    # {% for tag in post.tags %}...{% endfor %}
    result = render_nested_tags(result)

    # {% if site.posts.size == 0 %}...{% endif %}
    result = re.sub(
        r"\{%\s*if\s+site\.posts\.size\s*==\s*0\s*%\}(.*?)\{%\s*endif\s*%\}",
        lambda m: m.group(1) if len(posts) == 0 else "",
        result,
        flags=re.DOTALL,
    )

    # {% if post.tags %}...{% endif %} (inside for loops, already handled in nested tags)
    # Also handle bare: {% if post.tags %}...{% endif %}
    # These are inside for loops, handled when iterating

    # {{ page.title }}, {{ page.date | date: "..." }}
    for key, val in ctx.items():
        if isinstance(val, str):
            result = result.replace(f"{{{{ page.{key} }}}}", val)

    post = ctx.get("post", {})
    if isinstance(post, dict):
        for k, v in post.items():
            if isinstance(v, str):
                result = result.replace(f"{{{{ post.{k} }}}}", v)
            elif isinstance(v, list):
                result = result.replace(f"{{{{ post.{k} }}}}", ", ".join(str(x) for x in v))

    # {{ content }} — rendered post body
    body_html = ctx.get("body_html", "") or ctx.get("content", "")
    if isinstance(body_html, str):
        result = result.replace("{{ content }}", body_html)

    # {{ page.title }} remaining
    page_title = ctx.get("title", ctx.get("page_title", ""))
    result = result.replace("{{ page.title }}", str(page_title))

    # | date: "..." filter
    result = re.sub(r"{{ post\.date \| date: \"([^\"]+)\" }}", r"{{ post.date_str }}", result)

    # | strip_html | truncate: N
    result = re.sub(
        r"{{ post\.excerpt \| strip_html \| truncate: (\d+) }}",
        lambda m: ctx.get("post_excerpt", "")[: int(m.group(1))],
        result,
    )

    # {{ post.excerpt | strip_html | normalize_whitespace | truncate: 200 | jsonify }}
    result = re.sub(
        r"{{ post\.excerpt \| strip_html \| normalize_whitespace \| truncate: \d+ \| jsonify }}",
        lambda m: json.dumps(ctx.get("post_excerpt", "")),
        result,
    )

    # {{ post.title | jsonify }}
    result = re.sub(
        r"{{ post\.title \| jsonify }}",
        lambda m: json.dumps(ctx.get("post_title", "")),
        result,
    )

    # {{ post.url | jsonify }}
    result = re.sub(
        r"{{ post\.url \| jsonify }}",
        lambda m: json.dumps(ctx.get("post_url", "")),
        result,
    )

    # {{ post.date | date: "..." | jsonify }}
    result = re.sub(
        r"{{ post\.date \| date: \"[^\"]+\" \| jsonify }}",
        lambda m: json.dumps(ctx.get("post_date_str", "")),
        result,
    )

    # {{ post.tags | jsonify }}
    result = re.sub(
        r"{{ post\.tags \| jsonify }}",
        lambda m: json.dumps(ctx.get("post_tags", [])),
        result,
    )

    # Restore raw blocks
    for key, val in raw_blocks.items():
        result = result.replace(key, val)

    # Clean up remaining Liquid tags (just in case)
    result = re.sub(r"\{%[^%]*%\}", "", result)
    result = re.sub(r"{{[^}]*}}", "", result)

    return result


def render_for_loop(template, item_var, collection_var, items):
    """Render {% for item in collection %}...{% endfor %} with proper nesting support."""
    # Build regex to find the start tag
    start_pat = r"\{%\s*for\s+" + re.escape(item_var) + r"\s+in\s+" + re.escape(collection_var) + r"\s*%\}"
    m_start = re.search(start_pat, template)
    if not m_start:
        return template

    # Find matching {% endfor %} by counting nesting depth
    pos = m_start.end()
    depth = 1
    while depth > 0 and pos < len(template):
        # Look for next {% for or {% endfor
        nf = re.search(r"\{%\s*for\b", template[pos:])
        ne = re.search(r"\{%\s*endfor\s*%\}", template[pos:])
        if ne is None:
            break
        nf_pos = pos + nf.start() if nf else None
        ne_pos = pos + ne.start()
        if nf_pos is not None and nf_pos < ne_pos:
            depth += 1
            pos = nf_pos + len(nf.group())
        else:
            depth -= 1
            if depth == 0:
                pos = ne_pos + len(ne.group())
            else:
                pos = ne_pos + len(ne.group())

    block = template[m_start.end():pos - len("{% endfor %}")]

    rendered = []
    for i, item in enumerate(items):
        part = block
        for k, v in item.items():
            if isinstance(v, str):
                part = part.replace(f"{{{{ {item_var}.{k} }}}}", v)
            elif isinstance(v, list):
                # Handle nested {% for tag in item.tags %}...{% endfor %}
                tag_start = r"\{%\s*for\s+tag\s+in\s+" + re.escape(item_var) + r"\.tags\s*%\}"
                tag_m = re.search(tag_start, part)
                if tag_m and v:
                    # Find matching {% endfor %}
                    tp = tag_m.end()
                    td = 1
                    while td > 0 and tp < len(part):
                        ntf = re.search(r"\{%\s*for\b", part[tp:])
                        nte = re.search(r"\{%\s*endfor\s*%\}", part[tp:])
                        if nte is None:
                            break
                        ntf_p = tp + ntf.start() if ntf else None
                        nte_p = tp + nte.start()
                        if ntf_p is not None and ntf_p < nte_p:
                            td += 1
                            tp = ntf_p + len(ntf.group())
                        else:
                            td -= 1
                            if td == 0:
                                tp = nte_p + len(nte.group())
                            else:
                                tp = nte_p + len(nte.group())
                    tag_block = part[tag_m.end():tp - len("{% endfor %}")]
                    tag_rendered = []
                    for j, tag in enumerate(v):
                        tp2 = tag_block
                        tp2 = tp2.replace("{{ tag }}", str(tag))
                        tp2 = re.sub(
                            r"\{%\s*unless\s+forloop\.last\s*%\},?\s*\{%\s*endunless\s*%\}",
                            "" if j == len(v) - 1 else ", ",
                            tp2,
                        )
                        tag_rendered.append(tp2)
                    part = part[: tag_m.start()] + "".join(tag_rendered) + part[tp:]

        # Handle date filter
        part = re.sub(
            r"{{ " + re.escape(item_var) + r"\.date \| date: \"[^\"]+\" }}",
            item.get("date_str", ""),
            part,
        )

        # Handle excerpt filter
        part = re.sub(
            r"{{ " + re.escape(item_var) + r"\.excerpt \| strip_html \| truncate: \d+ }}",
            item.get("excerpt", "")[:140],
            part,
        )

        # Handle {% if post.tags %}...{% endif %}
        part = re.sub(
            r"\{%\s*if\s+" + re.escape(item_var) + r"\.tags\s*%\}(.*?)\{%\s*endif\s*%\}",
            lambda m, it=item: m.group(1) if it.get("tags") else "",
            part,
            flags=re.DOTALL,
        )

        # Handle {% if post.excerpt != post.content %}
        part = re.sub(
            r"\{%\s*if\s+" + re.escape(item_var) + r"\.excerpt\s*!=\s*" + re.escape(item_var) + r"\.content\s*%\}(.*?)\{%\s*endif\s*%\}",
            lambda m, it=item: m.group(1) if it.get("excerpt", "") != it.get("body", "") else "",
            part,
            flags=re.DOTALL,
        )

        # Handle {% unless forloop.last %},{% endunless %}
        part = re.sub(
            r"\{%\s*unless\s+forloop\.last\s*%\}(.*?)\{%\s*endunless\s*%\}",
            lambda m, idx=i, total=len(items): m.group(1) if idx < total - 1 else "",
            part,
        )

        rendered.append(part)

    return template[: m_start.start()] + "".join(rendered) + template[pos:]


def render_nested_tags(template):
    """Handle {% for tag in post.tags %} inside already-expanded for loops."""
    pattern = r"\{%\s*for\s+tag\s+in\s+post\.tags\s*%\}(.*?)\{%\s*endfor\s*%\}"
    return re.sub(pattern, "", template, flags=re.DOTALL)


# ---------------------------------------------------------------------------
# 3. Build rendered pages
# ---------------------------------------------------------------------------
def build_blog(posts):
    """Pre-render blog pages into BUILD_DIR."""
    if os.path.exists(BUILD_DIR):
        import shutil
        shutil.rmtree(BUILD_DIR)
    os.makedirs(BUILD_DIR, exist_ok=True)

    # Load blog layout
    layout_path = os.path.join(ROOT, "_layouts", "blog.html")
    with open(layout_path, encoding="utf-8") as f:
        blog_layout = f.read()

    # Render blog homepage → _blog_build/blog/index.html
    rendered = render_template(blog_layout, posts=posts, title="Harcic's Blog")
    blog_out = os.path.join(BUILD_DIR, "blog", "index.html")
    os.makedirs(os.path.dirname(blog_out), exist_ok=True)
    with open(blog_out, "w", encoding="utf-8") as f:
        f.write(rendered)
    print(f"  Rendered blog/index.html ({len(posts)} posts)")

    # Render search.json → _blog_build/blog/search.json
    search_data = []
    for post in posts:
        search_data.append({
            "title": post["title"],
            "url": post["url"],
            "date": post["date_str"],
            "excerpt": post["excerpt"][:200],
            "tags": post["tags"],
        })
    search_json = json.dumps(search_data, ensure_ascii=False, indent=2)
    search_out = os.path.join(BUILD_DIR, "blog", "search.json")
    with open(search_out, "w", encoding="utf-8") as f:
        f.write(search_json)
    print(f"  Rendered blog/search.json")

    # Render each post
    post_layout_path = os.path.join(ROOT, "_layouts", "post.html")
    with open(post_layout_path, encoding="utf-8") as f:
        post_layout = f.read()

    for post in posts:
        part = post["url"].rstrip("/")
        post_dir = os.path.join(BUILD_DIR, part.lstrip("/"))
        os.makedirs(post_dir, exist_ok=True)
        post_page = render_template(
            post_layout,
            posts=posts,
            title=post["title"],
            page_title=post["title"],
            date=post["date_display"],
            tags=post["tags"],
            content=post["content"],
            body_html=post["body_html"],
            post=post,
        )
        with open(os.path.join(post_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(post_page)
        print(f"  Rendered {post['url']}")


# ---------------------------------------------------------------------------
# 4. HTTP server
# ---------------------------------------------------------------------------
class BlogDevHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def guess_type(self, path):
        ext = os.path.splitext(path)[1]
        overrides = {
            ".webp": "image/webp",
            ".m4a": "audio/mp4",
            ".lrc": "text/plain",
            ".srs": "application/octet-stream",
            ".webmanifest": "application/manifest+json",
        }
        return overrides.get(ext) or mimetypes.guess_type(path)[0] or "application/octet-stream"

    def do_GET(self):
        import urllib.parse
        path = self.path.split("?")[0].split("#")[0]
        path = urllib.parse.unquote(path)
        clean = path.lstrip("/").rstrip("/")

        # Blog pages: try build dir first, then source
        build_path = os.path.join(BUILD_DIR, clean) if clean else BUILD_DIR
        if os.path.isfile(build_path):
            self.directory = BUILD_DIR
            self.path = "/" + clean
            return super().do_GET()
        if os.path.isdir(build_path):
            if not path.endswith("/"):
                self.send_response(301)
                self.send_header("Location", path + "/")
                self.end_headers()
                return
            idx = os.path.join(build_path, "index.html")
            if os.path.isfile(idx):
                self.directory = BUILD_DIR
                self.path = "/" + clean + "/index.html"
                return super().do_GET()

        # Fall back to ROOT for other files
        self.directory = ROOT

        # Directory → index.html
        local = os.path.join(ROOT, clean)
        if os.path.isdir(local):
            if not path.endswith("/"):
                self.send_response(301)
                self.send_header("Location", path + "/")
                self.end_headers()
                return
            index = os.path.join(local, "index.html")
            if os.path.isfile(index):
                self.path = "/" + clean + "/index.html"

        return super().do_GET()

    def log_message(self, format, *args):
        print(f"  [{self.command}] {args[0]}", flush=True)


# ---------------------------------------------------------------------------
# 5. Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    os.chdir(ROOT)
    print("Loading posts...")
    posts = load_posts()
    print(f"  Found {len(posts)} post(s)")

    print("Building blog pages...")
    build_blog(posts)
    print()

    addr = ("0.0.0.0", PORT)
    server = http.server.HTTPServer(addr, BlogDevHandler)
    print(f"Blog dev server: http://localhost:{PORT}/blog/", flush=True)
    print("Press Ctrl+C to stop\n", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.", flush=True)
        server.server_close()
