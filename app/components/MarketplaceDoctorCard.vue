<script setup lang="ts">
import type { MarketplaceSpecialist } from '~/composables/useMarketplaceApi'

const props = defineProps<{
  clinicSlug: string
  specialist: MarketplaceSpecialist
}>()

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Нет свободных слотов'
  }

  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const initials = computed(() => {
  const parts = props.specialist.full_name.trim().split(/\s+/)
  return `${parts[0]?.[0] ?? 'В'}${parts[1]?.[0] ?? ''}`.toUpperCase()
})
</script>

<template>
  <UCard class="h-full rounded-2xl border border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
    <div class="flex h-full flex-col gap-4">
      <div class="flex items-start gap-4">
        <div class="flex size-15 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-(--mp-cyan,#009aaa) to-(--mp-orange,#f97316) text-lg font-bold text-white shadow-md">
          {{ initials }}
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-bold text-slate-900">
            {{ specialist.full_name }}
          </h3>
          <p class="mt-1 line-clamp-3 text-sm text-slate-600">
            {{ specialist.description || 'Специалист клиники.' }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="service in specialist.services.slice(0, 3)"
          :key="service.id"
          color="neutral"
          variant="subtle"
        >
          {{ service.name }}
        </UBadge>
      </div>

      <div class="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Ближайшее окно
        </div>
        <div class="mt-1 font-medium">
          {{ formatDateTime(specialist.next_available_at) }}
        </div>
      </div>

      <div class="mt-auto flex gap-3">
        <UButton
          :to="`/marketplace/${clinicSlug}/doctor/${specialist.short_id}`"
          color="primary"
          class="flex-1 justify-center"
        >
          Подробнее
        </UButton>
      </div>
    </div>
  </UCard>
</template>
