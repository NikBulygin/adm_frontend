<script setup lang="ts">
const props = defineProps<{
  specialistId: string
  specialistName: string
  slotCount: number
  selected: boolean
  serviceLabel?: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const initials = computed(() => {
  const parts = props.specialistName.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? '?'
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase()
})
</script>

<template>
  <button
    type="button"
    class="w-full rounded-2xl border-2 bg-white p-5 text-left shadow-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mp-cyan,#009aaa)]"
    :class="selected
      ? 'border-[color:var(--mp-cyan,#009aaa)] shadow-lg ring-2 ring-[color:var(--mp-cyan,#009aaa)]/20'
      : 'border-slate-200 hover:-translate-y-0.5 hover:border-[color:var(--mp-cyan,#009aaa)]/50 hover:shadow-md'"
    @click="emit('select', specialistId)"
  >
    <div class="flex gap-4">
      <div
        class="mp-avatar flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-md"
      >
        {{ initials }}
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-base font-bold text-slate-900">
          {{ specialistName }}
        </h3>
        <p v-if="serviceLabel" class="mt-1 text-sm text-slate-600">
          {{ serviceLabel }}
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
          >
            <span class="size-1.5 rounded-full bg-emerald-500" />
            {{ slotCount }} {{ slotCount === 1 ? 'окно' : slotCount < 5 ? 'окна' : 'окон' }}
          </span>
          <span
            v-if="selected"
            class="text-xs font-semibold text-[color:var(--mp-cyan,#009aaa)]"
          >
            Выбран
          </span>
        </div>
      </div>
    </div>
  </button>
</template>

<style scoped>
.mp-avatar {
  background: linear-gradient(135deg, var(--mp-cyan, #009aaa), var(--mp-orange, #f97316));
}
</style>
