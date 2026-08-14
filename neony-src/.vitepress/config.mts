import { defineConfig } from 'vitepress'
import { readFileSync } from 'node:fs'

// Neony 文档站配置。
//
// 源文档由 scripts/sync_neony_docs.py 从 Neony 仓库 docs/ 目录生成：
//   en/  <- docs/*.en.md   （root 语言，URL 无前缀，/neony/ 即英文）
//   zh/  <- docs/*.zh.md   （URL 前缀 /zh/）
//
// 构建产物输出到仓库根 neony/（见 base），GitHub Pages 直接服务。
// 版本列表（versions.json）由同步脚本维护，构建时读取生成「版本」下拉。

const versions = (() => {
  try {
    return JSON.parse(
      readFileSync(new URL('../versions.json', import.meta.url), 'utf-8'),
    )
  } catch {
    return { current: null, history: [] }
  }
})()

function versionNavItems() {
  const items = []
  if (versions.current) {
    items.push({
      text: `最新版 (${versions.current.short})`,
      link: '/',
    })
    items.push({
      text: `GitHub 上查看 @${versions.current.short}`,
      link: `https://github.com/HarcicYang/Neony/tree/${versions.current.sha}/docs`,
    })
  }
  // release tags (v0.2.0, v0.1.2, ...) — jump to the tag's docs on GitHub
  for (const t of versions.tags || []) {
    items.push({
      text: `🏷️ ${t.name}${t.date ? ` · ${t.date}` : ''}`,
      link: `https://github.com/HarcicYang/Neony/tree/${t.name}/docs`,
    })
  }
  for (const v of versions.history) {
    items.push({
      text: `${v.short} · ${v.date} · ${v.message}`,
      link: `https://github.com/HarcicYang/Neony/tree/${v.sha}/docs`,
    })
  }
  return items
}

const zhSidebar = [
  {
    text: '从这里开始',
    items: [
      { text: 'Neony 文档', link: '/zh/' },
      { text: '入门教程', link: '/zh/getting-started' },
    ],
  },
  {
    text: '指南',
    items: [
      { text: '安装与平台', link: '/zh/guides/installation-platforms' },
    ],
  },
  {
    text: 'API 参考',
    items: [
      { text: 'API 索引', link: '/zh/api/' },
      { text: '核心', link: '/zh/api/core' },
      { text: '组件', link: '/zh/api/components' },
      { text: '布局与窗口装饰', link: '/zh/api/layout-chrome' },
      { text: 'DOM 与 CSS', link: '/zh/api/dom-css' },
      { text: '响应式', link: '/zh/api/reactive' },
      { text: '平台与国际化', link: '/zh/api/platform-i18n' },
    ],
  },
]

const enSidebar = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Neony Documentation', link: '/' },
      { text: 'Getting started', link: '/getting-started' },
    ],
  },
  {
    text: 'Guides',
    items: [
      { text: 'Installation and platforms', link: '/guides/installation-platforms' },
    ],
  },
  {
    text: 'API Reference',
    items: [
      { text: 'API index', link: '/api/' },
      { text: 'Core', link: '/api/core' },
      { text: 'Components', link: '/api/components' },
      { text: 'Layout & chrome', link: '/api/layout-chrome' },
      { text: 'DOM & CSS', link: '/api/dom-css' },
      { text: 'Reactivity', link: '/api/reactive' },
      { text: 'Platform & i18n', link: '/api/platform-i18n' },
    ],
  },
]

const versionDropdownEn = {
  text: versions.current ? `v${versions.current.short}` : 'Versions',
  items: versionNavItems(),
}

const versionDropdownZh = {
  text: versions.current ? `v${versions.current.short}` : '版本',
  items: versionNavItems(),
}

export default defineConfig({
  // 产物部署在 /neony/ 子路径（仓库根 neony/ 目录）
  base: '/neony/',
  outDir: '../neony',
  head: [
    // 与主站一致的 favicon（站根绝对路径，VitePress 不会改写 head 中的 URL）
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/resource/favicon.svg' }],
  ],
  title: 'Neony Documentation',
  description: 'Neony — reactive desktop UI framework in Python',
  cleanUrls: false,
  lastUpdated: false,
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      title: 'Neony Documentation',
      description: 'Neony — reactive desktop UI framework in Python',
      themeConfig: {
        nav: [
          { text: 'Docs', link: '/' },
          { text: 'Getting started', link: '/getting-started' },
          { text: 'GitHub', link: 'https://github.com/HarcicYang/Neony' },
          versionDropdownEn,
          { text: 'Harcic\'s Hub', link: 'https://harcic.is-a.dev/' },
        ],
        sidebar: enSidebar,
      },
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      title: 'Neony 文档',
      description: 'Neony — Python 响应式桌面 UI 框架',
      themeConfig: {
        nav: [
          { text: '文档首页', link: '/zh/' },
          { text: '入门教程', link: '/zh/getting-started' },
          { text: 'GitHub', link: 'https://github.com/HarcicYang/Neony' },
          versionDropdownZh,
          { text: 'Harcic\'s Hub', link: 'https://harcic.is-a.dev/' },
        ],
        sidebar: zhSidebar,
      },
    },
  },
  themeConfig: {
    // 导航栏 H 形 logo（neony-src/public/favicon.svg，构建时复制到产物根）
    logo: '/favicon.svg',
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                noResultsText: '没有找到相关结果',
                resetButtonTitle: '清除查询',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
              },
            },
          },
        },
      },
    },
    outline: { level: [2, 3], label: 'On this page' },
    docFooter: { prev: 'Previous', next: 'Next' },
    returnToTopLabel: 'Back to top',
    sidebarMenuLabel: 'Menu',
    langMenuLabel: 'Language',
  },
})
