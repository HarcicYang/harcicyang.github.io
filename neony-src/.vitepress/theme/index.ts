import DefaultTheme from 'vitepress/theme'

// 联动主站主题：主站 (theme.js) 将明暗选择存于 localStorage['theme']，
// 取值 'dark'（默认）或 'light'。文档站跟随该设置，而非独立的 VitePress 主题状态。
export default {
  extends: DefaultTheme,
  enhanceApp() {
    if (typeof window !== 'undefined') {
      const apply = () => {
        const saved = localStorage.getItem('theme') || 'dark'
        document.documentElement.classList.toggle('dark', saved === 'dark')
      }
      apply()
      window.addEventListener('storage', apply)
    }
  },
}
