// https://nuxt.com/docs/api/configuration/nuxt-config
const env = (globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>
  }
}).process?.env ?? {}

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    gatewayInternalBase: env.GATEWAY_INTERNAL_BASE || 'http://gateway',
    public: {
      authApiBase: env.NUXT_PUBLIC_AUTH_API_BASE || '',
      marketplaceApiBase: env.NUXT_PUBLIC_MARKETPLACE_API_BASE || '/api/marketplace',
      marketplaceClinicSlugs: env.NUXT_PUBLIC_MARKETPLACE_CLINIC_SLUGS || 'demo-clinic'
    }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
