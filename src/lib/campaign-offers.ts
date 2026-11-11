export type CampaignOfferRecord = {
  id: string
  name: string
  payout: number
  country: string
  countries?: string[]
  action: 'Apply' | 'Pending' | 'View'
  requiresApproval?: boolean
  imageSource?: string
  offerTypes?: string[]
  category?: string
  device?: string[]
  description?: string
  offerLink?: string
  isHot?: boolean
  status?: 'ACTIVE' | 'PAUSED'
  placement?: 'STANDARD' | 'INCENTIVE'
  incentiveActive?: boolean
  createdAt?: string
}

export type CampaignOfferInput = {
  id: string
  name: string
  payout: number
  country: string
  countries?: string[]
  action?: 'Apply' | 'Pending' | 'View'
  requiresApproval?: boolean
  imageSource?: string | null
  offerTypes?: string[]
  category?: string | null
  device?: string[]
  description?: string | null
  offerLink?: string | null
  isHot?: boolean
  status?: 'ACTIVE' | 'PAUSED'
  placement?: 'STANDARD' | 'INCENTIVE'
  incentiveActive?: boolean
  createdAt?: string | null
}

type DbCampaignOffer = {
  id: string
  name: string
  payout: number
  country: string
  countries: string[]
  action: string
  requiresApproval: boolean
  imageSource: string | null
  offerTypes: string[]
  category: string | null
  device: string[]
  description: string | null
  offerLink: string | null
  isHot: boolean
  status: string
  placement: string
  incentiveActive: boolean
  createdAt: Date
}

const ACTIONS = new Set(['Apply', 'Pending', 'View'])
const STATUSES = new Set(['ACTIVE', 'PAUSED'])
const PLACEMENTS = new Set(['STANDARD', 'INCENTIVE'])

/** Affmine demo catalog IDs formerly hardcoded in the app — never rehydrate these. */
export const LEGACY_AFFMINE_DEMO_OFFER_IDS = [
  '4392', '4394', '4415', '4424', '32703', '33614', '33615', '33616', '33617',
  '33745', '33804', '33866', '33998', '33999', '34000', '34001', '34002', '34003',
  '34004', '34005', '34006', '34007', '34008', '34009', '34010', '34909', '34927',
  '34928', '34929', '35150', '35151', '35152', '35153', '35241', '35332', '35333',
  '35594', '35682', '35822', '36756',
] as const

const legacyDemoOfferIdSet = new Set<string>(LEGACY_AFFMINE_DEMO_OFFER_IDS)

export function isLegacyAffmineDemoOfferId(id: string): boolean {
  return legacyDemoOfferIdSet.has(id)
}

export function withoutLegacyAffmineDemoOffers<T extends { id: string }>(offers: T[]): T[] {
  return offers.filter((offer) => !legacyDemoOfferIdSet.has(offer.id))
}

export async function purgeLegacyAffmineDemoOffers(
  db: { campaignOffer: { deleteMany: (args: { where: { id: { in: string[] } } }) => Promise<unknown> } },
) {
  if (!LEGACY_AFFMINE_DEMO_OFFER_IDS.length) return
  await db.campaignOffer.deleteMany({
    where: { id: { in: [...LEGACY_AFFMINE_DEMO_OFFER_IDS] } },
  })
}

export function normalizeCampaignOfferInput(body: unknown): CampaignOfferInput | null {
  if (!body || typeof body !== 'object') return null
  const raw = body as Record<string, unknown>
  const id = typeof raw.id === 'string' ? raw.id.trim() : ''
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const country = typeof raw.country === 'string' ? raw.country.trim().toUpperCase() : ''
  const payout = typeof raw.payout === 'number' ? raw.payout : Number(raw.payout)
  if (!id || !name || !country || !Number.isFinite(payout) || payout <= 0) return null

  const countries = Array.isArray(raw.countries)
    ? raw.countries
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim().toUpperCase())
    : undefined
  const offerTypes = Array.isArray(raw.offerTypes)
    ? raw.offerTypes.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    : undefined
  const device = Array.isArray(raw.device)
    ? raw.device.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    : undefined
  const action = typeof raw.action === 'string' && ACTIONS.has(raw.action) ? raw.action as CampaignOfferInput['action'] : undefined
  const status = typeof raw.status === 'string' && STATUSES.has(raw.status) ? raw.status as CampaignOfferInput['status'] : undefined
  const placement = typeof raw.placement === 'string' && PLACEMENTS.has(raw.placement) ? raw.placement as CampaignOfferInput['placement'] : undefined

  return {
    id,
    name,
    payout,
    country,
    countries,
    action,
    requiresApproval: typeof raw.requiresApproval === 'boolean' ? raw.requiresApproval : undefined,
    imageSource: typeof raw.imageSource === 'string' ? raw.imageSource.trim() : raw.imageSource === null ? null : undefined,
    offerTypes,
    category: typeof raw.category === 'string' ? raw.category.trim() : raw.category === null ? null : undefined,
    device,
    description: typeof raw.description === 'string' ? raw.description.trim() : raw.description === null ? null : undefined,
    offerLink: typeof raw.offerLink === 'string' ? raw.offerLink.trim() : raw.offerLink === null ? null : undefined,
    isHot: typeof raw.isHot === 'boolean' ? raw.isHot : undefined,
    status,
    placement,
    incentiveActive: typeof raw.incentiveActive === 'boolean' ? raw.incentiveActive : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
  }
}

export function toCampaignOfferRecord(row: DbCampaignOffer): CampaignOfferRecord {
  const action = ACTIONS.has(row.action) ? row.action as CampaignOfferRecord['action'] : 'Apply'
  const status = STATUSES.has(row.status) ? row.status as CampaignOfferRecord['status'] : 'ACTIVE'
  const placement = PLACEMENTS.has(row.placement) ? row.placement as CampaignOfferRecord['placement'] : 'STANDARD'
  return {
    id: row.id,
    name: row.name,
    payout: row.payout,
    country: row.country,
    countries: row.countries.length ? row.countries : undefined,
    action,
    requiresApproval: row.requiresApproval,
    imageSource: row.imageSource || undefined,
    offerTypes: row.offerTypes.length ? row.offerTypes : undefined,
    category: row.category || undefined,
    device: row.device.length ? row.device : undefined,
    description: row.description || undefined,
    offerLink: row.offerLink || undefined,
    isHot: row.isHot,
    status,
    placement,
    incentiveActive: row.incentiveActive,
    createdAt: row.createdAt.toISOString(),
  }
}

export function toPrismaCreateData(input: CampaignOfferInput, createdById?: string) {
  const placement = input.placement ?? 'STANDARD'
  const requiresApproval = placement === 'INCENTIVE' ? false : (input.requiresApproval ?? true)
  const action = input.action ?? (requiresApproval ? 'Apply' : 'View')
  const countries = input.countries?.length ? input.countries : [input.country]
  return {
    id: input.id,
    name: input.name,
    payout: input.payout,
    country: input.country,
    countries,
    action,
    requiresApproval,
    imageSource: input.imageSource || null,
    offerTypes: input.offerTypes ?? [],
    category: input.category || null,
    device: input.device ?? [],
    description: input.description || null,
    offerLink: input.offerLink || null,
    isHot: input.isHot ?? false,
    status: input.status ?? 'ACTIVE',
    placement,
    incentiveActive: input.incentiveActive ?? placement === 'INCENTIVE',
    createdById: createdById || null,
    ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
  }
}
