/* Shared: theme toggle + random background + page loader + toast */
(function() {
    var html = document.documentElement;
    var style = html.style;

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
    };
    var setAccentPair = function(dark, light) {
        accentDark = dark;
        accentLight = light;
        applyAccentFromTheme();
    };

    /* --- Toast container --- */
    var toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
    window.showToast = function(msg) {
        var t = document.createElement("div");
        t.className = "toast-item";
        t.textContent = msg;
        toastContainer.appendChild(t);
        requestAnimationFrame(function() { t.classList.add("show"); });
        setTimeout(function() {
            t.classList.remove("show");
            setTimeout(function() { t.remove(); }, 300);
        }, 2500);
    };

    /* --- Page Loader --- */
    var loader = document.createElement("div");
    loader.id = "page-loader";
    loader.innerHTML = '<div class="loader-ring"></div>';
    document.body.insertBefore(loader, document.body.firstChild);
    window.addEventListener("load", function() {
        setTimeout(function() { loader.classList.add("hidden"); }, 200);
    });

    /* --- Theme Toggle --- */
    var toggle = document.getElementById("themeToggle");
    if (toggle) {
        var sunIcon = toggle.querySelector(".icon-sun"),
            moonIcon = toggle.querySelector(".icon-moon"),
            saved = localStorage.getItem("theme") || "dark";
        html.setAttribute("data-theme", saved);
        if (saved === "light") { sunIcon.style.display = "none"; moonIcon.style.display = ""; }
        toggle.addEventListener("click", function() {
            var next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
            html.setAttribute("data-theme", next);
            localStorage.setItem("theme", next);
            sunIcon.style.display = next === "light" ? "none" : "";
            moonIcon.style.display = next === "light" ? "" : "none";
            applyAccentFromTheme();
            toggle.classList.add("burst");
            setTimeout(function() { toggle.classList.remove("burst"); }, 600);
            /* update giscus theme */
            if (window.__giscusThemeUpdater) window.__giscusThemeUpdater(next);
        });
    }

    /* --- Random Background + Accent --- */
    var loadBg = function() {
        var seed = Math.floor(Math.random() * 1000);
        fetch("/resource/backgrounds/list.json")
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var list = data.backgrounds;
                if (list && list.length) {
                    var pick = list[Math.floor(Math.random() * list.length)];
                    style.setProperty("--bg-image", "url('/resource/backgrounds/" + pick.file + "?v=" + seed + "')");
                    if (pick.accentDark && pick.accentDark.length === 3 && pick.accentLight && pick.accentLight.length === 3) {
                        setAccentPair(pick.accentDark, pick.accentLight);
                    } else if (pick.accent && pick.accent.length === 3) {
                        setAccentPair(pick.accent, pick.accent);
                    }
                }
            })
            .catch(function() {
                style.setProperty("--bg-image", "url('/resource/backgrounds/13.webp')");
                setAccentPair([25, 73, 133], [18, 61, 112]);
            });
    };
    loadBg();

    /* --- bfcache recovery --- */
    window.addEventListener("pageshow", function(e) {
        if (e.persisted) { loadBg(); }
    });
})();
