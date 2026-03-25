<script setup lang="ts">
const route = useRoute()
const marketplaceApi = useMarketplaceApi()

const clinicSlug = computed(() => String(route.params.clinic || ''))
const search = ref('')
const serviceId = ref('_all')
const activeServiceId = computed(() => serviceId.value === '_all' ? '' : serviceId.value)

const { data: clinic } = await useAsyncData(
  () => `marketplace-clinic-meta:${clinicSlug.value}`,
  () => marketplaceApi.getPublicClinic(clinicSlug.value),
  { watch: [clinicSlug] }
)

const { data: services } = await useAsyncData(
  () => `marketplace-services:${clinicSlug.value}`,
  async () => (await marketplaceApi.listPublicServices(clinicSlug.value)).items,
  { watch: [clinicSlug], default: () => [] }
)

const { data: specialists, pending, error, refresh } = await useAsyncData(
  () => `marketplace-specialists:${clinicSlug.value}:${search.value}:${activeServiceId.value}`,
  async () => (await marketplaceApi.listPublicSpecialists(clinicSlug.value, {
    search: search.value,
    serviceId: activeServiceId.value || undefined
  })).items,
  { watch: [clinicSlug, search, activeServiceId], default: () => [] }
)

const serviceItems = computed(() => [
  { label: 'Все услуги', value: '_all' },
  ...services.value.map((service) => ({
    label: service.name,
    value: service.id
  }))
])
</script>

<template>
  <div class="mp-marketplace relative min-h-screen">
    <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <UBadge color="neutral" variant="subtle">
            {{ clinicSlug }}
          </UBadge>
          <h1 class="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Врачи клиники
          </h1>
          <p class="mt-2 max-w-3xl text-slate-600">
            {{ (clinic?.landing_config as Record<string, unknown> | undefined)?.description || 'Выберите специалиста и перейдите на его страницу для записи.' }}
          </p>
        </div>

        <UButton :to="`/marketplace/${clinicSlug}`" color="neutral" variant="soft">
          На лендинг клиники
        </UButton>
      </div>

      <div class="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_280px_auto]">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Поиск по имени врача или описанию"
        />
        <USelect
          v-model="serviceId"
          :items="serviceItems"
          value-key="value"
          label-key="label"
        />
        <UButton color="neutral" variant="soft" :loading="pending" @click="refresh()">
          Обновить
        </UButton>
      </div>

      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        title="Ошибка загрузки"
        :description="error.message"
      />

      <div v-if="pending && !specialists.length" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <USkeleton v-for="i in 6" :key="i" class="h-64 rounded-2xl" />
      </div>

      <div v-else-if="specialists.length" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <MarketplaceDoctorCard
          v-for="doctor in specialists"
          :key="doctor.id"
          :clinic-slug="clinicSlug"
          :specialist="doctor"
        />
      </div>

      <div v-else class="py-16 text-center text-slate-500">
        Нет врачей по выбранным фильтрам.
      </div>
    </div>
  </div>
</template>
