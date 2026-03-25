import type { ClinicConfig } from '~/composables/useMarketplaceApi'

export type MarketplaceClinicListItem = {
  clinic: ClinicConfig
  servicesCount: number
}

function parseSlugList(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return ['demo-clinic']
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function useMarketplaceClinicCatalog() {
  const config = useRuntimeConfig()
  const api = useMarketplaceApi()

  const slugs = computed(() =>
    parseSlugList(config.public.marketplaceClinicSlugs as string | undefined)
  )

  async function loadClinics(): Promise<MarketplaceClinicListItem[]> {
    const results = await Promise.all(
      slugs.value.map(async (slug) => {
        try {
          const clinic = await api.getPublicClinic(slug)
          let servicesCount = 0
          try {
            const svc = await api.listPublicServices(slug)
            servicesCount = svc.items.length
          } catch {
            servicesCount = 0
          }
          return { clinic, servicesCount } satisfies MarketplaceClinicListItem
        } catch {
          return null
        }
      })
    )
    return results.filter((c): c is MarketplaceClinicListItem => c !== null)
  }

  return {
    slugs,
    loadClinics
  }
}
