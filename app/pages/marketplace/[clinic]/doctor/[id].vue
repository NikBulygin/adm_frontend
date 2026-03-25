<script setup lang="ts">
import type { AvailabilitySlot } from '~/composables/useMarketplaceApi'
import { CalendarDate, endOfMonth, startOfMonth, today, getLocalTimeZone } from '@internationalized/date'

const route = useRoute()
const auth = useAuthSession()
const marketplaceApi = useMarketplaceApi()

const clinicSlug = computed(() => String(route.params.clinic || ''))
const shortId = computed(() => String(route.params.id || ''))

const { data, pending, error } = await useAsyncData(
  () => `marketplace-doctor-page:${clinicSlug.value}:${shortId.value}`,
  async () => {
    const [clinic, specialist, services] = await Promise.all([
      marketplaceApi.getPublicClinic(clinicSlug.value),
      marketplaceApi.getPublicSpecialist(clinicSlug.value, shortId.value),
      marketplaceApi.listPublicServices(clinicSlug.value)
    ])

    return {
      clinic,
      specialist,
      services: services.items
    }
  },
  { watch: [clinicSlug, shortId] }
)

const monthSlots = ref<AvailabilitySlot[]>([])
const monthLoading = ref(false)
const loadedMonthKey = ref<string | null>(null)
const bookingPending = ref(false)
const bookingError = ref<string | null>(null)
const bookingSuccess = ref<string | null>(null)
const bookingOpen = ref(false)
const selectedSlot = ref<AvailabilitySlot | null>(null)

const tz = getLocalTimeZone()
const todayCal = today(tz)
const selectedDate = ref(`${todayCal.year}-${String(todayCal.month).padStart(2, '0')}-${String(todayCal.day).padStart(2, '0')}`)
const calendarViewMonth = shallowRef(startOfMonth(todayCal))

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function isoFromCal(c: CalendarDate) {
  return `${c.year}-${pad2(c.month)}-${pad2(c.day)}`
}

function slotLocalDayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

const datesWithSlots = computed(() => {
  const set = new Set<string>()
  for (const s of monthSlots.value) {
    set.add(slotLocalDayKey(s.starts_at))
  }
  return set
})

const timeSlots = computed(() => monthSlots.value.filter((slot) => slotLocalDayKey(slot.starts_at) === selectedDate.value))
const firstTimeSlot = computed(() => timeSlots.value[0] ?? null)

const themeVars = computed(() => {
  const t = data.value?.clinic?.theme_config as Record<string, string> | undefined
  return {
    '--mp-cyan': t?.brandColor || '#009aaa',
    '--mp-orange': t?.accentColor || '#f97316'
  } as Record<string, string>
})

const specialistUUID = computed(() => data.value?.specialist?.id || '')

async function loadMonthForView(ph: CalendarDate) {
  const key = `${ph.year}-${ph.month}`
  if (loadedMonthKey.value === key) return

  monthLoading.value = true
  try {
    const from = isoFromCal(startOfMonth(ph))
    const to = isoFromCal(endOfMonth(ph))
    const res = await marketplaceApi.listAvailabilityRange(clinicSlug.value, from, to, specialistUUID.value)
    monthSlots.value = res.items
    loadedMonthKey.value = key
  } finally {
    monthLoading.value = false
  }
}

function onViewMonthChange(ph: CalendarDate) {
  calendarViewMonth.value = ph
  void loadMonthForView(ph)
}

async function refreshSlots() {
  loadedMonthKey.value = null
  await loadMonthForView(calendarViewMonth.value)
}

watch([clinicSlug, shortId, specialistUUID], async () => {
  selectedSlot.value = null
  monthSlots.value = []
  loadedMonthKey.value = null
  if (specialistUUID.value) {
    await loadMonthForView(calendarViewMonth.value)
  }
}, { immediate: true })

watch(selectedDate, () => {
  selectedSlot.value = null
})

function openBooking(slot: AvailabilitySlot) {
  selectedSlot.value = slot
  bookingError.value = null
  bookingSuccess.value = null
  bookingOpen.value = true
}

