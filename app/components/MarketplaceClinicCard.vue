<script setup lang="ts">
import type { ClinicConfig } from '~/composables/useMarketplaceApi'

const props = withDefaults(
  defineProps<{
    clinic: ClinicConfig
    servicesCount?: number
  }>(),
  { servicesCount: 0 }
)

const theme = computed(() => props.clinic.theme_config as Record<string, string> | undefined)
const brand = computed(() => theme.value?.brandColor || '#009aaa')
const accent = computed(() => theme.value?.accentColor || '#f97316')
const landing = computed(() => props.clinic.landing_config as Record<string, unknown> | undefined)
const title = computed(() => String(landing.value?.title || props.clinic.clinic_slug))
const subtitle = computed(() => {
  const d = landing.value?.description
  return d ? String(d) : ''
})
const servicesCount = computed(() => props.servicesCount)
</script>

<template>
  <NuxtLink
    :to="`/marketplace/${clinic.clinic_slug}`"
    class="group block rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--mp-cyan)] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mp-cyan)]"
    :style="{ '--mp-cyan': brand, '--mp-accent': accent } as Record<string, string>"
  >
    <div class="flex items-start gap-4">
      <div
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-md transition-transform group-hover:scale-105"
        :style="{ background: `linear-gradient(135deg, ${brand}, ${accent})` }"
      >
        {{ title.charAt(0) }}
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-lg font-bold text-slate-900 transition-colors group-hover:text-[var(--mp-cyan)]">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="mt-1 line-clamp-2 text-sm text-slate-600">
          {{ subtitle }}
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
          >
            {{ servicesCount }} {{ servicesCount === 1 ? 'услуга' : servicesCount < 5 ? 'услуги' : 'услуг' }}
          </span>
          <span
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            :style="{ backgroundColor: brand }"
          >
            Онлайн-запись
          </span>
        </div>
      </div>
      <UIcon
        name="i-lucide-chevron-right"
        class="mt-1 size-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--mp-cyan)]"
      />
    </div>
  </NuxtLink>
</template>
