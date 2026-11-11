'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  type IncentiveToolRecord,
  type IncentiveWidgetOffer,
  activeIncentiveOffersStorageKey,
  campaignOverridesStorageKey,
  customOffersStorageKey,
  deletedCampaignsStorageKey,
  incentiveOfferDestination,
  parseToolList,
  readJsonArray,
  toolDisplayName,
  contentLockersStorageKey,
  offerwallsStorageKey,
} from '@/lib/incentive-tools'
import styles from './IncentiveWidget.module.css'

type SeedOffer = IncentiveWidgetOffer & { placement?: string; status?: string }

type IncentiveWidgetProps = {
  kind: 'locker' | 'offerwall'
  toolId: string
  seedOffers: SeedOffer[]
}

function mergeOffers(seedOffers: SeedOffer[]): IncentiveWidgetOffer[] {
  const custom = readJsonArray<SeedOffer>(customOffersStorageKey)
  const overrides = readJsonArray<SeedOffer>(campaignOverridesStorageKey)
  const deleted = new Set(readJsonArray<string>(deletedCampaignsStorageKey))
  const overrideMap = new Map(overrides.map((offer) => [offer.id, offer]))

  const byId = new Map<string, SeedOffer>()
  for (const offer of [...seedOffers, ...custom]) {
    if (deleted.has(offer.id)) continue
    const override = overrideMap.get(offer.id)
    byId.set(offer.id, override ? { ...offer, ...override, id: offer.id } : offer)
  }

  return [...byId.values()]
    .filter((offer) => offer.placement === 'INCENTIVE' && offer.status !== 'PAUSED')
    .map((offer) => ({
      id: offer.id,
      name: offer.name,
      payout: Number(offer.payout) || 0,
      category: offer.category || 'App Install',
      country: offer.country || 'US',
      countries: offer.countries,
      offerTypes: offer.offerTypes?.length ? offer.offerTypes : ['CPI'],
      imageSource: offer.imageSource || `/affmine/preview_i/${offer.id}.png`,
      description: offer.description,
      offerLink: incentiveOfferDestination(offer),
      device: offer.device,
    }))
}

function loadTool(kind: 'locker' | 'offerwall', toolId: string) {
  const key = kind === 'locker' ? contentLockersStorageKey : offerwallsStorageKey
  return parseToolList(readJsonArray(key), kind).find((tool) => tool.id === toolId) ?? null
}

