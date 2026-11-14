/* Small compatibility layer for static pages and client-rendered apps. */
(function () {
    "use strict";

    var queued = false;
    var fadeQueued = false;
    var appliedMode = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    var iconByLabel = {
        "+": "plus",
        "✎": "write",
        "✕": "close",
        "×": "close",
        "◀": "back",
        "▶": "arrow",
        "➤": "arrow"
    };

    function mountThemeIcon(button) {
        if (!button || button.querySelector('hc-icon[name="theme"]')) return;
        button.classList.add("ic-host");
        var icon = document.createElement("hc-icon");
        icon.setAttribute("name", "theme");
        button.appendChild(icon);
    }

    function replaceTextIcon(button) {
        if (!button || button.querySelector("hc-icon")) return;
        var label = button.textContent.trim();
        var name = iconByLabel[label];
        if (!name) return;
        button.textContent = "";
        if (!button.getAttribute("aria-label")) {
            button.setAttribute("aria-label", button.getAttribute("title") || label);
        }
        button.classList.add("ic-host");
        var icon = document.createElement("hc-icon");
        icon.setAttribute("name", name);
        button.appendChild(icon);
    }

    function decorate() {
        queued = false;

        document.querySelectorAll("#themeToggle").forEach(mountThemeIcon);
        document.querySelectorAll("button").forEach(function (button) {
            var label = button.textContent.trim();
            if (label === "☾" || label === "☀") {
                button.textContent = "";
                button.setAttribute("aria-label", "切换主题");
                mountThemeIcon(button);
                return;
            }
            replaceTextIcon(button);
        });
        document.querySelectorAll("hc-icon").forEach(function (icon) {
            if (icon.parentElement) icon.parentElement.classList.add("ic-host");
        });
    }

    function queueDecorate() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(decorate);
    }

    function updateFade(element) {
        var extraX = element.scrollWidth - element.clientWidth;
        var extraY = element.scrollHeight - element.clientHeight;
        var fadeX = extraX > 2;
        var fadeY = extraY > 2;
        element.classList.toggle("is-fade-x", fadeX);
        element.classList.toggle("is-fade-y", fadeY);
        if (fadeX) {
            element.style.setProperty("--hc-fade-left", element.scrollLeft > 2 ? "18px" : "0px");
            element.style.setProperty("--hc-fade-right", element.scrollLeft < extraX - 2 ? "18px" : "0px");
        }
        if (fadeY) {
            element.style.setProperty("--hc-fade-top", element.scrollTop > 2 ? "18px" : "0px");
            element.style.setProperty("--hc-fade-bottom", element.scrollTop < extraY - 2 ? "18px" : "0px");
        }
    }

    function refreshFadeTargets() {
        fadeQueued = false;
        var targets = document.querySelectorAll([
            "[data-scroll-fade]",
            ".page-scroll",
            ".hub-rail",
            ".hub-stage",
            ".module-track",
            ".post-toc",
            ".playlist",
            ".lyrics-content",
            ".main-container",
            ".pin-container",
            ".chat-messages",
            ".sidebar",
            ".settings-panel",
            ".post-body pre",
            ".config-code"
        ].join(","));
        targets.forEach(function (element) {
            var style = getComputedStyle(element);
            var canX = /(auto|scroll|overlay)/.test(style.overflowX);
            var canY = /(auto|scroll|overlay)/.test(style.overflowY);
            var scrollable = (canX && element.scrollWidth > element.clientWidth + 2) ||
                (canY && element.scrollHeight > element.clientHeight + 2);
            element.classList.toggle("hc-scroll-fade", scrollable);
            if (scrollable) updateFade(element);
        });
    }

    function queueFadeScan() {
        if (fadeQueued) return;
        fadeQueued = true;
        requestAnimationFrame(refreshFadeTargets);
    }

    function syncMode() {
        var mode = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
        if (mode === appliedMode) return;
        appliedMode = mode;
        try { localStorage.setItem("theme", mode); } catch (error) { /* storage is optional */ }
        if (window.RcitratColor) window.RcitratColor.applyMode(mode);
    }

    document.addEventListener("click", function (event) {
        var host = event.target.closest &&
            event.target.closest(".app-tab, [role='tab'], [role='radio'], .playlist-item, .post-card, .gallery-item");
        if (!host) return;
        host.classList.remove("ic-go");
        void host.offsetWidth;
        host.classList.add("ic-go");
    });
    document.addEventListener("scroll", function (event) {
        if (event.target && event.target.classList && event.target.classList.contains("hc-scroll-fade")) {
            updateFade(event.target);
        }
    }, { capture: true, passive: true });
    window.addEventListener("resize", queueFadeScan, { passive: true });

    decorate();
    refreshFadeTargets();
    new MutationObserver(function () {
        syncMode();
        queueDecorate();
        queueFadeScan();
    }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
        childList: true,
        subtree: true
    });
})();
