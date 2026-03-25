<script setup lang="ts">
import type { AvailabilitySlot } from '~/composables/useMarketplaceApi'
import { CalendarDate, getLocalTimeZone, startOfMonth, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'

const props = withDefaults(
  defineProps<{
    dateStr: string
    datesWithSlots?: ReadonlySet<string>
    monthLoading?: boolean
    timeSlots: AvailabilitySlot[]
    specialistSelected: boolean
    selectedSlotId?: string | null
  }>(),
  {
    datesWithSlots: () => new Set<string>(),
    monthLoading: false,
    selectedSlotId: null
  }
)

const emit = defineEmits<{
  'update:dateStr': [value: string]
  viewMonthChange: [value: CalendarDate]
  selectSlot: [slot: AvailabilitySlot]
}>()

const tz = getLocalTimeZone()
const minDate = today(tz)

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toIso(c: CalendarDate) {
  return `${c.year}-${pad2(c.month)}-${pad2(c.day)}`
}

function toCal(iso: string) {
  const parts = iso.split('-').map(Number)
  const y = parts[0] ?? 1970
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  return new CalendarDate(y, m, d)
}

const selectedCal = shallowRef(toCal(props.dateStr))

watch(
  () => props.dateStr,
  (s) => {
    const c = toCal(s)
    if (c.compare(selectedCal.value) !== 0) {
      selectedCal.value = c
    }
  }
)

watch(selectedCal, (c) => {
  const iso = toIso(c)
  if (iso !== props.dateStr) {
    emit('update:dateStr', iso)
  }
})

const placeholderCal = ref(startOfMonth(toCal(props.dateStr)))

watch(
  () => props.dateStr,
  (s) => {
    const c = toCal(s)
    if (c.year !== placeholderCal.value.year || c.month !== placeholderCal.value.month) {
      placeholderCal.value = startOfMonth(c)
    }
  }
)

watch(
  placeholderCal,
  (ph) => {
    emit('viewMonthChange', ph as CalendarDate)
  },
  { immediate: true }
)

function isDateDisabled(d: DateValue) {
  const c = d as CalendarDate
  return c.compare(minDate) < 0
}

function dayKey(d: DateValue) {
  return toIso(d as CalendarDate)
}

function isCalendarDate(v: unknown): v is CalendarDate {
  return (
    v != null
    && typeof v === 'object'
    && 'year' in v
    && 'month' in v
    && 'day' in v
    && typeof (v as CalendarDate).compare === 'function'
  )
}

function onCalendarUpdate(v: unknown) {
  if (isCalendarDate(v)) {
    selectedCal.value = v
  }
}

function onPlaceholderUpdate(v: unknown) {
  if (isCalendarDate(v)) {
    placeholderCal.value = v
  }
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatSelectedHeading() {
  try {
    const parts = props.dateStr.split('-').map(Number)
    const y = parts[0] ?? 1970
    const m = parts[1] ?? 1
    const d = parts[2] ?? 1
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  } catch {
    return props.dateStr
  }
}
</script>

<template>
  <UCard
    class="overflow-hidden border-2 shadow-md ring-1 ring-[color:var(--mp-cyan,#009aaa)]/15"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="font-bold text-slate-900">
            Дата и время
          </h3>
          <p class="mt-1 text-sm text-slate-600">
            Выберите день в календаре, затем свободный час.
          </p>
        </div>
        <UBadge
          v-if="monthLoading"
          color="neutral"
          variant="subtle"
        >
          Загрузка…
        </UBadge>
      </div>
    </div>

    <div class="grid gap-6 p-5 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
      <div class="flex justify-center lg:justify-start">
        <div class="relative w-full max-w-[340px] rounded-xl border border-slate-100 bg-white p-2 shadow-inner">
          <UCalendar
            :model-value="selectedCal as unknown as DateValue"
            :placeholder="placeholderCal as unknown as DateValue"
            :is-date-disabled="isDateDisabled"
            :week-starts-on="1"
            color="primary"
            class="w-full"
            @update:model-value="onCalendarUpdate"
            @update:placeholder="onPlaceholderUpdate"
          >
            <template #day="{ day }">
              <div class="relative flex size-9 items-center justify-center">
                <span>{{ day.day }}</span>
                <span
                  v-if="datesWithSlots.has(dayKey(day))"
                  class="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[color:var(--mp-cyan,#009aaa)]"
                />
              </div>
            </template>
          </UCalendar>
        </div>
      </div>

      <div class="min-h-[200px] rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Свободное время
        </div>
        <div class="mt-1 text-sm font-medium text-slate-800">
          {{ formatSelectedHeading() }}
        </div>

        <template v-if="!specialistSelected">
          <div class="mt-8 flex flex-col items-center text-center text-slate-500">
            <UIcon
              name="i-lucide-user-round"
              class="size-10 opacity-60"
            />
            <p class="mt-3 text-sm">
              Сначала выберите специалиста выше — здесь появятся часы приёма.
            </p>
          </div>
        </template>

        <template v-else-if="monthLoading && timeSlots.length === 0">
          <div class="mt-6 flex flex-wrap gap-2">
            <USkeleton
              v-for="i in 6"
              :key="i"
              class="h-10 w-[5.5rem] rounded-full"
            />
          </div>
        </template>

        <template v-else-if="timeSlots.length">
          <div class="mt-4 flex flex-wrap gap-2">
            <UButton
              v-for="slot in timeSlots"
              :key="slot.id"
              :color="selectedSlotId === slot.id ? 'primary' : 'neutral'"
              :variant="selectedSlotId === slot.id ? 'solid' : 'outline'"
              size="md"
              class="min-w-[5.5rem] justify-center rounded-full font-semibold"
              @click="emit('selectSlot', slot)"
            >
              {{ formatTime(slot.starts_at) }}
            </UButton>
          </div>
        </template>

        <template v-else>
          <div class="mt-8 flex flex-col items-center text-center text-slate-500">
            <UIcon
              name="i-lucide-clock"
              class="size-10 opacity-60"
            />
            <p class="mt-3 text-sm">
              На эту дату нет свободных окон у выбранного специалиста.
            </p>
          </div>
        </template>
      </div>
    </div>
  </UCard>
</template>
