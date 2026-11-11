// Type Dutch adaptation: modified 2026-11-10. Upstream: zyronon/TypeWords, GPL-3.0.
// https://nuxt.com/docs/api/configuration/nuxt-config
//@ts-ignore
import { resolve } from 'node:path'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { execSync } from 'child_process'
import { defineNuxtConfig } from 'nuxt/config'

let latestCommitHash = ''
let latestCommitTime = ''
try {
  latestCommitHash = execSync('git rev-parse --short HEAD').toString().trim()
  latestCommitTime = execSync('git log -1 --format=%ci').toString().trim()
} catch (e) {
  latestCommitHash = 'unknown'
  latestCommitTime = 'unknown'
}

const siteOrigin = (process.env.ORIGIN || 'http://localhost:5567').replace(/\/$/, '')

function normalizeBaseURL(baseURL: string = '/') {
  if (!baseURL) return '/'

  let normalizedBaseURL = baseURL.trim()

  if (!normalizedBaseURL.startsWith('/')) {
    normalizedBaseURL = `/${normalizedBaseURL}`
  }
  if (!normalizedBaseURL.endsWith('/')) {
    normalizedBaseURL = `${normalizedBaseURL}/`
  }

  return normalizedBaseURL.replace(/\/{2,}/g, '/')
}

function withBaseURL(path: string, baseURL: string) {
  if (!path.startsWith('/')) return path
  if (baseURL === '/') return path
  if (path === '/') return baseURL
  return `${baseURL.slice(0, -1)}${path}`
}

function toSiteURL(path: string, baseURL: string) {
  return new URL(withBaseURL(path, baseURL), siteOrigin).toString()
}

const appBaseURL = normalizeBaseURL(process.env.NUXT_APP_BASE_URL || '/')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  app: {
    baseURL: appBaseURL,
    // keepalive: true,
    head: {
      title: 'Type Dutch · 每天敲一点荷兰语',
      htmlAttrs: {
        lang: 'zh-CN',
      },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: withBaseURL('/dutch-icon.svg', appBaseURL) }],
    },
  },
  ssr: false,
  routeRules: {
    '/words': { ssr: false },
    '/articles': { ssr: false },
    '/setting': { ssr: false },
  },
  vite: {
    plugins: [
      Components({
        resolvers: [
          IconsResolver({
            prefix: 'Icon',
          }),
        ],
      }),
      Icons({
        autoInstall: true,
      }),
    ],
  },
  // 模块
  modules: ['@pinia/nuxt', '@unocss/nuxt', 'unplugin-icons/nuxt', '@vue-macros/nuxt', '@nuxtjs/i18n', '@nuxt/image'],
  macros: {
    betterDefine: false,
  },
  // i18n 配置
  i18n: {
    locales: [{ code: 'zh', language: 'zh-CN', file: 'zh.json', name: '中文' }],
    defaultLocale: 'zh',
    // langDir:'app/i18n/',
    strategy: 'no_prefix',
  },
  // CSS
  css: ['~/assets/css/main.scss'],
  // 别名配置
  alias: {
    '@': resolve(__dirname, 'app'),
  },
  // 自动导入配置
  imports: {
    dirs: ['app/composables/**', 'app/utils/**'],
  },
  // 组件自动导入目录
  components: [
    { path: 'components', pathPrefix: false },
    { path: 'app/components', pathPrefix: false },
  ],
  // 运行时配置
  runtimeConfig: {
    public: {
      cloudApiURL: process.env.NUXT_PUBLIC_CLOUD_API_URL || '',
      apiBase: process.env.API_BASE || 'http://localhost/',
      origin: siteOrigin,
      host: process.env.HOST || 'localhost',
      passwordRsaPublicKey: process.env.VITE_PASSWORD_RSA_PUBLIC_KEY || '',
      latestCommitHash: latestCommitHash + (process.env.NODE_ENV === 'production' ? '' : ' (dev)'),
      latestCommitTime: latestCommitTime,
    },
  },
  // 构建配置
  build: {
    transpile: ['vue-virtual-scroller', 'vxe-table'],
  },
  // 实验性功能
  experimental: {
    payloadExtraction: false, // 禁用 payload 提取，减少构建体积
  },
  // TypeScript 配置
  typescript: {
    strict: false,
    typeCheck: false, // 构建时不进行类型检查，加快构建速度
    tsConfig: {
      compilerOptions: {
        types: ['vue-macros/macros-global'],
        allowImportingTsExtensions: true,
      },
    },
  },
  devServer: {
    port: 5567,
  },
  nitro: {
    prerender: {
      crawlLinks: false,
      routes: ['/'],
    },
    devProxy: {
      '/baidu': {
        target: 'https://api.fanyi.baidu.com/api/trans/vip/translate',
        changeOrigin: true,
      },
    },
  },
})
