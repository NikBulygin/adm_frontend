export type ClinicConfig = {
  id: string
  organization_id: string
  clinic_branch_id: string
  clinic_slug: string
  domain?: string | null
  theme_config: Record<string, unknown>
  landing_config: Record<string, unknown>
  seo_config: Record<string, unknown>
  is_public: boolean
  status: string
  created_at: string
  updated_at: string
}

export type MarketplaceService = {
  id: string
  organization_id: string
  clinic_branch_id: string
  code: string
  name: string
  duration_minutes: number
  price: string
  is_public: boolean
  status: string
  created_at: string
  updated_at: string
}

export type MarketplaceSpecialistService = {
  id: string
  code: string
  name: string
  duration_minutes: number
  price: string
}

export type MarketplaceSpecialist = {
  id: string
  short_id: string
  clinic_branch_id: string
  full_name: string
  description: string
  next_available_at?: string | null
  next_available_ends_at?: string | null
  services: MarketplaceSpecialistService[]
}

export type AvailabilitySlot = {
  id: string
  clinic_branch_id: string
  specialist_id: string
  specialist_name: string
  starts_at: string
  ends_at: string
  status: string
  source: string
}

export type CreateAppointmentPayload = {
  clinic_slug: string
  slot_id: string
  service_id: string
  first_name: string
  last_name: string
  age: number
  phone: string
  email?: string
  iin?: string
  patient_id?: string
  created_by_user_id?: string
  source?: string
}

type ListResponse<T> = {
  items: T[]
}

type ApiError = {
  error?: string
  message?: string
}

type FetchFailure = Error & {
  data?: ApiError
}

function normalizeApiError(error: unknown) {
  const fetchError = error as FetchFailure
  return fetchError.data?.message || fetchError.message || 'Request failed'
}

export function useMarketplaceApi() {
  const config = useRuntimeConfig()

  function marketplaceBaseURL() {
    if (import.meta.server) {
      return `${config.gatewayInternalBase}/api/marketplace`
    }

    return config.public.marketplaceApiBase
  }

  async function request<T>(path: string, options: Parameters<typeof $fetch<T>>[1] = {}) {
    try {
      return await $fetch<T>(path, {
        baseURL: marketplaceBaseURL(),
        ...options
      })
    } catch (error) {
      throw new Error(normalizeApiError(error))
    }
  }

  function getPublicClinic(clinicSlug: string) {
    return request<ClinicConfig>('/public/clinic', {
      query: { slug: clinicSlug }
    })
  }

  function listPublicServices(clinicSlug: string) {
    return request<ListResponse<MarketplaceService>>('/services', {
      query: { clinic_slug: clinicSlug }
    })
  }

  function listPublicSpecialists(clinicSlug: string, options: { search?: string, serviceId?: string } = {}) {
    return request<ListResponse<MarketplaceSpecialist>>('/specialists', {
      query: {
        clinic_slug: clinicSlug,
        ...(options.search ? { search: options.search } : {}),
        ...(options.serviceId ? { service_id: options.serviceId } : {})
      }
    })
  }

  function getPublicSpecialist(clinicSlug: string, shortId: string) {
    return request<MarketplaceSpecialist>(`/specialists/${shortId}`, {
      query: {
        clinic_slug: clinicSlug
      }
    })
  }

  function listAvailability(clinicSlug: string, date: string, specialistId?: string) {
    return request<ListResponse<AvailabilitySlot>>('/availability', {
      query: {
        clinic_slug: clinicSlug,
        date,
        ...(specialistId ? { specialist_id: specialistId } : {})
      }
    })
  }

  /** Inclusive `from` / `to` dates (YYYY-MM-DD). Max range ~3 months on server. */
  function listAvailabilityRange(clinicSlug: string, from: string, to: string, specialistId?: string) {
    return request<ListResponse<AvailabilitySlot>>('/availability', {
      query: {
        clinic_slug: clinicSlug,
        from,
        to,
        ...(specialistId ? { specialist_id: specialistId } : {})
      }
    })
  }

  function createAppointment(payload: CreateAppointmentPayload) {
    return request('/appointments', {
      method: 'POST',
      body: {
        ...payload,
        source: payload.source || 'public_frontend'
      }
    })
  }

  return {
    getPublicClinic,
    listPublicServices,
    listPublicSpecialists,
    getPublicSpecialist,
    listAvailability,
    listAvailabilityRange,
    createAppointment
  }
}
