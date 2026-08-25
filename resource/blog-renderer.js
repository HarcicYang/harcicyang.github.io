/* Blog post enhancements: auto TOC + GFM alerts + Mermaid. Loaded only on post pages. */
(function () {
    "use strict";

    var postBody = document.querySelector(".post-body");
    if (!postBody) return;

    var ALERT_LABELS = {
        note: "备注",
        tip: "提示",
        important: "重要",
        warning: "警告",
        caution: "注意"
    };
    var ALERT_RE = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;
    var MERMAID_CDN = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

    function stripAlertMarker(paragraph) {
        var walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
        var textNodes = [];
        var node;
        while ((node = walker.nextNode())) textNodes.push(node);

        var active = true;
        textNodes.forEach(function (textNode) {
            if (!active) return;
            textNode.data = textNode.data.replace(ALERT_RE, function () {
                active = false;
                return "";
            });
        });
    }

    function buildTableOfContents() {
        var toc = document.getElementById("post-toc");
        var tocToggle = document.getElementById("tocToggle");
        var headings = Array.prototype.slice.call(
            postBody.querySelectorAll("h1, h2, h3, h4, h5, h6")
        ).filter(function (heading) {
            return heading.textContent.trim();
        });
        if (!toc || !headings.length) {
            if (tocToggle) tocToggle.hidden = true;
            return;
        }

        var usedIds = {};
        headings.forEach(function (heading, index) {
            var id = heading.id;
            if (!id || usedIds[id] || document.getElementById(id) !== heading) {
                id = "post-heading-" + (index + 1);
                var suffix = 2;
                while (usedIds[id] || document.getElementById(id)) {
                    id = "post-heading-" + (index + 1) + "-" + suffix;
                    suffix += 1;
                }
                heading.id = id;
            }
            usedIds[id] = true;
        });

        toc.innerHTML = "";
        var title = document.createElement("div");
        title.className = "post-toc-title";
        title.textContent = "目录";

        var list = document.createElement("ul");
        list.className = "post-toc-list";

        headings.forEach(function (heading) {
            var item = document.createElement("li");
            var link = document.createElement("a");
            var level = parseInt(heading.tagName.charAt(1), 10) || 2;

            link.href = "#" + heading.id;
            link.textContent = heading.textContent.trim();
            link.addEventListener("click", function () {
                var details = heading.closest("details");
                while (details) {
                    details.open = true;
                    details = details.parentElement
                        ? details.parentElement.closest("details")
                        : null;
                }
            });

            item.className = "post-toc-item post-toc-h" + level;
            item.appendChild(link);
            list.appendChild(item);
        });

        if (!tocToggle) return;
        tocToggle.hidden = false;

        var closeButton = document.createElement("button");
        closeButton.className = "toc-close";
        closeButton.type = "button";
        closeButton.setAttribute("aria-label", "收起目录");
        closeButton.setAttribute("aria-controls", "post-toc");
        closeButton.setAttribute("aria-expanded", "false");
        closeButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>';

        var head = document.createElement("div");
        head.className = "post-toc-head";
        head.appendChild(title);
        head.appendChild(closeButton);
        toc.appendChild(head);
        toc.appendChild(list);

        var mobileQuery = window.matchMedia("(max-width: 1080px)");
        var expanded = false;

        function setExpanded(open) {
            expanded = open;
            if (open) {
                toc.classList.remove("is-collapsed");
                toc.classList.add("is-open");
            } else {
                toc.classList.remove("is-open");
                toc.classList.add("is-collapsed");
            }
            var aria = open ? "true" : "false";
            tocToggle.setAttribute("aria-expanded", aria);
            closeButton.setAttribute("aria-expanded", aria);
        }

        function syncTocState() {
            setExpanded(!mobileQuery.matches);
        }

        tocToggle.addEventListener("click", function () {
            setExpanded(!expanded);
        });
        closeButton.addEventListener("click", function () {
            setExpanded(false);
        });

        list.addEventListener("click", function (event) {
            var target = event.target;
            if (!target || target.tagName !== "A" || !mobileQuery.matches || !expanded) return;
            setExpanded(false);
        });

        syncTocState();
        mobileQuery.addEventListener("change", syncTocState);
    }

    function enhanceAlerts() {
        var quotes = Array.prototype.slice.call(postBody.querySelectorAll("blockquote"));
        quotes.forEach(function (quote) {
            var firstParagraph = quote.querySelector("p");
            if (!firstParagraph) return;
            var match = firstParagraph.textContent.match(ALERT_RE);
            if (!match) return;

            var key = match[1].toLowerCase();
            var alert = document.createElement("div");
            alert.className = "markdown-alert markdown-alert-" + key;

            var title = document.createElement("div");
            title.className = "markdown-alert-title";
            title.textContent = ALERT_LABELS[key] || match[1];
            alert.appendChild(title);

            stripAlertMarker(firstParagraph);
            if (!firstParagraph.textContent.trim()) firstParagraph.remove();

            while (quote.firstChild) alert.appendChild(quote.firstChild);
            quote.replaceWith(alert);
        });
    }

    function prepareMermaidBlocks() {
        var nodes = Array.prototype.slice.call(
            postBody.querySelectorAll('pre[lang="mermaid"], pre > code.language-mermaid')
        );

        nodes.forEach(function (node) {
            var pre = node.tagName === "PRE" ? node : node.parentElement;
            if (!pre || pre.dataset.mermaidBlock === "true") return;
            pre.dataset.mermaidBlock = "true";

            var code = pre.querySelector("code") || pre;
            var source = code.textContent.trim();
            var holder = document.createElement("div");
            holder.className = "mermaid";
            holder.dataset.source = source;
            holder.textContent = source;
            pre.replaceWith(holder);
        });
    }

    function mermaidTheme() {
        return document.documentElement.getAttribute("data-theme") === "light" ? "default" : "dark";
    }

    function renderMermaid() {
        var blocks = Array.prototype.slice.call(
            document.querySelectorAll(".post-body .mermaid")
        );
        var pending = blocks.filter(function (block) {
            return block.dataset.rendered !== "error";
        });
        if (!pending.length) return;

        return import(MERMAID_CDN).then(function (module) {
            var mermaid = module.default;
            mermaid.initialize({
                startOnLoad: false,
                theme: mermaidTheme(),
                securityLevel: "loose"
            });

            return Promise.all(pending.map(function (block) {
                var source = block.dataset.source || block.textContent;
                var id = "mermaid-" + Math.random().toString(36).slice(2);
                return mermaid.render(id, source).then(function (result) {
                    block.innerHTML = result.svg;
                    block.dataset.rendered = "ok";
                }).catch(function (err) {
                    block.classList.add("mermaid-error");
                    block.textContent = "Mermaid 渲染失败：" + (err && err.message ? err.message : err);
                    block.dataset.rendered = "error";
                });
            }));
        }).catch(function (err) {
            pending.forEach(function (block) {
                block.classList.add("mermaid-error");
                block.textContent = "Mermaid 加载失败：" + (err && err.message ? err.message : err);
                block.dataset.rendered = "error";
            });
        });
    }

    function refreshMermaid() {
        var blocks = Array.prototype.slice.call(
            document.querySelectorAll(".post-body .mermaid")
        );
        blocks.forEach(function (block) {
            block.classList.remove("mermaid-error");
            block.dataset.rendered = "";
            block.textContent = block.dataset.source || "";
        });
        return renderMermaid();
    }

    enhanceAlerts();
    buildTableOfContents();
    prepareMermaidBlocks();
    renderMermaid();

    var themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            setTimeout(refreshMermaid, 0);
        });
    }
})();
