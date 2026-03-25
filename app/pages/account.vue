<script setup lang="ts">
definePageMeta({
  middleware: ['require-auth']
})

const auth = useAuthSession()

const roles = computed(() => auth.me.value?.roles ?? [])
const permissions = computed(() => auth.me.value?.permissions ?? [])
const identities = computed(() => auth.me.value?.provider_identities ?? [])

onMounted(async () => {
  await auth.init()
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">
          Личный кабинет
        </h1>
        <p class="mt-1 text-sm text-muted">
          Профиль загружается через защищённый `GET /me`.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-refresh-cw"
          :loading="auth.pending.value"
          @click="auth.fetchMe()"
        >
          Обновить профиль
        </UButton>

        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-log-out"
          @click="auth.logout()"
        >
          Выйти
        </UButton>
      </div>
    </div>

    <UCard v-if="auth.me.value">
      <template #header>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold">
              {{ auth.displayName.value }}
            </h2>
            <p class="text-sm text-muted">
              {{ auth.me.value.login_provider }} / {{ auth.me.value.login_method }}
            </p>
          </div>

          <UBadge
            color="success"
            variant="subtle"
          >
            {{ auth.me.value.status }}
          </UBadge>
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="rounded-xl border border-default p-4">
          <div class="text-xs uppercase tracking-wide text-muted">
            User ID
          </div>
          <div class="mt-2 break-all text-sm font-medium">
            {{ auth.me.value.id }}
          </div>
        </div>

        <div class="rounded-xl border border-default p-4">
          <div class="text-xs uppercase tracking-wide text-muted">
            Email
          </div>
          <div class="mt-2 break-all text-sm font-medium">
            {{ auth.me.value.email || 'not set' }}
          </div>
        </div>

        <div class="rounded-xl border border-default p-4">
          <div class="text-xs uppercase tracking-wide text-muted">
            Phone
          </div>
          <div class="mt-2 text-sm font-medium">
            {{ auth.me.value.phone || 'not set' }}
          </div>
        </div>

        <div class="rounded-xl border border-default p-4">
          <div class="text-xs uppercase tracking-wide text-muted">
            Access token expires
          </div>
          <div class="mt-2 text-sm font-medium">
            {{ auth.expiresAt.value || 'unknown' }}
          </div>
        </div>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 class="mb-3 text-sm font-semibold">
            Роли
          </h3>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="role in roles"
              :key="role.id"
              color="primary"
              variant="subtle"
            >
              {{ role.code }}
            </UBadge>
          </div>
        </div>

        <div>
          <h3 class="mb-3 text-sm font-semibold">
            Permissions
          </h3>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="permission in permissions"
              :key="permission"
              color="neutral"
              variant="soft"
            >
              {{ permission }}
            </UBadge>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <h3 class="mb-3 text-sm font-semibold">
          Provider identities
        </h3>
        <div class="grid gap-3">
          <div
            v-for="identity in identities"
            :key="identity.id"
            class="rounded-xl border border-default p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="font-medium">{{ identity.provider }}</span>
              <span class="text-xs text-muted">{{ identity.created_at }}</span>
            </div>
            <div class="mt-2 break-all text-sm text-muted">
              {{ identity.provider_user_id }}
            </div>
            <div
              v-if="identity.provider_email"
              class="mt-1 text-sm"
            >
              {{ identity.provider_email }}
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
