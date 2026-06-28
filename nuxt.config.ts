// https://nuxt.com/docs/api/configuration/nuxt-config
const nuxtConfig = {
  modules: ['@nuxt/eslint', '@nuxt/ui', '@pinia/nuxt'],

  runtimeConfig: {
    public: {
      centrifugoUrl:
        process.env.CENTRIFUGO_URL
        || 'ws://localhost:6969/connection/websocket',
      apiUrl:
        process.env.API_URL || 'https://everlasting-api.ourmoment.my.id/api'
    }
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&display=swap'
        }
      ]
    }
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15' as const,

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
}

export default nuxtConfig