async function submitBooking(payload: {
  first_name: string
  last_name: string
  age: number | null
  phone: string
  email: string
  iin: string
  service_id: string
}) {
  if (!selectedSlot.value) {
    bookingError.value = 'Сначала выберите слот.'
    return
  }

  if (!payload.first_name || !payload.last_name || !payload.phone || !payload.service_id || !payload.age || payload.age <= 0 || !payload.iin) {
    bookingError.value = 'Заполните обязательные данные пациента.'
    return
  }

  bookingPending.value = true
  bookingError.value = null

  try {
    if (auth.isAuthenticated.value) {
      await auth.updateProfile({
        phone: payload.phone,
        first_name: payload.first_name,
        last_name: payload.last_name,
        age: payload.age,
        iin: payload.iin
      })
    }

    await marketplaceApi.createAppointment({
      clinic_slug: clinicSlug.value,
      slot_id: selectedSlot.value.id,
      service_id: payload.service_id,
      first_name: payload.first_name,
      last_name: payload.last_name,
      age: payload.age,
      phone: payload.phone,
      email: payload.email || undefined,
      iin: payload.iin || undefined,
      patient_id: auth.me.value?.id || undefined,
      created_by_user_id: auth.me.value?.id || undefined,
      source: auth.isAuthenticated.value ? 'patient_portal' : 'public_landing'
    })

    bookingOpen.value = false
    bookingSuccess.value = 'Запись успешно создана.'
    await refreshSlots()
  } catch (err) {
    bookingError.value = (err as Error).message
  } finally {
    bookingPending.value = false
  }
}
</script>

<template>
  <div class="mp-marketplace relative min-h-screen" :style="themeVars">
    <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        title="Не удалось загрузить страницу врача"
        :description="error.message"
      />

      <div v-if="pending" class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <USkeleton class="h-80 rounded-3xl" />
        <USkeleton class="h-80 rounded-3xl" />
      </div>

      <template v-else-if="data">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <UButton :to="`/marketplace/${clinicSlug}/doctor`" color="neutral" variant="soft">
            Ко всем врачам
          </UButton>
          <UButton color="neutral" variant="soft" :loading="monthLoading" @click="refreshSlots()">
            Обновить расписание
          </UButton>
        </div>

        <section class="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <UCard class="rounded-3xl border border-slate-200 shadow-sm">
            <div class="flex flex-col gap-5 sm:flex-row">
              <div class="flex size-24 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-(--mp-cyan,#009aaa) to-(--mp-orange,#f97316) text-2xl font-bold text-white shadow-md">
                {{ data.specialist.full_name.slice(0, 1) }}
              </div>
              <div class="min-w-0 flex-1">
                <h1 class="text-3xl font-bold tracking-tight text-slate-900">
                  {{ data.specialist.full_name }}
                </h1>
                <p class="mt-3 text-base leading-7 text-slate-600">
                  {{ data.specialist.description || 'Специалист клиники.' }}
                </p>
                <div class="mt-4 flex flex-wrap gap-2">
                  <UBadge
                    v-for="service in data.specialist.services"
                    :key="service.id"
                    color="neutral"
                    variant="subtle"
                  >
                    {{ service.name }}
                  </UBadge>
                </div>
              </div>
            </div>
          </UCard>

          <UCard class="rounded-3xl border border-slate-200 bg-slate-50/70">
            <div class="space-y-4">
              <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Онлайн-запись
              </div>
              <p class="text-sm text-slate-600">
                Выберите день и свободное время ниже. Если вы авторизованы, недостающие данные пациента будут сохранены в профиле автоматически.
              </p>
              <UButton
                v-if="firstTimeSlot"
                color="primary"
                size="lg"
                @click="firstTimeSlot && openBooking(firstTimeSlot)"
              >
                Записаться
              </UButton>
            </div>
          </UCard>
        </section>

        <UAlert
          v-if="bookingSuccess"
          color="success"
          variant="soft"
          title="Запись создана"
          :description="bookingSuccess"
        />

        <UAlert
          v-if="bookingError"
          color="error"
          variant="soft"
          title="Не удалось создать запись"
          :description="bookingError"
        />

        <MarketplaceSlotCalendar
          v-model:date-str="selectedDate"
          :dates-with-slots="datesWithSlots"
          :month-loading="monthLoading"
          :time-slots="timeSlots"
          :specialist-selected="true"
          :selected-slot-id="selectedSlot?.id ?? null"
          @view-month-change="onViewMonthChange"
          @select-slot="openBooking"
        />

        <MarketplaceBookingModal
          :open="bookingOpen"
          :selected-slot="selectedSlot"
          :services="data.services"
          :loading="bookingPending"
          :is-authenticated="auth.isAuthenticated.value"
          :auth-profile="auth.me.value"
          @close="bookingOpen = false"
          @submit="submitBooking"
        />
      </template>
    </div>
  </div>
</template>
