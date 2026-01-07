// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // Enable SPA mode (no SSR)
  ssr: false,
  
  // Configure modules
  modules: ['@pinia/nuxt'],
  
  // App configuration
  app: {
    baseURL: '/v2/',
    head: {
      title: 'AoE2 Civbuilder',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Create your own Age of Empires 2 custom civilizations and generate mods to play with them in-game!' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/v2/img/kraken_logo_circular.png' }
      ]
    }
  },
  
  // Build configuration
  nitro: {
    output: {
      dir: '../../.output-nuxt'
    },
    devProxy: { // https://github.com/nuxt/nuxt/issues/23832 <- fix for `Restarting Nuxt due to error: Error: read ECONNRESET` ; https://github.com/nuxt/nuxt/issues/32669
      host: 'localhost',
    },
  },
  
  // Runtime config for API endpoints
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '',
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || ''
    }
  },
  
  // CSS configuration
  css: [],
  
  // Vite configuration
  vite: {
    server: {
      port: 3000,
      proxy: { // https://vite.dev/config/server-options#server-proxy
        // Proxy API requests to the backend server during development.
        // We proxy both root paths and `/v2`-prefixed paths. For `/v2/*`
        // we rewrite the path so the backend receives the expected route.
        '^/create': {
          target: 'http://localhost:4000',
          changeOrigin: true
        },

        // Backend endpoints used by legacy forms — forward to backend
        '^/join': {
          target: 'http://localhost:4000',
          changeOrigin: true
        },
        '^/setCookie': {
          target: 'http://localhost:4000',
          changeOrigin: true
        },
        // `/v2/download` intentionally left unproxied so SPA can handle
        // client-side navigation; use runtimeConfig `apiBase` for API calls.
        '^/download': {
          target: 'http://localhost:4000',
          changeOrigin: true
        },
        // Note: do NOT proxy frontend SPA routes like `/v2/draft/create`.
        // Only proxy static assets under `/v2` below.
        // do not proxy `/v2/draft` — it's a Nuxt page route that must
        // be served by the dev server on reload.
        '^/draft': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
        // TODO investigate! draft with ID is not working `http://localhost:4000/draft/103240973857385` because if i add a glob like `/draft/*` it also forwards v2 which makes no sense
        '^/draft/.*': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
        '^/api/draft/.*': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
        

        // socket.io proxied at root `/socket.io` only; avoid `/v2/socket.io`.
        '^/socket.io.*': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          ws: true
        },
        // Also proxy socket.io under `/v2` app base so pages using `/v2/socket.io` work.
        //'/v2/socket.io': {
        //  target: 'http://localhost:4000',
        //  changeOrigin: true,
        //  ws: true,
        //  rewrite: (path) => path.replace(/^\/v2/, '')
        //},

        // CHANGELOG may be requested at `/CHANGELOG.md` or under the app base `/v2/CHANGELOG.md`.
        // '/CHANGELOG.md': {
        //   target: 'http://localhost:4000',
        //   changeOrigin: true
        // },
        // UI v2 requests this path
        '^/v2/CHANGELOG.md': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/v2/, '')
        },
        
        '^/v2/vanillaFiles': {
          target: 'http://localhost:4000',
          changeOrigin: true
        },

        // Techtree static assets used by legacy pages. Proxy both `/aoe2techtree` and `/v2/aoe2techtree`.
        '^/aoe2techtree': {
          target: 'http://localhost:4000',
          changeOrigin: true
        },
        // mostly it uses shared root
        //'/v2/aoe2techtree': {
        //  target: 'http://localhost:4000',
        //  changeOrigin: true,
        //  rewrite: (path) => path.replace(/^\/v2/, '')
        //}
      }
    }
  }
})
