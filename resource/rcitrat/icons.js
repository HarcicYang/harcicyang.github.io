/* Light-DOM <hc-icon> registry. Icon bodies are trusted static constants. */
(function () {
    "use strict";

    var ICONS = {
        search: '<g class="s-lens"><circle cx="10.5" cy="10.5" r="6.25"/><path class="s-glint" d="M7.7 9.1a3.2 3.2 0 0 1 2.1-2.1" opacity=".55"/></g><path class="ic-a s-handle" d="M15.2 15.2 20 20" pathLength="10"/>',
        bolt: '<path class="ic-af b-charge" d="M13.2 2.8 5.6 13.4h5.6l-1 7.8 7.6-10.6h-5.6l1-7.8z"/><path class="b-bolt" d="M13.2 2.8 5.6 13.4h5.6l-1 7.8 7.6-10.6h-5.6l1-7.8z" pathLength="100"/><path class="ic-a b-spark" d="M18.8 4.4l1.4-1.4M20.2 8.2h1.6M4.4 19.4 3 20.8M2.4 15.8h1.6"/>',
        music: '<g class="m-note"><path d="M9 17.2V6.4l10-2.2v10.6"/><circle cx="6.6" cy="17.2" r="2.4"/><circle cx="16.6" cy="14.8" r="2.4"/><path class="ic-a m-beam" d="M9 9.8l10-2.2" pathLength="100"/></g>',
        write: '<path d="M4.5 6.5h9M4.5 10.5h5.5"/><path class="ic-a w-ink" d="M4.5 18.8c1.2-1.6 2.3-1.6 3.1 0s1.9 1.6 3.1 0" pathLength="100"/><path class="w-pen" d="M13.8 18.6 19.9 12.5a1.6 1.6 0 0 0-2.3-2.3l-6.1 6.1-.6 2.9z"/>',
        image: '<rect x="3" y="4.5" width="18" height="15" rx="3"/><path class="i-mtn" d="M3.6 17.2 8.8 12l3.6 3.6 2.4-2.4 5.6 5.4"/><circle class="ic-af i-sun" cx="16" cy="9.2" r="1.7"/>',
        bot: '<g class="r-ant"><path d="M12 8V5.4"/><circle cx="12" cy="4.3" r="1.1"/></g><rect x="4.5" y="8" width="15" height="11" rx="3.5"/><path d="M2.6 12.2v3.6M21.4 12.2v3.6"/><path class="ic-a r-eyes" d="M9.4 12.6v1.8M14.6 12.6v1.8"/>',
        book: '<path d="M12 6.6C10.2 5.3 7.8 4.7 4 4.7v12.8c3.8 0 6.2.6 8 1.9 1.8-1.3 4.2-1.9 8-1.9V4.7c-3.8 0-6.2.6-8 1.9z"/><path d="M12 6.6v12.8"/><path class="k-page" d="M12 6.6c1.8-1.3 4.2-1.9 8-1.9v12.8c-3.8 0-6.2.6-8 1.9"/><path class="ic-a k-mark" d="M15.6 5.1v5.3l1.5-1.1 1.5 1.1V4.8"/>',
        euler: '<path d="M2.8 12h18.4M12 2.8v18.4" opacity=".32"/><circle cx="12" cy="12" r="7.5"/><g class="e-arm"><path class="ic-a" d="M12 12l5.3-5.3"/><circle class="ic-af" cx="17.3" cy="6.7" r="1.6"/></g>',
        chat: '<path class="c-bub" d="M6 5.2h12a2.8 2.8 0 0 1 2.8 2.8v6.4a2.8 2.8 0 0 1-2.8 2.8h-6.2L7.4 20.4v-3.2H6a2.8 2.8 0 0 1-2.8-2.8V8A2.8 2.8 0 0 1 6 5.2z"/><g class="ic-af c-dots"><circle cx="8.6" cy="11.2" r="1.1"/><circle cx="12" cy="11.2" r="1.1"/><circle cx="15.4" cy="11.2" r="1.1"/></g>',
        vinyl: '<g class="v-disc"><circle cx="12" cy="12" r="8.6"/><path d="M7.2 12a4.8 4.8 0 0 1 4.8-4.8M16.8 12a4.8 4.8 0 0 1-4.8 4.8" opacity=".5"/><circle class="ic-af" cx="12" cy="12" r="2.3"/></g>',
        phone: '<path class="p-set" d="M6.2 3.6h2.4c.5 0 .9.3 1 .8l.8 3.2c.1.4 0 .8-.3 1.1L8.6 10.2a12 12 0 0 0 5.2 5.2l1.5-1.5c.3-.3.7-.4 1.1-.3l3.2.8c.5.1.8.5.8 1v2.4c0 1-.8 1.8-1.8 1.8C10.4 19.6 4.4 13.6 4.4 5.4c0-1 .8-1.8 1.8-1.8z"/><g class="ic-a p-wave"><path d="M14.6 3.6a5.8 5.8 0 0 1 5.8 5.8"/><path d="M14.6 7a2.4 2.4 0 0 1 2.4 2.4"/></g>',
        coffee: '<path d="M5 9.8h11v4.6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 11.2h1.4a2.4 2.4 0 0 1 0 4.8H16"/><g class="ic-a j-steam"><path d="M8.6 3.4c-.9.9.9 1.9 0 2.8"/><path d="M12.2 3.4c-.9.9.9 1.9 0 2.8"/></g>',
        sparkle: '<path class="k-star" d="M10.5 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5z"/><path class="ic-a k-mini" d="M18.2 15.2v4.2M16.1 17.3h4.2"/>',
        cap: '<g class="g-cap"><path d="M2.6 9.2 12 4.8l9.4 4.4L12 13.6z"/><path d="M6.6 11.3v4.3c0 1.5 2.4 2.9 5.4 2.9s5.4-1.4 5.4-2.9v-4.3"/><g class="g-tassel"><path class="ic-a" d="M21.4 9.2v5.2"/><circle class="ic-af" cx="21.4" cy="15.5" r="1.1"/></g></g>',
        arrow: '<path class="a-shaft" d="M4.5 12h13.5"/><path class="ic-a a-head" d="M13 6.5 18.5 12 13 17.5"/>',
        back: '<path class="a-shaft" d="M19.5 12H6"/><path class="ic-a a-head" d="M11 6.5 5.5 12 11 17.5"/>',
        close: '<path class="ic-a" d="M6 6l12 12M18 6 6 18"/>',
        plus: '<path class="ic-a" d="M12 5v14M5 12h14"/>',
        play: '<path class="ic-fill" d="M8.5 5.8v12.4c0 .8.9 1.3 1.6.8l9.3-6.2c.6-.4.6-1.2 0-1.6L10.1 5c-.7-.5-1.6 0-1.6.8z"/>',
        pause: '<rect class="ic-fill" x="6.5" y="5" width="4" height="14" rx="1.4"/><rect class="ic-fill" x="13.5" y="5" width="4" height="14" rx="1.4"/>',
        prev: '<path d="M6 5.5v13"/><path class="ic-fill" d="M18 6.4v11.2c0 .8-.9 1.2-1.5.8L9 13c-.6-.4-.6-1.3 0-1.7l7.5-5.6c.6-.5 1.5-.1 1.5.7z"/>',
        next: '<path d="M18 5.5v13"/><path class="ic-fill" d="M6 6.4v11.2c0 .8.9 1.2 1.5.8L15 13c.6-.4.6-1.3 0-1.7L7.5 5.7C6.9 5.2 6 5.6 6 6.4z"/>',
        check: '<path class="ic-a ck" d="M5 12.5l4.2 4.2L19 7" pathLength="100"/>',
        alert: '<path d="M10.4 4.6c.7-1.2 2.5-1.2 3.2 0l7.2 12.6c.7 1.2-.2 2.8-1.6 2.8H4.8c-1.4 0-2.3-1.6-1.6-2.8z"/><path class="ic-a" d="M12 9.6v3.8M12 16.4v.1"/>',
        dropper: '<path d="M13.6 7.6l2.8 2.8-8 8c-.4.4-1 .6-1.6.6H5v-1.8c0-.6.2-1.2.6-1.6z"/><path class="ic-a dp-bulb" d="M14.6 6.6l1.8-1.8a2.3 2.3 0 0 1 3.3 3.3l-1.8 1.8M12.6 5.6l5.8 5.8"/>',
        theme: '<mask id="__MASK_ID__"><rect width="24" height="24" fill="#fff"/><circle class="t-cut" cx="16" cy="8" r="5.2" fill="#000"/></mask><path class="t-rays" d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.5 1.5M17.3 17.3l1.5 1.5M5.2 18.8l1.5-1.5M17.3 6.7l1.5-1.5"/><circle class="ic-af t-core" cx="12" cy="12" r="5" mask="url(#__MASK_ID__)"/><path class="t-stars" d="M19.2 14.6v2.4M18 15.8h2.4M15.6 19.4v1.4M14.9 20.1h1.4"/>'
    };

    var sequence = 0;

    function render(host) {
        var name = host.getAttribute("name") || "";
        if (host.parentElement) host.parentElement.classList.add("ic-host");
        if (!Object.prototype.hasOwnProperty.call(ICONS, name)) {
            host.textContent = "";
            return;
        }
        var body = ICONS[name];
        if (name === "theme") {
            sequence += 1;
            var id = "hc-theme-mask-" + sequence;
            body = body.split("__MASK_ID__").join(id);
        }
        host.innerHTML = '<svg class="ic ic-' + name + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>";
    }

    class HcIcon extends HTMLElement {
        static get observedAttributes() { return ["name"]; }
        connectedCallback() { render(this); }
        attributeChangedCallback() { render(this); }
    }

    if (!customElements.get("hc-icon")) customElements.define("hc-icon", HcIcon);
    window.HC_ICONS = ICONS;
})();
