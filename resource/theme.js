/* Shared: background-seeded tonal theme, theme toggle, loader and toast. */
(function() {
    var html = document.documentElement;
    var style = html.style;
    var assetBase = (window.RCITRAT_ASSET_BASE || "").replace(/\/$/, "");

    /* --- apply accent colors from array [r, g, b] --- */
    var applyAccent = function(r, g, b) {
        style.setProperty("--accent-r", r);
        style.setProperty("--accent-g", g);
        style.setProperty("--accent-b", b);
        /* hover / lighter variant */
        style.setProperty("--accent-r2", Math.min(255, r + 30));
        style.setProperty("--accent-g2", Math.min(255, g + 30));
        style.setProperty("--accent-b2", Math.min(255, b + 30));
        /* logo sub-color (more saturated) */
        style.setProperty("--logo-sub-r", Math.min(255, r + (r > 128 ? -20 : 30)));
        style.setProperty("--logo-sub-g", Math.min(255, g + (g > 128 ? -20 : 30)));
        style.setProperty("--logo-sub-b", Math.min(255, b + (b > 128 ? -20 : 30)));
    };
    var accentDark = [25, 73, 133];
    var accentLight = [18, 61, 112];
    var applyAccentFromTheme = function() {
        var colors = html.getAttribute("data-theme") === "light" ? accentLight : accentDark;
        applyAccent(colors[0], colors[1], colors[2]);
        if (window.RcitratColor) {
            window.RcitratColor.applyMode(html.getAttribute("data-theme") === "light" ? "light" : "dark");
        }
    };
    var setAccentPair = function(dark, light, background) {
        accentDark = dark;
        accentLight = light;
        var colors = html.getAttribute("data-theme") === "light" ? accentLight : accentDark;
        applyAccent(colors[0], colors[1], colors[2]);
        if (window.RcitratColor) {
            window.RcitratColor.setSeedPair(dark, light, background);
        }
    };

    /* --- Toast container --- */
    var toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        document.body.appendChild(toastContainer);
    }
    window.showToast = function(msg) {
        var t = document.createElement("div");
        t.className = "toast-item ic-host";
        var icon = document.createElement("hc-icon");
        icon.setAttribute("name", "check");
        var text = document.createElement("span");
        text.textContent = String(msg == null ? "" : msg);
        t.appendChild(icon);
        t.appendChild(text);
        toastContainer.appendChild(t);
        requestAnimationFrame(function() {
            t.classList.add("show");
            t.classList.add("ic-go");
        });
        setTimeout(function() {
            t.classList.remove("show");
            setTimeout(function() { t.remove(); }, 300);
        }, 2500);
    };

    /* --- Page Loader --- */
    var loader = document.getElementById("page-loader");
    if (!loader) {
        loader = document.createElement("div");
        loader.id = "page-loader";
        loader.innerHTML = '<div class="loader-ring"></div>';
        document.body.insertBefore(loader, document.body.firstChild);
    }
    var hideLoader = function() {
        setTimeout(function() { loader.classList.add("hidden"); }, 180);
    };
    if (document.readyState === "complete") hideLoader();
    else {
        document.addEventListener("DOMContentLoaded", hideLoader, { once: true });
        window.addEventListener("load", hideLoader, { once: true });
    }
    setTimeout(function() { loader.classList.add("hidden"); }, 8000);

    /* --- Theme Toggle --- */
    var saved = "dark";
    try {
        saved = localStorage.getItem("theme") === "light" ? "light" : "dark";
    } catch (error) {
        saved = html.getAttribute("data-theme") === "light" ? "light" : "dark";
    }
    html.setAttribute("data-theme", saved);
    if (window.RcitratColor) window.RcitratColor.restore();

    var toggle = document.getElementById("themeToggle");
    if (toggle) {
        var sunIcon = toggle.querySelector(".icon-sun"),
            moonIcon = toggle.querySelector(".icon-moon"),
            themeIcon = toggle.querySelector('hc-icon[name="theme"]');
        var updateToggleIcon = function(mode) {
            if (sunIcon) sunIcon.style.display = mode === "light" ? "none" : "";
            if (moonIcon) moonIcon.style.display = mode === "light" ? "" : "none";
            if (themeIcon) themeIcon.setAttribute("data-theme", mode);
        };
        updateToggleIcon(saved);
        toggle.addEventListener("click", function() {
            var next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
            html.setAttribute("data-theme", next);
            try { localStorage.setItem("theme", next); } catch (error) { /* storage is optional */ }
            updateToggleIcon(next);
            if (window.RcitratColor) window.RcitratColor.applyMode(next);
            else applyAccentFromTheme();
            toggle.classList.add("burst");
            setTimeout(function() { toggle.classList.remove("burst"); }, 600);
            /* update giscus theme */
            if (window.__giscusThemeUpdater) window.__giscusThemeUpdater(next);
        });
    }

    /* --- Random Background + Accent --- */
    var loadBg = function() {
        var seed = Math.floor(Math.random() * 1000);
        fetch(assetBase + "/resource/backgrounds/list.json", { cache: "no-store" })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var list = data.backgrounds;
                if (list && list.length) {
                    var pick = list[Math.floor(Math.random() * list.length)];
                    style.setProperty("--bg-image", "url('" + assetBase + "/resource/backgrounds/" + pick.file + "?v=" + seed + "')");
                    if (pick.accentDark && pick.accentDark.length === 3 && pick.accentLight && pick.accentLight.length === 3) {
                        setAccentPair(pick.accentDark, pick.accentLight, pick.file);
                    } else if (pick.accent && pick.accent.length === 3) {
                        setAccentPair(pick.accent, pick.accent, pick.file);
                    }
                }
            })
            .catch(function() {
                style.setProperty("--bg-image", "url('" + assetBase + "/resource/backgrounds/13.webp')");
                setAccentPair([25, 73, 133], [18, 61, 112], "13.webp");
            });
    };
    window.loadBg = loadBg;
    loadBg();

    /* --- bfcache recovery --- */
    window.addEventListener("pageshow", function(e) {
        if (e.persisted) {
            if (window.RcitratColor) window.RcitratColor.restore();
            loadBg();
        }
    });
})();