export default function IncentiveWidget({ kind, toolId, seedOffers }: IncentiveWidgetProps) {
  const [tool, setTool] = useState<IncentiveToolRecord | null>(null)
  const [offers, setOffers] = useState<IncentiveWidgetOffer[]>([])
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [points, setPoints] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const [launchNotice, setLaunchNotice] = useState('')
  const [ready, setReady] = useState(false)
  const [offerQuery, setOfferQuery] = useState('')

  useEffect(() => {
    const nextTool = loadTool(kind, toolId)
    setTool(nextTool)

    const activeIds = readJsonArray<string>(activeIncentiveOffersStorageKey)
    const activeSet = new Set(activeIds.length ? activeIds : seedOffers.map((offer) => offer.id))
    const catalog = mergeOffers(seedOffers).filter((offer) => activeSet.has(offer.id))
    const selected = nextTool?.selectedOfferIds?.length
      ? catalog.filter((offer) => nextTool.selectedOfferIds.includes(offer.id))
      : catalog
    const minPayout = Number(nextTool?.fields.minimumPayout || 0)
    const filtered = minPayout > 0 ? selected.filter((offer) => offer.payout >= minPayout) : selected

    const maxDesktop = Number(nextTool?.fields.desktopMaxOffers || 0)
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches
    const mobileCap = nextTool?.fields.mobileMaxOffers
    const maxMobile = mobileCap && mobileCap !== 'No limit' ? Number(mobileCap) : 0
    const capped = isMobile
      ? (maxMobile > 0 ? filtered.slice(0, maxMobile) : filtered)
      : (maxDesktop > 0 ? filtered.slice(0, maxDesktop) : filtered)

    setOffers(capped)
    setReady(true)
  }, [kind, toolId, seedOffers])

  const required = Math.max(1, Number(tool?.fields.conversionsRequired || 1))
  const exchangeRate = Math.max(1, Number(tool?.fields.exchangeRate || 100))
  const currencyName = tool?.fields.currencyName?.trim() || 'Points'
  const progress = Math.min(completedIds.length, required)
  const canUnlock = progress >= required
  const visibleOffers = useMemo(() => {
    const query = offerQuery.trim().toLowerCase()
    if (!query) return offers
    return offers.filter((offer) => (
      offer.name.toLowerCase().includes(query)
      || offer.category.toLowerCase().includes(query)
      || offer.country.toLowerCase().includes(query)
      || (offer.countries ?? []).some((geo) => geo.toLowerCase().includes(query))
    ))
  }, [offers, offerQuery])

  const theme = useMemo(() => {
    if (!tool) return {}
    if (kind === 'locker') {
      return {
        '--iw-bg': tool.fields.lockerBackground || '#fff',
        '--iw-main': tool.fields.lockerMainColor || '#43b6d6',
        '--iw-offers-bg': tool.fields.offersBackground || '#f7f8f9',
        '--iw-offers-text': tool.fields.offersTextColor || '#58666e',
        '--iw-btn': tool.fields.offersButtonColor || '#5cb85c',
      } as CSSProperties
    }
    return {
      '--iw-bg': tool.fields.offerwallBackground || '#fff',
      '--iw-main': tool.fields.offerButtonColor || '#43b6d6',
      '--iw-offers-bg': tool.fields.offerBoxBackground || '#f7f8f9',
      '--iw-offers-text': tool.fields.offerBoxText || '#58666e',
      '--iw-btn': tool.fields.offerButtonColor || '#43b6d6',
      '--iw-btn-border': tool.fields.offerButtonBorder || '#43b6d6',
    } as CSSProperties
  }, [tool, kind])

  const launchOffer = (offer: IncentiveWidgetOffer) => {
    const destination = incentiveOfferDestination(offer)
    window.open(destination, '_blank', 'noopener,noreferrer')
    setLaunchNotice(`Opened #${offer.id} · ${offer.name}`)

    if (kind === 'locker') {
      setCompletedIds((current) => (current.includes(offer.id) ? current : [...current, offer.id]))
      return
    }

    const earned = tool?.toggles.roundCurrency
      ? Math.round(offer.payout * exchangeRate)
      : Number((offer.payout * exchangeRate).toFixed(2))
    setPoints((value) => value + earned)
  }

  const unlock = () => {
    if (!canUnlock || !tool) return
    setUnlocked(true)
    if (tool.fields.unlockAction === 'Redirect to URL' && tool.fields.redirectUrl) {
      window.location.href = tool.fields.redirectUrl
    }
  }

  if (!ready) {
    return <div className={styles.shell}><p className={styles.empty}>Loading incentive tool…</p></div>
  }

  if (!tool) {
    return (
      <div className={styles.shell}>
        <div className={styles.missing}>
          <h1>Tool not found</h1>
          <p>This {kind === 'locker' ? 'content locker' : 'offerwall'} was deleted or never published. Create one from Incentive Tools.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.shell} ${kind === 'locker' ? styles.lockerShell : styles.wallShell}`} style={theme}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{kind === 'locker' ? 'Content Locker' : 'OfferWall'}</p>
          <h1>{kind === 'locker'
            ? (tool.fields.lockerTitle || 'Complete an offer below to unlock your content.')
            : (tool.fields.offerwallTitle || 'Complete offers and earn rewards')}</h1>
          {kind === 'locker' ? (
            <p>{tool.fields.lockerDescription || 'Unlocking will allow access to the premium content.'}</p>
          ) : (
            <p>
              {tool.toggles.hideCurrency
                ? `Balance: ${points}`
                : `${currencyName} balance: ${points}`}
              <span className={styles.rate}> · {exchangeRate} {currencyName} / $1</span>
            </p>
          )}
        </div>
        {kind === 'locker' && tool.toggles.showLock ? (
          <div className={`${styles.lockBadge} ${unlocked ? styles.lockBadgeOpen : ''}`} aria-hidden="true">
            {unlocked ? '✓' : '🔒'}
          </div>
        ) : null}
      </header>

      {kind === 'locker' ? (
        <div className={styles.progressCard}>
          <div className={styles.progressMeta}>
            <strong>{progress} / {required}</strong>
            <span>{canUnlock ? 'Ready to unlock' : `Complete ${Math.max(0, required - progress)} more offer${required - progress === 1 ? '' : 's'}`}</span>
          </div>
          <div className={styles.progressTrack} aria-hidden="true">
            <span style={{ width: `${Math.min(100, (progress / required) * 100)}%` }} />
          </div>
          <button
            type="button"
            className={styles.unlockButton}
            disabled={!canUnlock || unlocked}
            onClick={unlock}
          >
            {unlocked ? 'Content unlocked' : (tool.fields.lockerButtonText || 'Unlock content')}
          </button>
        </div>
      ) : (
        <div className={styles.wallBalance}>
          <div>
            <strong>{tool.toggles.hideCurrency ? points : `${points} ${currencyName}`}</strong>
            <span>Your rewards balance</span>
          </div>
          <p className={styles.wallHint}>Complete an offer below to earn {currencyName.toLowerCase()}.</p>
        </div>
      )}

      {unlocked && kind === 'locker' && tool.fields.unlockAction !== 'Redirect to URL' ? (
        <div className={styles.unlockedPanel} role="status">
          <h2>You&apos;re in — content unlocked</h2>
          <p>Thanks for completing the required offers. Enjoy your content.</p>
        </div>
      ) : null}

      <div className={styles.offerToolbar}>
        <h2 className={styles.offerHeading}>{kind === 'locker' ? 'Available offers' : 'Earn rewards'}</h2>
        <input
          type="search"
          className={styles.offerSearch}
          value={offerQuery}
          onChange={(event) => setOfferQuery(event.target.value)}
          placeholder="Search offers…"
          aria-label="Search offers"
        />
      </div>

      <section className={styles.offerList} aria-label="Incentive offers">
        {visibleOffers.length ? visibleOffers.map((offer) => {
          const done = completedIds.includes(offer.id)
          const geos = offer.countries?.length ? offer.countries : [offer.country]
          const reward = tool.toggles.roundCurrency
            ? Math.round(offer.payout * exchangeRate)
            : Number((offer.payout * exchangeRate).toFixed(2))
          return (
            <article key={offer.id} className={`${styles.offerCard} ${done ? styles.offerCardDone : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={offer.imageSource} alt="" width={52} height={52} />
              <div className={styles.offerBody}>
                <h2>{offer.name}</h2>
                <p>
                  {offer.category}
                  <span aria-hidden="true"> · </span>
                  {geos.join(', ')}
                  <span aria-hidden="true"> · </span>
                  {offer.offerTypes[0] || 'CPI'}
                </p>
                <strong className={styles.payout}>
                  {kind === 'locker' ? 'Free to start' : `+${reward}${tool.toggles.hideCurrency ? '' : ` ${currencyName}`}`}
                </strong>
              </div>
              <button type="button" className={styles.offerButton} onClick={() => launchOffer(offer)}>
                {kind === 'locker' ? (done ? 'Completed' : 'Start offer') : 'Earn now'}
              </button>
            </article>
          )
        }) : (
          <div className={styles.empty}>
            {offers.length
              ? `No offers match “${offerQuery.trim()}”.`
              : `No offers are available right now. Please check back soon.`}
          </div>
        )}
      </section>

      {launchNotice ? <p className={styles.notice} role="status">{launchNotice}</p> : null}
      <footer className={styles.footer}>
        <span>{toolDisplayName(tool)}</span>
        <span>Powered by Affmine Incentive Tools</span>
      </footer>
    </div>
  )
}
