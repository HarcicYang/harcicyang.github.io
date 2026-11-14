/* Background-seeded OKLCH tokens, exposed as a dependency-free classic script. */
(function () {
    "use strict";

    var STORAGE_KEY = "rcitrat.seed";
    var THEME_KEY = "theme";
    var FALLBACK = {
        dark: [25, 73, 133],
        light: [18, 61, 112],
        background: "13.webp"
    };
    var pair = clonePair(FALLBACK);
    var root = document.documentElement;

    function clamp(value, low, high) {
        return Math.min(high, Math.max(low, value));
    }

    function clonePair(value) {
        return {
            dark: (value.dark || FALLBACK.dark).slice(0, 3),
            light: (value.light || FALLBACK.light).slice(0, 3),
            background: value.background || FALLBACK.background
        };
    }

    function validRgb(value) {
        return Array.isArray(value) && value.length === 3 && value.every(function (channel) {
            return typeof channel === "number" && isFinite(channel) && channel >= 0 && channel <= 255;
        });
    }

    function safeStorage() {
        try { return window.localStorage; } catch (error) { return null; }
    }

    function toLinear(channel) {
        var value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    }

    function toGamma(value) {
        return value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
    }

    function rgbToOklch(rgb) {
        var r = toLinear(rgb[0]);
        var g = toLinear(rgb[1]);
        var b = toLinear(rgb[2]);
        var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
        var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
        var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
        var L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
        var A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
        var B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
        var h = Math.atan2(B, A) * 180 / Math.PI;
        if (h < 0) h += 360;
        return { l: L, c: Math.hypot(A, B), h: h };
    }

    function oklchToLinear(l, c, h) {
        var radians = h * Math.PI / 180;
        var a = c * Math.cos(radians);
        var b = c * Math.sin(radians);
        var l_ = l + 0.3963377774 * a + 0.2158037573 * b;
        var m_ = l - 0.1055613458 * a - 0.0638541728 * b;
        var s_ = l - 0.0894841775 * a - 1.291485548 * b;
        var L = l_ * l_ * l_;
        var M = m_ * m_ * m_;
        var S = s_ * s_ * s_;
        return [
            4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
            -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
            -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S
        ];
    }

    function oklchToHex(l, c, h) {
        var inGamut = function (channels) {
            return channels.every(function (channel) {
                return channel >= -0.0005 && channel <= 1.0005;
            });
        };
        var linear = oklchToLinear(l, c, h);
        if (!inGamut(linear)) {
            var low = 0;
            var high = c;
            for (var i = 0; i < 24; i += 1) {
                var mid = (low + high) / 2;
                if (inGamut(oklchToLinear(l, mid, h))) low = mid;
                else high = mid;
            }
            linear = oklchToLinear(l, low, h);
        }
        return "#" + linear.map(function (channel) {
            var value = Math.round(clamp(toGamma(clamp(channel, 0, 1)) * 255, 0, 255));
            return value.toString(16).padStart(2, "0");
        }).join("");
    }

    function hexToRgb(hex) {
        var value = parseInt(hex.slice(1), 16);
        return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
    }

    function makePalette(rgb, mode) {
        var seed = rgbToOklch(rgb);
        var c = seed.c;
        var h = seed.h;
        var primaryChroma = clamp(c, 0.02, 0.16);
        var limited = function (factor, cap) { return Math.min(c * factor, cap); };
        var ok = function (l, chroma) { return oklchToHex(l, chroma, h); };
        var accentL = mode === "dark" ? clamp(seed.l, 0.64, 0.8) : clamp(seed.l, 0.5, 0.6);
        var accent = ok(accentL, Math.max(c, 0.08));
        var accentRgb = hexToRgb(accent);

        if (mode === "dark") {
            return {
                "--hc-bg": ok(0.16, limited(0.12, 0.014)),
                "--hc-surface-1": ok(0.20, limited(0.16, 0.018)),
                "--hc-surface-2": ok(0.24, limited(0.20, 0.022)),
                "--hc-surface-3": ok(0.28, limited(0.24, 0.026)),
                "--hc-surface-4": ok(0.32, limited(0.28, 0.030)),
                "--hc-on": ok(0.95, limited(0.04, 0.008)),
                "--hc-on-2": ok(0.80, limited(0.12, 0.020)),
                "--hc-on-3": ok(0.64, limited(0.12, 0.022)),
                "--hc-primary": ok(0.80, primaryChroma * 0.85),
                "--hc-on-primary": ok(0.22, primaryChroma * 0.55),
                "--hc-primary-container": ok(0.38, primaryChroma * 0.8),
                "--hc-on-primary-container": ok(0.93, primaryChroma * 0.3),
                "--hc-accent": accent,
                "--hc-on-accent": accentL > 0.72 ? ok(0.20, primaryChroma * 0.5) : "#f8fcfe",
                "--hc-accent-rgb": accentRgb.join(", ")
            };
        }
        return {
            "--hc-bg": ok(0.982, limited(0.06, 0.006)),
            "--hc-surface-1": ok(0.956, limited(0.10, 0.012)),
            "--hc-surface-2": ok(0.932, limited(0.14, 0.016)),
            "--hc-surface-3": ok(0.905, limited(0.18, 0.020)),
            "--hc-surface-4": ok(0.876, limited(0.22, 0.024)),
            "--hc-on": ok(0.20, limited(0.10, 0.016)),
            "--hc-on-2": ok(0.40, limited(0.12, 0.020)),
            "--hc-on-3": ok(0.55, limited(0.12, 0.020)),
            "--hc-primary": ok(0.52, primaryChroma),
            "--hc-on-primary": "#f8fcfe",
            "--hc-primary-container": ok(0.88, primaryChroma * 0.42),
            "--hc-on-primary-container": ok(0.28, primaryChroma * 0.75),
            "--hc-accent": accent,
            "--hc-on-accent": "#f8fcfe",
            "--hc-accent-rgb": accentRgb.join(", ")
        };
    }

    function currentMode() {
        var storage = safeStorage();
        var saved = storage ? storage.getItem(THEME_KEY) : null;
        return saved === "light" ? "light" : "dark";
    }

    function readStoredPair() {
        var storage = safeStorage();
        if (!storage) return clonePair(FALLBACK);
        try {
            var value = JSON.parse(storage.getItem(STORAGE_KEY));
            if (!value || !validRgb(value.dark) || !validRgb(value.light)) return clonePair(FALLBACK);
            return clonePair(value);
        } catch (error) {
            return clonePair(FALLBACK);
        }
    }

    function writeStoredPair(value) {
        var storage = safeStorage();
        if (!storage) return;
        try { storage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch (error) { /* storage is optional */ }
    }

    function applyLegacyChannels(rgb, palette) {
        var style = root.style;
        var channels = palette["--hc-accent-rgb"].split(",").map(function (value) {
            return parseInt(value.trim(), 10);
        });
        var light = palette["--hc-primary"];
        var lightRgb = hexToRgb(light);
        style.setProperty("--accent-r", channels[0]);
        style.setProperty("--accent-g", channels[1]);
        style.setProperty("--accent-b", channels[2]);
        style.setProperty("--accent-r2", lightRgb[0]);
        style.setProperty("--accent-g2", lightRgb[1]);
        style.setProperty("--accent-b2", lightRgb[2]);
        style.setProperty("--logo-sub-r", channels[0]);
        style.setProperty("--logo-sub-g", channels[1]);
        style.setProperty("--logo-sub-b", channels[2]);
        style.setProperty("--primary-rgb", palette["--hc-accent-rgb"]);
    }

    function syncThemeColor(color) {
        if (!color) return;
        document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
            meta.setAttribute("content", color);
            meta.removeAttribute("media");
        });
    }

    function applyMode(mode) {
        var resolved = mode === "light" ? "light" : "dark";
        var rgb = pair[resolved];
        var palette = makePalette(rgb, resolved);
        root.setAttribute("data-theme", resolved);
        root.style.colorScheme = resolved;
        Object.keys(palette).forEach(function (name) {
            root.style.setProperty(name, palette[name]);
        });
        syncThemeColor(palette["--hc-bg"]);
        applyLegacyChannels(rgb, palette);
        return palette;
    }

    function backgroundFromStyle() {
        var value = root.style.getPropertyValue("--bg-image") || "";
        var match = /backgrounds\/([^"')?]+)/.exec(value);
        return match ? match[1] : pair.background;
    }

    function setSeedPair(dark, light, background) {
        if (validRgb(dark) && validRgb(light)) {
            pair = clonePair({
                dark: dark,
                light: light,
                background: background || backgroundFromStyle()
            });
            writeStoredPair(pair);
        }
        return applyMode(currentMode());
    }

    function restore() {
        pair = readStoredPair();
        return applyMode(currentMode());
    }

    window.RcitratColor = {
        setSeedPair: setSeedPair,
        applyMode: applyMode,
        restore: restore,
        getCurrentSeed: function () { return clonePair(pair); }
    };

    window.addEventListener("storage", function (event) {
        if (event.key === THEME_KEY || event.key === STORAGE_KEY || event.key === null) restore();
    });

    restore();
})();
