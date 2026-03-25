<script setup lang="ts">
const auth = useAuthSession()
const router = useRouter()
const route = useRoute()
const status = ref<'pending' | 'success' | 'error'>('pending')
const message = ref('Завершаем авторизацию через Google...')

onMounted(async () => {
  const ok = await auth.acceptGoogleRedirect(window.location.hash)
  window.history.replaceState({}, document.title, '/auth/google')

  if (!ok) {
    status.value = 'error'
    message.value = auth.lastError.value || 'Google authentication failed.'
    return
  }

  status.value = 'success'
  message.value = 'Google authentication complete. Redirecting...'
  await router.replace(String(route.query.redirect || '/account'))
})
</script>

<template>
  <div class="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4">
    <UCard class="w-full">
      <div class="flex flex-col items-center gap-4 py-6 text-center">
        <UIcon
          :name="status === 'success' ? 'i-lucide-badge-check' : status === 'error' ? 'i-lucide-circle-x' : 'i-lucide-loader-circle'"
          class="size-10"
          :class="status === 'pending' ? 'animate-spin' : ''"
        />

        <div class="space-y-1">
          <h1 class="text-xl font-semibold">
            Google sign-in
          </h1>
          <p class="text-sm text-muted">
            {{ message }}
          </p>
        </div>

        <UButton
          v-if="status === 'error'"
          to="/login"
          label="Back to login"
          color="neutral"
        />
      </div>
    </UCard>
  </div>
</template>
