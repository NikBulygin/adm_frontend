<script setup lang="ts">
const { loadClinics, slugs } = useMarketplaceClinicCatalog()

const search = ref('')

const { data: items, pending, error, refresh } = await useAsyncData(
  'marketplace-clinic-catalog',
  () => loadClinics(),
  { default: () => [] }
)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) {
    return items.value ?? []
  }
  return (items.value ?? []).filter(({ clinic }) => {
    const landing = clinic.landing_config as Record<string, unknown> | undefined
    const title = String(landing?.title || clinic.clinic_slug).toLowerCase()
    const desc = landing?.description ? String(landing.description).toLowerCase() : ''
    return title.includes(q) || clinic.clinic_slug.toLowerCase().includes(q) || desc.includes(q)
  })
})
</script>

<template>
  <div class="mp-marketplace relative min-h-screen overflow-hidden">
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_srgb,var(--mp-cyan,#009aaa)_18%,transparent),transparent)]"
    />

    <div class="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <div class="text-center">
        <UBadge
          color="primary"
          variant="subtle"
          class="mb-4"
        >
          Онлайн-запись
        </UBadge>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Клиники
        </h1>
        <p class="mx-auto mt-3 max-w-2xl text-slate-600">
          Выберите клинику — затем специалиста и удобное время, как в демо medCalendar.
        </p>
      </div>

      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Поиск по названию или slug…"
          class="max-w-md"
        />
        <div class="flex flex-wrap gap-2 text-sm text-slate-500">
          <span>Slug из env:</span>
          <code class="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{{ slugs.join(', ') }}</code>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-refresh-cw"
            :loading="pending"
            @click="refresh()"
          >
            Обновить
          </UButton>
        </div>
      </div>

      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        title="Не удалось загрузить список"
        :description="error?.message ?? 'Ошибка загрузки'"
      />

      <div
        v-if="pending"
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-40 rounded-2xl"
        />
      </div>

      <div
        v-else-if="filtered.length"
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <MarketplaceClinicCard
          v-for="row in filtered"
          :key="row.clinic.id"
          :clinic="row.clinic"
          :services-count="row.servicesCount"
        />
      </div>

      <UCard v-else>
        <div class="py-10 text-center text-slate-600">
          <UIcon
            name="i-lucide-building-2"
            class="mx-auto size-12 text-slate-400"
          />
          <p class="mt-4 font-medium">
            Клиники не найдены
          </p>
          <p class="mt-1 text-sm">
            Проверьте <code class="rounded bg-slate-100 px-1">NUXT_PUBLIC_MARKETPLACE_CLINIC_SLUGS</code> и что API marketplace доступен.
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>
