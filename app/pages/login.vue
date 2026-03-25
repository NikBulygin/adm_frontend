<script setup lang="ts">
const auth = useAuthSession()
const route = useRoute()
const router = useRouter()

const mode = ref<'login' | 'register'>('login')
const form = reactive({
  email: '',
  phone: '',
  password: ''
})

const formTitle = computed(() => mode.value === 'login' ? 'Вход' : 'Регистрация')
const submitLabel = computed(() => mode.value === 'login' ? 'Войти' : 'Создать аккаунт')

async function submit() {
  const payload = {
    email: form.email || undefined,
    phone: form.phone || undefined,
    password: form.password
  }

  if (mode.value === 'login') {
    await auth.login(payload)
  } else {
    await auth.register(payload)
  }

  await router.replace(String(route.query.redirect || '/account'))
}
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-14rem)] w-full max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
    <div class="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <UCard class="order-2 lg:order-1">
        <template #header>
          <div>
            <h1 class="text-2xl font-semibold">
              {{ formTitle }}
            </h1>
            <p class="mt-1 text-sm text-muted">
              Используется общий `auth`-сервис, поэтому эта сессия будет доступна по всему frontend.
            </p>
          </div>
        </template>

        <form
          class="space-y-4"
          @submit.prevent="submit"
        >
          <UAlert
            v-if="auth.lastError.value"
            color="error"
            variant="soft"
            title="Ошибка авторизации"
            :description="auth.lastError.value"
          />

          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Email">
              <UInput
                v-model="form.email"
                type="email"
                placeholder="doctor@clinic.kz"
              />
            </UFormField>

            <UFormField label="Телефон">
              <UInput
                v-model="form.phone"
                placeholder="+7 777 000 00 00"
              />
            </UFormField>
          </div>

          <UFormField label="Пароль">
            <UInput
              v-model="form.password"
              type="password"
              placeholder="Введите пароль"
            />
          </UFormField>

          <div class="flex flex-wrap gap-3">
            <UButton
              type="submit"
              :loading="auth.pending.value"
              icon="i-lucide-log-in"
            >
              {{ submitLabel }}
            </UButton>

            <UButton
              type="button"
              color="neutral"
              variant="soft"
              :disabled="auth.pending.value"
              icon="i-simple-icons-google"
              @click="auth.startGoogleAuth()"
            >
              Войти через Google
            </UButton>

            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              @click="mode = mode === 'login' ? 'register' : 'login'"
            >
              {{ mode === 'login' ? 'Нужна регистрация?' : 'Уже есть аккаунт?' }}
            </UButton>
          </div>
        </form>
      </UCard>

      <UCard class="order-1 lg:order-2">
        <template #header>
          <h2 class="text-lg font-semibold">
            Что даёт глобальная авторизация
          </h2>
        </template>

        <ul class="space-y-3 text-sm text-muted">
          <li class="flex gap-3">
            <UIcon
              name="i-lucide-check"
              class="mt-0.5 size-4 shrink-0 text-primary"
            />
            Единая сессия для marketplace, а позже и для CRM/MIS кабинетов.
          </li>
          <li class="flex gap-3">
            <UIcon
              name="i-lucide-check"
              class="mt-0.5 size-4 shrink-0 text-primary"
            />
            Автоматический `refresh` и инициализация сессии при загрузке приложения.
          </li>
          <li class="flex gap-3">
            <UIcon
              name="i-lucide-check"
              class="mt-0.5 size-4 shrink-0 text-primary"
            />
            Готовая база для protected routes и ролей `clinic_admin`, `doctor`, `sales_manager`.
          </li>
        </ul>
      </UCard>
    </div>
  </div>
</template>
