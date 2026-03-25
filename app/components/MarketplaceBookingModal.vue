<script setup lang="ts">
import type { AvailabilitySlot, MarketplaceService } from '~/composables/useMarketplaceApi'

type BookingForm = {
  first_name: string
  last_name: string
  age: number | null
  phone: string
  email: string
  iin: string
  service_id: string
}

type AuthProfile = {
  email?: string | null
  phone?: string | null
  first_name?: string | null
  last_name?: string | null
  age?: number | null
  iin?: string | null
}

const props = defineProps<{
  open: boolean
  selectedSlot: AvailabilitySlot | null
  services: MarketplaceService[]
  loading?: boolean
  isAuthenticated?: boolean
  authProfile?: AuthProfile | null
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: BookingForm]
}>()

const step = ref<1 | 2>(1)

const form = reactive<BookingForm>({
  first_name: '',
  last_name: '',
  age: null,
  phone: '',
  email: '',
  iin: '',
  service_id: ''
})

const steps = [
  { num: 1 as const, label: 'Визит' },
  { num: 2 as const, label: 'Пациент' }
]

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    return
  }
  step.value = 1
  form.phone = props.authProfile?.phone || ''
  form.email = props.authProfile?.email || ''
  form.first_name = props.authProfile?.first_name || ''
  form.last_name = props.authProfile?.last_name || ''
  form.age = props.authProfile?.age ?? null
  form.iin = props.authProfile?.iin || ''
  form.service_id = props.services[0]?.id || ''
})

watch(() => props.services, (services) => {
  if (!form.service_id && services.length > 0) {
    form.service_id = services[0]?.id || ''
  }
}, { immediate: true })

const serviceSelectItems = computed(() =>
  props.services.map((s) => ({
    label: `${s.name} · ${s.duration_minutes} мин · ${s.price}`,
    value: s.id
  }))
)

const requiredProfileFields = computed(() => [
  { key: 'first_name', label: 'Имя', missing: !form.first_name.trim() },
  { key: 'last_name', label: 'Фамилия', missing: !form.last_name.trim() },
  { key: 'age', label: 'Возраст', missing: !form.age || form.age <= 0 },
  { key: 'phone', label: 'Телефон', missing: !form.phone.trim() },
  { key: 'iin', label: 'ИИН', missing: !form.iin.trim() }
])

const profileComplete = computed(() => requiredProfileFields.value.every((field) => !field.missing))
const canStep1 = computed(() => Boolean(props.selectedSlot && form.service_id))

