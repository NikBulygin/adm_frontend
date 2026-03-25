type LoginPayload = {
  email?: string
  phone?: string
  password: string
}

type RegisterPayload = LoginPayload

type AuthIdentity = {
  id: string
  user_id: string
  provider: string
  provider_user_id: string
  provider_email?: string | null
  created_at: string
}

type AccessRole = {
  id: string
  code: string
  name: string
  description: string
  created_at: string
}

type MePayload = {
  id: string
  email?: string | null
  phone?: string | null
  first_name?: string | null
  last_name?: string | null
  age?: number | null
  iin?: string | null
  status: string
  roles: AccessRole[]
  permissions: string[]
  login_method: string
  login_provider: string
  provider_identities: AuthIdentity[]
}

type AuthResponse = {
  access_token: string
  token_type: string
  expires_at: string
  user: MePayload
}

type UpdateProfilePayload = {
  phone?: string
  first_name?: string
  last_name?: string
  age?: number | null
  iin?: string
}

type ApiError = {
  error?: string
  message?: string
}

type FetchFailure = Error & {
  data?: ApiError
}

const storageKey = 'adm_super_app.access_token'

export function useAuthSession() {
  const config = useRuntimeConfig()
  const accessToken = useState<string | null>('auth.access_token', () => null)
  const me = useState<MePayload | null>('auth.me', () => null)
  const expiresAt = useState<string | null>('auth.expires_at', () => null)
  const initialized = useState<boolean>('auth.initialized', () => false)
  const pending = useState<boolean>('auth.pending', () => false)
  const lastError = useState<string | null>('auth.error', () => null)

  function authHeaders(extra?: HeadersInit) {
    return {
      ...(extra || {}),
      ...(accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {})
    }
  }

  function persistToken() {
    if (!import.meta.client) {
      return
    }

    if (accessToken.value) {
      localStorage.setItem(storageKey, accessToken.value)
    } else {
      localStorage.removeItem(storageKey)
    }
  }

  function authBaseURL() {
    return import.meta.server ? config.gatewayInternalBase : config.public.authApiBase
  }

  async function request<T>(path: string, options: Parameters<typeof $fetch<T>>[1] = {}) {
    try {
      return await $fetch<T>(path, {
        baseURL: authBaseURL(),
        credentials: 'include',
        ...options,
        headers: authHeaders(options.headers)
      })
    } catch (error) {
      const fetchError = error as FetchFailure
      throw new Error(fetchError.data?.message || fetchError.message || 'Request failed')
    }
  }

  function setSession(token: string | null, nextExpiresAt?: string | null) {
    accessToken.value = token
    expiresAt.value = nextExpiresAt || null
    persistToken()
  }

  function clearSession() {
    setSession(null, null)
    me.value = null
    lastError.value = null
  }

  async function fetchMe() {
    if (!accessToken.value) {
      me.value = null
      return null
    }

    pending.value = true
    lastError.value = null
    try {
      const payload = await request<MePayload>('/me')
      me.value = payload
      return payload
    } catch (error) {
      clearSession()
      lastError.value = (error as Error).message
      return null
    } finally {
      pending.value = false
    }
  }

  async function consumeAuthResponse(promise: Promise<AuthResponse>) {
    pending.value = true
    lastError.value = null
    try {
      const payload = await promise
      setSession(payload.access_token, payload.expires_at)
      me.value = payload.user
      return payload.user
    } catch (error) {
      lastError.value = (error as Error).message
      throw error
    } finally {
      pending.value = false
    }
  }

  function login(payload: LoginPayload) {
    return consumeAuthResponse(request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: payload
    }))
  }

  function register(payload: RegisterPayload) {
    return consumeAuthResponse(request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload
    }))
  }

  function refresh() {
    return consumeAuthResponse(request<AuthResponse>('/auth/refresh', {
      method: 'POST'
    }))
  }

  async function updateProfile(payload: UpdateProfilePayload) {
    pending.value = true
    lastError.value = null
    try {
      const next = await request<MePayload>('/me', {
        method: 'PATCH',
        body: payload
      })
      me.value = next
      return next
    } catch (error) {
      lastError.value = (error as Error).message
      throw error
    } finally {
      pending.value = false
    }
  }

  async function logout() {
    pending.value = true
    try {
      await request('/auth/logout', { method: 'POST' })
    } finally {
      clearSession()
      pending.value = false
    }
  }

  async function logoutAll() {
    pending.value = true
    try {
      await request('/auth/logout-all', { method: 'POST' })
    } finally {
      clearSession()
      pending.value = false
    }
  }

  function startGoogleAuth() {
    if (!import.meta.client) {
      return
    }

    window.location.href = `${config.public.authApiBase}/auth/google/start`
  }

  async function init() {
    if (initialized.value) {
      return
    }

    if (import.meta.client && !accessToken.value) {
      const token = localStorage.getItem(storageKey)
      if (token) {
        accessToken.value = token
      }
    }

    if (accessToken.value) {
      await fetchMe()
    } else {
      try {
        await refresh()
      } catch {
        clearSession()
      }
    }

    initialized.value = true
  }

  async function acceptGoogleRedirect(fragment: string) {
    const values = new URLSearchParams(fragment.replace(/^#/, ''))
    const token = values.get('access_token')
    const nextExpiresAt = values.get('expires_at')
    const error = values.get('error')
    const message = values.get('message')

    if (error) {
      lastError.value = message || error
      return false
    }

    if (!token) {
      lastError.value = 'Missing access token from Google callback'
      return false
    }

    setSession(token, nextExpiresAt)
    await fetchMe()
    return true
  }

  const isAuthenticated = computed(() => Boolean(accessToken.value && me.value))
  const displayName = computed(() => {
    if (!me.value) {
      return null
    }

    return me.value.email || me.value.phone || me.value.login_provider || me.value.id
  })

  function hasPermission(permission: string) {
    return Boolean(me.value?.permissions?.includes(permission))
  }

  function hasRole(roleCode: string) {
    return Boolean(me.value?.roles?.some(role => role.code === roleCode))
  }

  return {
    accessToken,
    displayName,
    expiresAt,
    me,
    pending,
    lastError,
    isAuthenticated,
    init,
    login,
    register,
    refresh,
    updateProfile,
    logout,
    logoutAll,
    fetchMe,
    startGoogleAuth,
    acceptGoogleRedirect,
    clearSession,
    hasPermission,
    hasRole
  }
}
