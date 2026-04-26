import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@siiway/prism',
  description: 'TypeScript SDK for Prism OAuth 2.0 / OIDC',
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'API', link: '/guide/api-reference' },
        ],
        sidebar: [
          {
            text: 'Guide',
            items: [
              { text: 'Getting Started', link: '/guide/getting-started' },
              { text: 'OAuth Flow', link: '/guide/oauth-flow' },
              { text: 'Token Management', link: '/guide/token-management' },
              { text: 'Resource APIs', link: '/guide/resource-apis' },
              { text: 'Public Profiles', link: '/guide/public-profile' },
              { text: 'App Notifications', link: '/guide/app-notifications' },
              { text: 'Cross-App Permissions', link: '/guide/app-permissions' },
              { text: 'Error Handling', link: '/guide/error-handling' },
              { text: 'API Reference', link: '/guide/api-reference' },
            ],
          },
          {
            text: 'Examples',
            items: [
              { text: 'Express / Node.js', link: '/guide/example-express' },
              { text: 'React SPA', link: '/guide/example-react' },
            ],
          },
        ],
      },
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/getting-started' },
          { text: 'API', link: '/zh/guide/api-reference' },
        ],
        sidebar: [
          {
            text: '指南',
            items: [
              { text: '快速开始', link: '/zh/guide/getting-started' },
              { text: 'OAuth 流程', link: '/zh/guide/oauth-flow' },
              { text: '令牌管理', link: '/zh/guide/token-management' },
              { text: '资源 API', link: '/zh/guide/resource-apis' },
              { text: '公开资料', link: '/zh/guide/public-profile' },
              { text: '应用通知', link: '/zh/guide/app-notifications' },
              { text: '跨应用权限', link: '/zh/guide/app-permissions' },
              { text: '错误处理', link: '/zh/guide/error-handling' },
              { text: 'API 参考', link: '/zh/guide/api-reference' },
            ],
          },
          {
            text: '示例',
            items: [
              { text: 'Express / Node.js', link: '/zh/guide/example-express' },
              { text: 'React SPA', link: '/zh/guide/example-react' },
            ],
          },
        ],
      },
    },
  },
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/siiway/prism' },
    ],
  },
})
