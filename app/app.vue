<script setup lang="ts">
const auth = useAuthSession()

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'ru'
  }
})

useSeoMeta({
  title: 'adm_superApp',
  description: 'Marketplace, CRM и MIS для медицинских организаций.'
})

const navigationItems = [
  { label: 'Главная', to: '/' },
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'Аккаунт', to: '/account' }
]

onMounted(async () => {
  await auth.init()
})
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-default text-highlighted">
      <UHeader class="border-b border-default">
        <template #left>
          <NuxtLink
            to="/"
            class="flex items-center gap-3"
          >
            <AppLogo class="h-6 w-auto shrink-0" />
            <span class="text-sm font-semibold">adm_superApp</span>
          </NuxtLink>

          <nav class="hidden items-center gap-2 md:flex">
            <UButton
              v-for="item in navigationItems"
              :key="item.to"
              :to="item.to"
              color="neutral"
              variant="ghost"
              size="sm"
            >
              {{ item.label }}
            </UButton>
          </nav>
        </template>

        <template #right>
          <UBadge
            :color="auth.isAuthenticated.value ? 'success' : 'neutral'"
            variant="subtle"
          >
            {{ auth.isAuthenticated.value ? 'Авторизован' : 'Гость' }}
          </UBadge>

          <UButton
            v-if="auth.isAuthenticated.value"
            to="/account"
            color="primary"
            variant="soft"
            icon="i-lucide-user-round"
          >
            {{ auth.displayName.value }}
          </UButton>

          <UButton
            v-else
            to="/login"
            color="primary"
            icon="i-lucide-log-in"
          >
            Войти
          </UButton>

          <UColorModeButton />
        </template>
      </UHeader>

      <UMain>
        <NuxtPage />
      </UMain>

      <USeparator icon="i-lucide-heart-pulse" />

      <UFooter class="border-t border-default">
        <template #left>
          <p class="text-sm text-muted">
            Единый Nuxt frontend для marketplace, CRM и MIS.
          </p>
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              to="/marketplace"
              color="neutral"
              variant="ghost"
              size="sm"
            >
              Открыть marketplace
            </UButton>
          </div>
        </template>
      </UFooter>
    </div>
  </UApp>
</template>
