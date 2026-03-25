<script setup lang="ts">
const auth = useAuthSession()

const quickLinks = computed(() => [
  {
    title: 'Marketplace',
    description: 'Публичная витрина клиники, слоты и запись к специалисту.',
    to: '/marketplace'
  },
  {
    title: 'Авторизация',
    description: 'Глобальная auth-сессия для кабинетов и protected routes.',
    to: auth.isAuthenticated.value ? '/account' : '/login'
  }
])
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
    <UPageHero
      title="adm_superApp"
      description="Единый frontend для медицинского marketplace, CRM и MIS. Сейчас подготовлен первый срез: глобальная авторизация и публичные marketplace-страницы."
      :links="[{
        label: 'Открыть marketplace',
        to: '/marketplace',
        icon: 'i-lucide-stethoscope'
      }, {
        label: auth.isAuthenticated.value ? 'Перейти в аккаунт' : 'Войти',
        to: auth.isAuthenticated.value ? '/account' : '/login',
        color: 'neutral',
        variant: 'subtle',
        icon: auth.isAuthenticated.value ? 'i-lucide-user-round' : 'i-lucide-log-in'
      }]"
    />

    <div class="grid gap-4 md:grid-cols-2">
      <UCard
        v-for="item in quickLinks"
        :key="item.to"
      >
        <div class="space-y-3">
          <div>
            <h2 class="text-lg font-semibold">
              {{ item.title }}
            </h2>
            <p class="mt-1 text-sm text-muted">
              {{ item.description }}
            </p>
          </div>

          <UButton
            :to="item.to"
            color="primary"
            variant="soft"
          >
            Открыть
          </UButton>
        </div>
      </UCard>
    </div>

    <UPageSection
      title="Что уже заведено"
      description="Фундамент для дальнейшей реализации по плану `Plan/`."
      :features="[{
        icon: 'i-lucide-shield-check',
        title: 'Глобальная auth-сессия',
        description: 'Bearer token, refresh flow, Google callback и защищённые маршруты во всём приложении.'
      }, {
        icon: 'i-lucide-calendar-days',
        title: 'Marketplace booking flow',
        description: 'Публичная страница клиники, загрузка слотов, выбор услуги и запись через API marketplace.'
      }, {
        icon: 'i-lucide-layout-dashboard',
        title: 'Единый shell приложения',
        description: 'Общий header, account page и база для дальнейших CRM/MIS кабинетов.'
      }]"
    />
  </div>
</template>
