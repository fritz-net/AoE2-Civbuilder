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
    }
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
      proxy: {
        // Proxy API requests to the backend server during development
        '/create': {
          target: 'http://localhost:4000',
          changeOrigin: true
        },
        '/download': {
          target: 'http://localhost:4000',
          changeOrigin: true
        },
        '/draft': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          ws: true // Enable WebSocket proxying for socket.io
        },
        '/socket.io': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          ws: true
        },
        '/CHANGELOG.md': {
          target: 'http://localhost:4000',
          changeOrigin: true
        }
      }
    }
  }
})
