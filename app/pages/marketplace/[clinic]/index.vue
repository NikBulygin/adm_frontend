<script setup lang="ts">
const route = useRoute()
const marketplaceApi = useMarketplaceApi()

const clinicSlug = computed(() => String(route.params.clinic || ''))

const { data, pending, error } = await useAsyncData(
  () => `marketplace-clinic-landing:${clinicSlug.value}`,
  async () => {
    const [clinic, services, specialists] = await Promise.all([
      marketplaceApi.getPublicClinic(clinicSlug.value),
      marketplaceApi.listPublicServices(clinicSlug.value),
      marketplaceApi.listPublicSpecialists(clinicSlug.value)
    ])

    return {
      clinic,
      services: services.items,
      specialists: specialists.items
    }
  },
  { watch: [clinicSlug] }
)

const themeVars = computed(() => {
  const t = data.value?.clinic?.theme_config as Record<string, string> | undefined
  return {
    '--mp-brand': t?.brandColor || '#0ea5e9',
    '--mp-accent': t?.accentColor || '#14b8a6'
  } as Record<string, string>
})

type LandingGalleryItem = { url: string, alt: string }

const landing = computed(() => {
  const cfg = data.value?.clinic?.landing_config as Record<string, unknown> | undefined
  return {
    clinicName: String(cfg?.clinic_name || cfg?.title || data.value?.clinic?.clinic_slug || 'Клиника'),
    logoUrl: String(cfg?.logo_url || ''),
    description: String(cfg?.description || 'Современная клиника с удобной онлайн-записью.'),
    gallery: (cfg?.gallery as LandingGalleryItem[] | undefined) || []
  }
})

const featuredDoctors = computed(() => (data.value?.specialists || []).slice(0, 3))
</script>

<template>
  <div class="mp-marketplace relative min-h-screen bg-white" :style="themeVars">
    <!-- subtle gradient backdrop -->
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_srgb,var(--mp-brand,#0ea5e9)_10%,transparent),transparent)]" />

    <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-10 sm:px-6 lg:px-8">
      <!-- error -->
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        title="Не удалось загрузить страницу клиники"
        :description="error.message"
      />

      <!-- skeleton -->
      <div v-if="pending" class="flex flex-col gap-10">
        <div class="flex items-center gap-5">
          <USkeleton class="size-20 rounded-2xl" />
          <div class="flex-1 space-y-3">
            <USkeleton class="h-8 w-64 rounded-lg" />
            <USkeleton class="h-5 w-96 rounded-lg" />
          </div>
        </div>
        <USkeleton class="h-80 rounded-3xl" />
      </div>

      <template v-else-if="data">
        <!-- ─── HERO: logo + name + description ─── -->
        <section class="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          <div class="flex flex-1 flex-col gap-6">
            <div class="flex items-center gap-5">
              <div
                v-if="landing.logoUrl"
                class="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <img
                  :src="landing.logoUrl"
                  :alt="landing.clinicName"
                  class="size-16 object-contain"
                >
              </div>
              <div
                v-else
                class="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-(--mp-brand,#0ea5e9) to-(--mp-accent,#14b8a6) text-3xl font-bold text-white shadow-md"
              >
                {{ landing.clinicName.slice(0, 1) }}
              </div>

              <div class="min-w-0">
                <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  {{ landing.clinicName }}
                </h1>
                <UBadge color="neutral" variant="subtle" class="mt-2">
                  {{ clinicSlug }}
                </UBadge>
              </div>
            </div>

            <p class="max-w-2xl text-lg leading-8 text-slate-600">
              {{ landing.description }}
            </p>

            <div class="flex flex-wrap gap-3">
              <UButton :to="`/marketplace/${clinicSlug}/doctor`" size="xl" color="primary">
                Выбрать врача
              </UButton>
              <UButton :to="`/marketplace/${clinicSlug}/doctor`" size="xl" color="neutral" variant="soft">
                Посмотреть расписание
              </UButton>
            </div>
          </div>

          <!-- quick-info card -->
          <UCard class="w-full shrink-0 rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl lg:w-96">
            <div class="space-y-4">
              <div>
                <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Почему удобно
                </div>
                <h2 class="mt-2 text-2xl font-bold text-slate-900">
                  Онлайн-запись без звонка
                </h2>
              </div>
              <div class="grid gap-3">
                <div class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <span class="mr-2 font-semibold text-slate-900">1.</span>Выберите врача
                </div>
                <div class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <span class="mr-2 font-semibold text-slate-900">2.</span>Выберите свободное время
                </div>
                <div class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <span class="mr-2 font-semibold text-slate-900">3.</span>Подтвердите запись
                </div>
              </div>
            </div>
          </UCard>
        </section>

        <!-- ─── GALLERY CAROUSEL ─── -->
        <section v-if="landing.gallery.length" class="space-y-5">
          <h2 class="text-2xl font-bold text-slate-900">
            Фотографии клиники
          </h2>

          <UCarousel
            :items="landing.gallery"
            :ui="{
              item: 'basis-full md:basis-1/2 lg:basis-1/3',
              container: '-ms-4',
            }"
            arrows
            dots
            class="w-full"
          >
            <template #default="{ item }">
              <div class="ps-4">
                <div class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                  <img
                    :src="item.url"
                    :alt="item.alt"
                    class="aspect-16/10 w-full object-cover"
                    draggable="false"
                  >
                  <div class="px-4 py-3 text-sm font-medium text-slate-700">
                    {{ item.alt }}
                  </div>
                </div>
              </div>
            </template>
          </UCarousel>
        </section>

        <!-- ─── FEATURED DOCTORS ─── -->
        <section class="space-y-5">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-2xl font-bold text-slate-900">
                Врачи клиники
              </h2>
              <p class="mt-1 text-slate-600">
                Популярные специалисты, доступные для онлайн-записи.
              </p>
            </div>
            <UButton :to="`/marketplace/${clinicSlug}/doctor`" color="neutral" variant="soft">
              Все врачи
            </UButton>
          </div>

          <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <MarketplaceDoctorCard
              v-for="doctor in featuredDoctors"
              :key="doctor.id"
              :clinic-slug="clinicSlug"
              :specialist="doctor"
            />
          </div>
        </section>

        <!-- ─── SERVICES ─── -->
        <section v-if="data.services.length" class="space-y-5">
          <h2 class="text-2xl font-bold text-slate-900">
            Услуги
          </h2>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="service in data.services"
              :key="service.id"
              class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="font-semibold text-slate-900">
                    {{ service.name }}
                  </div>
                  <div class="mt-1 text-sm text-slate-500">
                    {{ service.duration_minutes }} минут
                  </div>
                </div>
                <UBadge color="primary" variant="subtle" size="lg">
                  {{ service.price }} ₸
                </UBadge>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
