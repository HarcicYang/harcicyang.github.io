# Neony API reference


The reference is split into paired chapters. Each chapter covers one
area with short signatures, parameters, return values, edge cases, and a
small example; long-form explanations live in the guides. API symbols,
import paths, commands, and example filenames stay in English in both
language versions so code can be copied directly.

## Chapters

- [Core](/api/core) — `NeonApplication`, `launch`, `Config` /
  `WindowConfig` / `WebViewConfig`, `Page`, lifecycle, multi-window,
  navigation policies, `Tray`.
- [Components](/api/components) — form controls, text & tabs, overlays
  & feedback, content components, and the `Reorder` drag-and-reorder
  component.
- [Layout & chrome](/api/layout-chrome) — `VStack` / `HStack` / `Flex` /
  `Separator` / `GlassPanel`, `TitleBar`, `Sidebar` / `Pane` /
  `SidebarGroup`, `Tree`, `List`, `DataTable`, `Icon`.
- [DOM & CSS](/api/dom-css) — `Color`, `Styles`, `DomEvent`, raw HTML
  elements, and the low-level drag primitive.
- [Reactivity](/api/reactive) — `Signal`, `Computed`, `effect` / `Effect`,
  `untrack`, `SharedSignal`, declarative bindings, `bind_value`,
  dirty-subtree tracking.
- [Platform & i18n](/api/platform-i18n) — internationalization,
  theming, and the platform-native surfaces (window controls, native
  file dialogs, system tray).

## Stability

Neony is pre-beta. Some names still carry deprecated aliases (e.g.
`active_key` → `selected_key`); the chapters note them inline. See the
project's [CHANGELOG](https://github.com/HarcicYang/Neony/blob/ef0ede3/CHANGELOG.md) for the per-version story.

For an exact signature not yet split out, the previous monolithic entry
is retained temporarily at [`api.en.md`](/api/) as a stable link
target while readers and external links migrate.
