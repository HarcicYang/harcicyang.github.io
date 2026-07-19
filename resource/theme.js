/* Shared: theme toggle + random background + page loader + toast */
(function() {
    var html = document.documentElement;

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
            /* burst animation */
            toggle.classList.add("burst");
            setTimeout(function() { toggle.classList.remove("burst"); }, 600);
        });
    }

    /* --- Random Background --- */
    var loadBg = function() {
        var style = html.style;
        var seed = Math.floor(Math.random() * 1000);
        fetch("/resource/backgrounds/list.json")
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var list = data.backgrounds;
                if (list && list.length) {
                    var pick = list[Math.floor(Math.random() * list.length)];
                    style.setProperty("--bg-image", "url('/resource/backgrounds/" + pick + "?v=" + seed + "')");
                }
            })
            .catch(function() {
                style.setProperty("--bg-image", "url('/resource/backgrounds/back.webp')");
            });
    };
    loadBg();

    /* --- bfcache recovery (restore bg after back-navigation) --- */
    window.addEventListener("pageshow", function(e) {
        if (e.persisted) { loadBg(); }
    });
})();
