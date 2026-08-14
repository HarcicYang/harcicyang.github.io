---
layout: home

hero:
  name: Neony
  text: 纯 Python 的响应式桌面 UI 框架
  tagline: 用 Python 对象——组件、布局、样式——拼装界面，在原生窗口中渲染，DOM 自动增量更新。无需编写 HTML 或 JavaScript。(pre-beta)
  actions:
    - theme: brand
      text: 入门教程
      link: /zh/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/HarcicYang/Neony

features:
  - title: 纯 Python API
    details: 组件、布局、事件全部由 Python 对象构成，应用代码不必编写 HTML 或 JavaScript。
  - title: 细粒度响应式
    details: Signal / Computed / Effect 原语与声明式绑定；脏子树 diff 只更新变化的元素。
  - title: 与 Tauri 同源
    details: 经 LumiView 使用 Rust tao/wry WebView；自定义窗口装饰、透明窗口与原生窗口效果。
  - title: 双语文档
    details: 中英文完整文档，内置搜索与版本历史。
---