function formatSlotDate(value?: string) {
  if (!value) {
    return ''
  }
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatTime(value?: string) {
  if (!value) {
    return ''
  }
  return new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function nextFromStep1() {
  if (canStep1.value) {
    step.value = 2
  }
}

function submit() {
  emit('submit', {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    age: form.age,
    phone: form.phone.trim(),
    email: form.email.trim(),
    iin: form.iin.trim(),
    service_id: form.service_id
  })
}

function goStep(n: 1 | 2) {
  if (n === 1) {
    step.value = 1
    return
  }
  if (canStep1.value) {
    step.value = 2
  }
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="!loading"
    @update:open="(value) => !value && emit('close')"
  >
    <template #content>
      <div class="flex max-h-[90vh] flex-col">
        <div class="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">
              Запись на приём
            </h2>
            <p class="mt-0.5 text-sm text-slate-500">
              {{ selectedSlot ? `${selectedSlot.specialist_name}, ${formatSlotDate(selectedSlot.starts_at)}` : 'Выберите время на странице врача' }}
            </p>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            :disabled="loading"
            @click="emit('close')"
          />
        </div>

        <div class="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-50 px-6 py-3">
          <button
            v-for="s in steps"
            :key="s.num"
            type="button"
            class="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all"
            :class="step === s.num
              ? 'bg-(--mp-cyan,#009aaa) text-white shadow-sm'
              : 'bg-slate-100 text-slate-500'"
            @click="goStep(s.num)"
          >
            <span class="flex size-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
              {{ s.num }}
            </span>
            {{ s.label }}
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-6">
          <div v-if="step === 1" class="space-y-6">
            <div
              v-if="selectedSlot"
              class="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-5"
            >
              <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Выбранное время
              </div>
              <div class="mt-2 text-xl font-bold text-slate-900">
                {{ formatTime(selectedSlot.starts_at) }}
              </div>
              <div class="mt-1 text-sm text-slate-600">
                {{ formatSlotDate(selectedSlot.starts_at) }}
              </div>
              <div class="mt-4 text-sm text-slate-700">
                {{ selectedSlot.specialist_name }}
              </div>
            </div>

            <UFormField label="Услуга">
              <USelect
                v-model="form.service_id"
                :items="serviceSelectItems"
                value-key="value"
                label-key="label"
                class="w-full"
              />
            </UFormField>

            <div class="flex flex-wrap justify-end gap-3">
              <UButton color="neutral" variant="ghost" :disabled="loading" @click="emit('close')">
                Отмена
              </UButton>
              <UButton :disabled="!canStep1" icon="i-lucide-arrow-right" @click="nextFromStep1()">
                Далее
              </UButton>
            </div>
          </div>

          <div v-else class="space-y-5">
            <div class="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div class="font-medium">
                {{ selectedSlot?.specialist_name }} · {{ formatTime(selectedSlot?.starts_at) }}
              </div>
              <div class="mt-1 text-slate-600">
                {{ form.email || 'Email не указан' }}
              </div>
            </div>

            <UAlert
              v-if="isAuthenticated && profileComplete"
              color="success"
              variant="soft"
              title="Данные пациента уже заполнены"
              description="Мы используем сохранённый профиль для оформления записи."
            />

            <div
              v-if="!isAuthenticated || !profileComplete"
              class="grid gap-4 sm:grid-cols-2"
            >
              <UFormField v-if="!isAuthenticated || !form.first_name.trim()" label="Имя">
                <UInput v-model="form.first_name" placeholder="Иван" />
              </UFormField>

              <UFormField v-if="!isAuthenticated || !form.last_name.trim()" label="Фамилия">
                <UInput v-model="form.last_name" placeholder="Иванов" />
              </UFormField>

              <UFormField v-if="!isAuthenticated || !form.age || form.age <= 0" label="Возраст">
                <UInput v-model="form.age" type="number" min="1" placeholder="30" />
              </UFormField>

              <UFormField v-if="!isAuthenticated || !form.phone.trim()" label="Телефон">
                <UInput v-model="form.phone" placeholder="+7 777 000 00 00" />
              </UFormField>

              <UFormField class="sm:col-span-2" label="Email">
                <UInput v-model="form.email" type="email" placeholder="patient@example.com" />
              </UFormField>

              <UFormField v-if="!isAuthenticated || !form.iin.trim()" class="sm:col-span-2" label="ИИН">
                <UInput v-model="form.iin" placeholder="990101300000" />
              </UFormField>
            </div>

            <div
              v-else
              class="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
            >
              <div><span class="font-medium">Пациент:</span> {{ form.first_name }} {{ form.last_name }}</div>
              <div class="mt-1"><span class="font-medium">Возраст:</span> {{ form.age }}</div>
              <div class="mt-1"><span class="font-medium">Телефон:</span> {{ form.phone }}</div>
              <div class="mt-1"><span class="font-medium">ИИН:</span> {{ form.iin }}</div>
            </div>

            <div class="flex flex-wrap justify-end gap-3 pt-2">
              <UButton color="neutral" variant="ghost" :disabled="loading" icon="i-lucide-arrow-left" @click="step = 1">
                Назад
              </UButton>
              <UButton :loading="loading" icon="i-lucide-calendar-check" @click="submit">
                Подтвердить запись
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
