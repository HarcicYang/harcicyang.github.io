/* Home-only interaction bridge; color and background stay in the shared theme scripts. */
(function () {
    "use strict";

    var root = document.documentElement;
    var themeToggle = document.getElementById("themeToggle");
    var themeIcon = themeToggle && themeToggle.querySelector('hc-icon[name="theme"]');

    function setIconState(theme) {
        if (themeIcon) themeIcon.setAttribute("data-theme", theme);
    }

    setIconState(root.getAttribute("data-theme") || "dark");

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            setTimeout(function () {
                setIconState(root.getAttribute("data-theme") === "light" ? "light" : "dark");
            }, 0);
        });
    }

    /* Replay the one-shot SVG animation whenever selection lands on a module. */
    function replayActiveIcon() {
        var active = document.querySelector(".module-card.is-active");
        if (!active) return;
        document.querySelectorAll(".module-card.ic-go").forEach(function (card) {
            card.classList.remove("ic-go");
        });
        active.classList.remove("ic-go");
        void active.offsetWidth;
        active.classList.add("ic-go");
    }

    document.querySelectorAll(".module-card").forEach(function (card) {
        card.addEventListener("focusin", replayActiveIcon);
    });

    document.addEventListener("click", function (event) {
        var dot = event.target.closest && event.target.closest(".module-dot");
        if (dot) setTimeout(replayActiveIcon, 0);
    });

    document.addEventListener("keydown", function (event) {
        if (/^(ArrowUp|ArrowDown|Home|End|PageUp|PageDown|[1-9])$/.test(event.key)) {
            setTimeout(replayActiveIcon, 0);
        }
    });

    var observer = new MutationObserver(function (records) {
        var selectionChanged = records.some(function (record) {
            var wasActive = record.oldValue ? record.oldValue.split(/\s+/).indexOf("is-active") !== -1 : false;
            var isActive = record.target.classList.contains("is-active");
            return wasActive !== isActive;
        });
        if (selectionChanged) replayActiveIcon();
    });
    document.querySelectorAll(".module-card").forEach(function (card) {
        observer.observe(card, {
            attributes: true,
            attributeFilter: ["class"],
            attributeOldValue: true
        });
    });
    replayActiveIcon();
})();
