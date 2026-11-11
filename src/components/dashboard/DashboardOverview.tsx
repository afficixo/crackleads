'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import * as CountryFlags from 'country-flag-icons/react/1x1'
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  CircleDollarSign,
  CircleUserRound,
  CodeXml,
  FileChartColumn,
  Flame,
  Gauge,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  MoreHorizontal,
  MousePointer2,
  Pencil,
  Pause,
  Plus,
  Play,
  RotateCcw,
  Search,
  SendHorizontal,
  Settings,
  ShoppingCart,
  Tags,
  Trash2,
  X,
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import {
  bootIntercomMessenger,
  hasIntercomApp,
  shutdownIntercomMessenger,
} from '@/lib/intercom'
import {
  type IncentiveToolRecord,
  contentLockersStorageKey,
  createToolId,
  defaultLockerFields,
  defaultLockerToggles,
  defaultOfferwallFields,
  defaultOfferwallToggles,
  incentiveOfferDestination,
  offerwallsStorageKey,
  parseToolList,
  toolDisplayName,
  toolEmbedCode,
  toolPublicPath,
  writeJson,
} from '@/lib/incentive-tools'
import styles from './Dashboard.module.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

function ReportLineChart({ labels }: { labels: string[] }) {
  const zeros = labels.map(() => 0)
  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: 'Clicks',
            data: zeros,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.08)',
            pointRadius: 3,
            tension: 0.15,
          },
          {
            label: 'Conversions',
            data: zeros,
            borderColor: '#60ed32',
            backgroundColor: 'transparent',
            pointRadius: 3,
            tension: 0.15,
          },
          {
            label: 'Revenue',
            data: zeros,
            borderColor: '#3d464d',
            backgroundColor: 'transparent',
            pointRadius: 3,
            tension: 0.15,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#7a858b', font: { size: 10 } } },
          y: { beginAtZero: true, suggestedMax: 3, ticks: { color: '#7a858b', font: { size: 10 }, stepSize: 0.5 } },
        },
      }}
    />
  )
}

type MenuItem = { label: string; href: string }
type MenuGroup = { label: string; iconClass: string; items: MenuItem[] }
type CampaignFilterOption = { value: string; label: string; triggerLabel?: string; flag?: string }

const campaignFilterOptions: Record<'country' | 'device' | 'category' | 'type', CampaignFilterOption[]> = {
  country: [
    { value: 'All', label: 'Worlwide', triggerLabel: 'All' },
    { value: 'US', label: 'United States', flag: 'US' },
    { value: 'GB', label: 'United Kingdom', flag: 'GB' },
    { value: 'CA', label: 'Canada', flag: 'CA' },
    { value: 'DE', label: 'Germany', flag: 'DE' },
    { value: 'AU', label: 'Australia', flag: 'AU' },
    { value: 'BR', label: 'Brazil', flag: 'BR' },
    { value: 'TR', label: 'Turkey', flag: 'TR' },
    { value: 'ES', label: 'Spain', flag: 'ES' },
    { value: 'MX', label: 'Mexico', flag: 'MX' },
    { value: 'FR', label: 'France', flag: 'FR' },
    { value: 'AE', label: 'United Arab Emirates', flag: 'AE' },
    { value: 'MY', label: 'Malaysia', flag: 'MY' },
    { value: 'ID', label: 'Indonesia', flag: 'ID' },
    { value: 'JP', label: 'Japan', flag: 'JP' },
    { value: 'SA', label: 'Saudi Arabia', flag: 'SA' },
    { value: 'PH', label: 'Philippines', flag: 'PH' },
    { value: 'TH', label: 'Thailand', flag: 'TH' },
    { value: 'NL', label: 'Netherlands', flag: 'NL' },
    { value: 'DK', label: 'Denmark', flag: 'DK' },
    { value: 'NO', label: 'Norway', flag: 'NO' },
    { value: 'SE', label: 'Sweden', flag: 'SE' },
    { value: 'BE', label: 'Belgium', flag: 'BE' },
    { value: 'HK', label: 'Hong Kong', flag: 'HK' },
  ],
  device: [
    { value: 'All', label: 'All' },
    { value: 'Windows', label: 'Windows' },
    { value: 'Mac', label: 'Mac' },
    { value: 'Android', label: 'Android' },
    { value: 'iPhone', label: 'iPhone' },
    { value: 'iPad', label: 'iPad' },
    { value: 'Mobile (Other)', label: 'Mobile (Other)' },
  ],
  category: [
    { value: 'All', label: 'All' },
    { value: 'App Install', label: 'App Install' },
    { value: 'CC Submit', label: 'CC Submit' },
    { value: 'E-mail Submit', label: 'E-mail Submit' },
    { value: 'PIN Submit', label: 'PIN Submit' },
    { value: 'Survey', label: 'Survey' },
  ],
  type: [
    { value: 'All', label: 'All' },
    { value: 'SOI', label: 'SOI' },
    { value: 'DOI', label: 'DOI' },
    { value: 'Other', label: 'Other' },
  ],
}

function CampaignFilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: CampaignFilterOption[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const selectedOption = options.find((option) => option.value === value)
  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchTerm.trim().toLowerCase()))

  useEffect(() => {
    if (!open) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setSearchTerm('')
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setSearchTerm('')
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  const chooseOption = (option: CampaignFilterOption) => {
    onChange(option.value)
    setOpen(false)
    setSearchTerm('')
    buttonRef.current?.focus()
  }

  return (
    <div className={styles.filterSelect} ref={containerRef}>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        className={`${styles.filterSelectButton} ${open ? styles.filterSelectButtonOpen : ''}`}
        aria-labelledby={`${id}-label`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        onClick={() => {
          setOpen((isOpen) => !isOpen)
          setSearchTerm('')
        }}
      >
        <span>{selectedOption?.triggerLabel ?? selectedOption?.label ?? value}</span>
        <span className={styles.filterSelectCaret} aria-hidden="true" />
      </button>
      {open && (
        <div className={`${styles.filterDropdown} ${options.some((option) => option.flag) ? styles.filterDropdownWide : styles.filterDropdownCompact}`}>
          <div className={styles.filterDropdownSearch}>
            <input
              ref={searchRef}
              type="text"
              className={styles.filterSearch}
              aria-label={`Search ${label}`}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  containerRef.current?.querySelector<HTMLButtonElement>('[role="option"]')?.focus()
                }
              }}
            />
          </div>
          <div id={`${id}-options`} className={styles.filterOptions} role="listbox" aria-label={label}>
            {filteredOptions.map((option) => {
              const Flag = option.flag ? CountryFlags[option.flag as keyof typeof CountryFlags] : null
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.filterOption} ${isSelected ? styles.filterOptionSelected : ''}`}
                  onClick={() => chooseOption(option)}
                >
                  {Flag && <Flag className={styles.filterOptionFlag} aria-hidden="true" />}
                  <span>{option.label}</span>
                  {isSelected && <i className={`fa fa-check ${styles.filterOptionCheck}`} aria-hidden="true" />}
                </button>
              )
            })}
            {!filteredOptions.length && <div className={styles.filterNoResults}>No results matched</div>}
          </div>
        </div>
      )}
    </div>
  )
}

const menuGroups: MenuGroup[] = [
  { label: 'Offers', iconClass: 'fa fa-tags', items: [{ label: 'Browse', href: '/campaigns/browse' }, { label: 'New added', href: '/campaigns/new' }, { label: 'Incentive Offers', href: '/incentive_offers' }, { label: 'Offer Approval', href: '/campaigns/approvals' }] },
  { label: 'Reports', iconClass: 'fa fa-pie-chart', items: [{ label: 'Daily reports', href: '/reports/daily' }, { label: 'Campaign reports', href: '/reports/campaign' }, { label: 'Geo reports', href: '/reports/geo' }, { label: 'Tool reports', href: '/reports/tool' }, { label: 'SubID reports', href: '/reports/subid' }, { label: 'Conversions', href: '/reports/conversions' }] },
  { label: 'Incentive Tools', iconClass: 'fa fa-th-large', items: [{ label: 'Content Locker', href: '/contentlocker' }, { label: 'Offerwall', href: '/offerwall' }] },
  { label: 'Developer Tools', iconClass: 'fa fa-cogs', items: [{ label: 'Postback', href: '/tools/postback' }, { label: 'API', href: '/tools/api' }] },
  { label: 'Account', iconClass: 'fa fa-user', items: [{ label: 'Settings', href: '/account/settings' }, { label: 'Referral', href: '/account/referral' }, { label: 'Publishers', href: '/account/publishers' }] },
]

type OfferApplicationRecord = {
  id: string
  campaignId: string
  campaignName: string
  campaignPayout: number
  campaignCountry: string
  campaignCategory?: string | null
  campaignImage?: string | null
  publisherId: string
  publisherUsername: string
  publisherEmail?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewNote?: string | null
  reviewedByUsername?: string | null
  noticeDismissed?: boolean
  createdAt: string
  reviewedAt?: string | null
}

type PublisherAccountRecord = {
  id: string
  username: string
  email: string
  fullName?: string | null
  address?: string | null
  contractNumber?: string | null
  telegramUsername?: string | null
  source?: string | null
  publisherNumber?: number | null
  status: 'PENDING' | 'ACTIVE' | 'DISABLED' | 'REJECTED'
  createdAt: string
  lastLogin?: string | null
  referredBy?: { id: string; username: string } | null
}

const newsItems = [
  { title: 'Welcome', body: 'Your catalog is ready. Add offers from Campaigns or Incentive Offers to start promoting.' },
  { title: 'Need help?', body: 'Contact your affiliate manager anytime if you need assistance with offers or payouts.' },
]

/** Dashboard topbar ticker strings */
const topbarUpdateStrings = [
  'Add offers from <b>Campaigns</b> or <b>Incentive Offers</b>.',
  'Contact us if you want a specific offer or need help.',
  'Our team is available 24/7 to help you.',
]

function visibleHtmlLength(html: string) {
  return html.replace(/<[^>]*>/g, '').length
}

/** Typed.js-style HTML partial: type visible chars, keep tags valid mid-string. */
function sliceHtmlByVisibleChars(html: string, charCount: number) {
  if (charCount <= 0) return ''
  let visible = 0
  let result = ''
  const openTags: string[] = []
  let i = 0
  while (i < html.length && visible < charCount) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i)
      if (end === -1) break
      const tag = html.slice(i, end + 1)
      const nameMatch = tag.match(/^<\/?([a-zA-Z0-9]+)/)
      const name = nameMatch?.[1]
      if (name) {
        if (tag.startsWith('</')) openTags.pop()
        else if (!tag.endsWith('/>')) openTags.push(name)
      }
      result += tag
      i = end + 1
      continue
    }
    result += html[i]
    visible += 1
    i += 1
  }
  for (let t = openTags.length - 1; t >= 0; t -= 1) {
    result += `</${openTags[t]}>`
  }
  return result
}

function CampaignUpdateFlag({ geo, id }: { geo: string; id: string }) {
  const code = geo.toUpperCase()
  const Flag = CountryFlags[code as keyof typeof CountryFlags]
  const label = campaignCountryLabels[code] ?? code
  if (Flag) {
    return <Flag className={styles.flag} title={label} aria-label={`${label} flag`} />
  }
  return <span className={styles.flagFallback} aria-label={label}>{campaignFlagEmoji(code) || id}</span>
}

type CampaignOffer = {
  id: string
  name: string
  payout: number
  country: string
  /** Extra geos shown as flags (Affmine multi-country rows). */
  countries?: string[]
  action: 'Apply' | 'Pending' | 'View'
  /** When true, publishers must apply and wait for manager approval before opening/using the offer. */
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
  createdAt?: string
}

type FeaturedCampaign = {
  id: string
  name: string
  payout: string
  geo: string
  country: string
  category: string
  imageSource?: string
  placement?: 'STANDARD' | 'INCENTIVE'
  action?: 'Apply' | 'Pending' | 'View'
  requiresApproval?: boolean
}

type OfferDraft = {
  id: string
  name: string
  payout: string
  imageSource: string
  offerTypes: string[]
  requiresApproval: boolean
  category?: string
  country?: string
  /** Extra geos for Affmine-style multi-country incentive rows. */
  countries?: string[]
  device: string[]
  description?: string
  offerLink?: string
}

const customOffersStorageKey = 'affmine-custom-offers'
const campaignOverridesStorageKey = 'affmine-campaign-overrides'
const deletedCampaignsStorageKey = 'affmine-deleted-campaigns'
const activeIncentiveOffersStorageKey = 'affmine-active-incentive-offers'
const defaultCampaignTrackingUrl = 'https://www.af9m8trk.com/6HH112BV/UQ711VGP/'
const allOfferDevices = ['Windows', 'Mac', 'Android', 'iPhone', 'iPad', 'Mobile (Other)'] as const

const initialOfferDraft: OfferDraft = {
  id: '',
  name: '',
  payout: '',
  imageSource: '',
  offerTypes: ['CPL', 'SOI'],
  requiresApproval: true,
  category: 'E-mail Submit',
  country: 'US',
  countries: ['US'],
  device: [...allOfferDevices],
  description: '',
  offerLink: '',
}

const initialIncentiveOfferDraft: OfferDraft = {
  id: '',
  name: '',
  payout: '',
  imageSource: '',
  offerTypes: ['CPI'],
  requiresApproval: false,
  category: 'App Install',
  country: '',
  countries: [],
  device: ['iPhone', 'iPad', 'Mobile (Other)'],
  description: '',
  offerLink: '',
}

const offerRequiresApproval = (offer: Pick<CampaignOffer, 'action' | 'requiresApproval'>) => (
  offer.requiresApproval ?? offer.action !== 'View'
)

const getCampaignDevices = (campaign: Pick<CampaignOffer, 'device'>) => (
  campaign.device?.length ? campaign.device : [...allOfferDevices]
)

const formatCampaignDevices = (devices: string[]) => (
  devices.length >= allOfferDevices.length ? 'All devices' : devices.join(', ')
)

const CampaignDeviceIcons = ({ devices }: { devices: string[] }) => {
  const selected = new Set(devices)
  const showDesktop = selected.has('Windows') || selected.has('Mac')
  const showAndroid = selected.has('Android')
  const showApple = selected.has('iPhone') || selected.has('iPad')
  const showMobile = selected.has('Mobile (Other)')
  const label = [
    showDesktop ? 'Desktop' : null,
    showAndroid ? 'Android' : null,
    showApple ? 'iOS' : null,
    showMobile ? 'Other mobile' : null,
  ].filter(Boolean).join(', ') || 'No devices'

  // Affmine device strip: fa-lg fa-desktop, fa-robot, fa-apple, fa-mobile-alt
  return (
    <span className={styles.deviceIcons} aria-label={label} title={formatCampaignDevices(devices)}>
      {showDesktop && <i className={`fas fa-lg fa-desktop ${styles.deviceIcon}`} title="Desktop" aria-hidden="true" />}
      {showAndroid && <i className={`fas fa-lg fa-robot ${styles.deviceIcon}`} title="Android" aria-hidden="true" />}
      {showApple && <i className={`fab fa-lg fa-apple ${styles.deviceIcon}`} title="iOS" aria-hidden="true" />}
      {showMobile && <i className={`fas fa-lg fa-mobile-alt ${styles.deviceIcon} ${styles.deviceIconMobile}`} title="Other mobile" aria-hidden="true" />}
    </span>
  )
}

const offerCategories = ['App Install', 'E-mail Submit', 'CC Submit', 'PIN Submit', 'Survey', 'Sweepstakes', 'Jobs', 'Rewards', 'Shopping', 'Finance', 'Gaming']
const incentiveOfferTypeOptions = ['CPI', 'CPE', 'SOI', 'CPL']
const standardOfferTypeOptions = ['CPL', 'CPE', 'CPI', 'SOI']

const campaignCountryLabels: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  BR: 'Brazil',
  TR: 'Turkey',
  MX: 'Mexico',
  AE: 'United Arab Emirates',
  MY: 'Malaysia',
  ID: 'Indonesia',
  JP: 'Japan',
  SA: 'Saudi Arabia',
  PH: 'Philippines',
  TH: 'Thailand',
  NL: 'Netherlands',
  HK: 'Hong Kong',
  DK: 'Denmark',
  NO: 'Norway',
  SE: 'Sweden',
  BE: 'Belgium',
}

/** Catalog starts empty — only manager-added offers (localStorage) appear. */
const seedCampaignOffers: CampaignOffer[] = []
const seedIncentiveOffers: CampaignOffer[] = []
const allSeedCampaignOffers = [...seedCampaignOffers, ...seedIncentiveOffers]

const mergeCampaignOverride = (source: CampaignOffer, override?: CampaignOffer): CampaignOffer => {
  if (!override) return source
  const merged = {
    ...source,
    ...override,
    isHot: override.isHot ?? source.isHot,
    status: override.status ?? source.status,
    countries: override.countries ?? source.countries,
  }
  // Prefer Affmine preview_i thumbs for incentive seeds when an old campaigns/ override is stuck in localStorage.
  if (
    source.placement === 'INCENTIVE'
    && source.imageSource?.includes('/affmine/preview_i/')
    && override.imageSource?.includes('/affmine/campaigns/')
  ) {
    merged.imageSource = source.imageSource
  }
  return merged
}

const campaignFlagEmoji = (country: string) => country.toUpperCase()
  .split('')
  .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
  .join('')

const featuredCampaignsFromOffers = (campaigns: CampaignOffer[]): FeaturedCampaign[] => {
  const toFeatured = (campaign: CampaignOffer): FeaturedCampaign => ({
    id: campaign.id,
    name: campaign.name,
    payout: `$${campaign.payout.toFixed(2)}`,
    geo: campaignCountryLabels[campaign.country] ?? campaign.country,
    country: campaign.country,
    category: campaign.category ?? 'E-mail Submit',
    imageSource: campaign.imageSource
      || (campaign.placement === 'INCENTIVE'
        ? `/affmine/preview_i/${campaign.id}.png`
        : `/affmine/campaigns/${campaign.id}.png`),
    placement: campaign.placement ?? 'STANDARD',
    action: campaign.action,
    requiresApproval: campaign.requiresApproval,
  })

  // Dashboard featured carousel = HOT non-incent browse offers with real creatives.
  const hotStandard = campaigns.filter((campaign) => (
    campaign.isHot
    && campaign.status !== 'PAUSED'
    && campaign.placement !== 'INCENTIVE'
  ))
  if (hotStandard.length) return hotStandard.map(toFeatured)

  // Fallback: any HOT offer, then newest active standard offers.
  const hotAny = campaigns.filter((campaign) => campaign.isHot && campaign.status !== 'PAUSED')
  if (hotAny.length) return hotAny.map(toFeatured)

  return campaigns
    .filter((campaign) => campaign.status !== 'PAUSED' && campaign.placement !== 'INCENTIVE')
    .slice(0, 8)
    .map(toFeatured)
}

const chartClicks = Array.from({ length: 24 }, () => 0)

const PENDING_OFFER_HINT = 'Awaiting manager approval'
const pendingOfferNotice = (offerId: string) => (
  `Offer #${offerId} is awaiting manager approval.`
)
const DASHBOARD_NOTICE_KEY = 'affmine.dashboardNotice'

const reportPages: Record<string, { title: string; columns: string[] }> = {
  '/reports/daily': { title: 'Daily Reports', columns: ['Date', 'Revenue', 'Clicks', 'Leads', 'EPC', 'CR'] },
  '/reports/campaign': { title: 'Campaign Reports', columns: ['Campaign', 'Revenue', 'Clicks', 'Leads', 'EPC', 'CR'] },
  '/reports/geo': { title: 'Geo Reports', columns: ['Country', 'Revenue', 'Clicks', 'Leads', 'EPC', 'CR'] },
  '/reports/tool': { title: 'Tool Reports', columns: ['Tool ID', 'Name', 'Revenue', 'Clicks', 'Leads', 'EPC', 'CR'] },
  '/reports/subid': { title: 'SubID Reports', columns: ['SubID', 'Revenue', 'Clicks', 'Leads', 'EPC', 'CR'] },
  '/reports/conversions': { title: 'Conversions', columns: ['Date & time', 'Campaign', 'Country', 'Device', 'SubID', 'Revenue', 'Status'] },
}

const tablePages: Record<string, { title: string; columns: string[] }> = {
  '/campaigns/browse': { title: 'Browse campaigns', columns: ['ID', 'View', 'Name', 'Payout', 'Category', 'Geo', 'Device', 'Action'] },
  '/campaigns/new': { title: 'New campaigns', columns: ['ID', 'View', 'Name', 'Payout', 'Category', 'Geo', 'Device', 'Action'] },
  '/incentive_offers': { title: '', columns: ['Active', 'ID', 'View', 'Name', 'Payout', 'Category', 'Geo', 'Device', 'Action'] },
  '/campaigns/approvals': { title: 'Offer Approval', columns: ['ID', 'View', 'Offer', 'Publisher', 'Payout', 'Geo', 'Submitted', 'Status', 'Action'] },
  '/account/publishers': { title: 'Publishers', columns: ['Publisher', 'Email', 'Joined', 'Last login', 'Status', 'Action'] },
  '/payments': { title: 'Payments', columns: ['Period', 'Amount Paid', 'Method', 'Status', 'Invoice'] },
}

const pageTitles: Record<string, string> = {
  '/campaigns/add': 'Add offer',
  '/campaigns/approvals': 'Offer Approval',
  '/tools/postback': 'Global Postback',
  '/tools/api': 'API',
  '/contentlocker': 'Content Locker',
  '/offerwall': 'OfferWall',
  '/account/settings': 'Account',
  '/account/referral': 'Account',
  '/account/publishers': 'Publishers',
  '/support': 'Support',
  '/terms': 'Terms & Conditions',
  '/privacy': 'Privacy Policy',
}

type AccountDetailsForm = {
  firstName: string
  lastName: string
  email: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  companyName: string
  companyAddress: string
  companyCity: string
  companyState: string
  companyZipCode: string
  companyCountry: string
  leadNotifications: boolean
  campaignEmailUpdates: boolean
}

type SupportMessageRecord = {
  id: string
  body: string
  createdAt: string
  senderId: string
  sender: { id: string; username: string; role: string; fullName?: string | null }
}

type SupportConversationRecord = {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  publisherId: string
  managerId?: string | null
  publisher?: { id: string; username: string; fullName?: string | null; email?: string } | null
  manager?: { id: string; username: string; fullName?: string | null } | null
  messages: SupportMessageRecord[]
}

const emptyAccountDetails: AccountDetailsForm = {
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  companyName: '',
  companyAddress: '',
  companyCity: '',
  companyState: '',
  companyZipCode: '',
  companyCountry: '',
  leadNotifications: true,
  campaignEmailUpdates: true,
}

const reportRangePresets = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1, span: 0 },
  { label: 'Last 7 Days', days: 6 },
  { label: 'Last 30 Days', days: 29 },
  { label: 'This Month', days: 'month' as const },
  { label: 'Last Month', days: 'last-month' as const },
] as const

function formatReportDateLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

const seedIncentiveOfferIdSet = new Set(seedIncentiveOffers.map((offer) => offer.id))
const isMenuItemActive = (pathname: string, href: string, options?: { incentiveDetail?: boolean }) => {
  if (pathname === href) return true
  if (href === '/contentlocker' && pathname.startsWith('/contentlocker/')) return true
  if (href === '/offerwall' && pathname.startsWith('/offerwall/')) return true
  const campaignMatch = pathname.match(/^\/campaigns\/(\d+)$/)
  if (!campaignMatch) return false
  const isIncentiveDetail = options?.incentiveDetail ?? seedIncentiveOfferIdSet.has(campaignMatch[1])
  if (href === '/incentive_offers') return isIncentiveDetail
  if (href === '/campaigns/browse') return !isIncentiveDetail
  return false
}

export default function DashboardOverview() {
  const router = useRouter()
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [desktopSidebarHidden, setDesktopSidebarHidden] = useState(false)
  const [search, setSearch] = useState('')
  const [newsOpen, setNewsOpen] = useState(false)
  const [tickerHtml, setTickerHtml] = useState('')
  const [tickerTyping, setTickerTyping] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const [campaignIndex, setCampaignIndex] = useState(0)
  const [previousCampaignIndex, setPreviousCampaignIndex] = useState<number | null>(null)
  const [campaignMotion, setCampaignMotion] = useState<'left' | 'right'>('left')
  const [campaignSearch, setCampaignSearch] = useState('')
  const [customCampaignOffers, setCustomCampaignOffers] = useState<CampaignOffer[]>([])
  const [managedCampaignOverrides, setManagedCampaignOverrides] = useState<CampaignOffer[]>([])
  const [deletedCampaignIds, setDeletedCampaignIds] = useState<string[]>([])
  const [activeIncentiveOfferIds, setActiveIncentiveOfferIds] = useState<string[]>([])
  const [openOfferActionsId, setOpenOfferActionsId] = useState<string | null>(null)
  const [offerActionMenuPosition, setOfferActionMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [offerDraft, setOfferDraft] = useState<OfferDraft>(initialOfferDraft)
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null)
  const [offerPlacement, setOfferPlacement] = useState<'STANDARD' | 'INCENTIVE'>('STANDARD')
  const [offerFormError, setOfferFormError] = useState('')
  const [geoSearch, setGeoSearch] = useState('')
  const [imagePreviewState, setImagePreviewState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [showCampaignFilters, setShowCampaignFilters] = useState(false)
  const [campaignFilters, setCampaignFilters] = useState({ country: 'All', device: 'All', category: 'All', type: 'All' })
  const [appliedCampaignFilters, setAppliedCampaignFilters] = useState({ country: 'All', device: 'All', category: 'All', type: 'All' })
  const [campaignSort, setCampaignSort] = useState<{ key: 'id' | 'name' | 'payout' | 'featured'; direction: 'asc' | 'desc' }>({ key: 'featured', direction: 'asc' })
  const [campaignPage, setCampaignPage] = useState(1)
  const [reportRange, setReportRange] = useState('Nov 5, 2026 - Nov 11, 2026')
  const [reportStartDate, setReportStartDate] = useState('2026-11-05')
  const [reportEndDate, setReportEndDate] = useState('2026-11-11')
  const [showReportDates, setShowReportDates] = useState(false)
  const [pageSearch, setPageSearch] = useState('')
  const [postbackEnabled, setPostbackEnabled] = useState(true)
  const [postbackUrl, setPostbackUrl] = useState('')
  const [pageNotice, setPageNotice] = useState('')
  const [accountDetails, setAccountDetails] = useState<AccountDetailsForm>(emptyAccountDetails)
  const [accountSaving, setAccountSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', repeatPassword: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordNotice, setPasswordNotice] = useState('')
  const [supportConversations, setSupportConversations] = useState<SupportConversationRecord[]>([])
  const [supportConversation, setSupportConversation] = useState<SupportConversationRecord | null>(null)
  const [supportDraft, setSupportDraft] = useState('')
  const [supportSending, setSupportSending] = useState(false)
  const [supportLoading, setSupportLoading] = useState(false)
  const [selectedSupportId, setSelectedSupportId] = useState<string | null>(null)
  const [supportMessengerOpen, setSupportMessengerOpen] = useState(false)
  const [supportMessengerTab, setSupportMessengerTab] = useState<'home' | 'messages'>('home')
  const supportThreadRef = useRef<HTMLDivElement>(null)
  const supportPopupThreadRef = useRef<HTMLDivElement>(null)
  const supportComposerRef = useRef<HTMLTextAreaElement>(null)
  const [trackingSubIds, setTrackingSubIds] = useState(['', '', '', ''])
  const [generatedTrackingUrl, setGeneratedTrackingUrl] = useState(defaultCampaignTrackingUrl)
  const [trackingMessage, setTrackingMessage] = useState('')
  const [campaignNoticeOpen, setCampaignNoticeOpen] = useState(false)
  const [campaignPreviewOpen, setCampaignPreviewOpen] = useState(false)
  const [applyCampaignId, setApplyCampaignId] = useState<string | null>(null)
  const [applyTermsAccepted, setApplyTermsAccepted] = useState(false)
  const [applyTermsError, setApplyTermsError] = useState(false)
  const campaignDialogCloseRef = useRef<HTMLButtonElement>(null)
  const [wizardStep, setWizardStep] = useState(0)
  const [wizardFields, setWizardFields] = useState<Record<string, string>>({})
  const [wizardToggles, setWizardToggles] = useState({ showLock: true, roundCurrency: true, hideCurrency: false })
  const [contentLockers, setContentLockers] = useState<IncentiveToolRecord[]>([])
  const [offerwalls, setOfferwalls] = useState<IncentiveToolRecord[]>([])
  const [editingToolId, setEditingToolId] = useState<string | null>(null)
  const [wizardSelectedOfferIds, setWizardSelectedOfferIds] = useState<string[]>([])
  const [copiedToolId, setCopiedToolId] = useState<string | null>(null)
  const [appOrigin, setAppOrigin] = useState('')
  const [time, setTime] = useState('--:--:--')
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('Publisher')
  const supportFirstName = (userName || 'there').split(/\s+/)[0] || 'there'
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'MANAGER' | 'PUBLISHER' | null>(null)
  const [accountProfile, setAccountProfile] = useState<{
    publisherNumber: number | null
    createdAt: string | null
    lastLogin: string | null
  }>({ publisherNumber: null, createdAt: null, lastLogin: null })
  const intercomEnabled = hasIntercomApp()
  const isSupportPage = pathname === '/support'
  const isAccountSettings = pathname === '/account/settings'
  const openSupportMessenger = () => {
    setMobileNavOpen(false)
    setSupportMessengerTab('home')
    setSupportMessengerOpen(true)
  }
  const closeSupportMessenger = () => {
    setSupportMessengerOpen(false)
    setSupportMessengerTab('home')
  }
  const openSupportCompose = () => {
    setSupportMessengerTab('messages')
    window.setTimeout(() => supportComposerRef.current?.focus(), 80)
  }
  const [dismissingNoticeId, setDismissingNoticeId] = useState<string | null>(null)
  const [offerApplications, setOfferApplications] = useState<OfferApplicationRecord[]>([])
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [approvalCounts, setApprovalCounts] = useState({ ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 })
  const [approvalSearch, setApprovalSearch] = useState('')
  const [reviewingApplicationId, setReviewingApplicationId] = useState<string | null>(null)
  const [applySubmitting, setApplySubmitting] = useState(false)
  const [publisherAccounts, setPublisherAccounts] = useState<PublisherAccountRecord[]>([])
  const [publisherStatusFilter, setPublisherStatusFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'DISABLED' | 'REJECTED'>('ALL')
  const [publisherSearch, setPublisherSearch] = useState('')
  const [updatingPublisherId, setUpdatingPublisherId] = useState<string | null>(null)
  const [publisherCounts, setPublisherCounts] = useState({ ALL: 0, PENDING: 0, ACTIVE: 0, DISABLED: 0, REJECTED: 0 })

  useEffect(() => {
    try {
      const savedOffers = window.localStorage.getItem(customOffersStorageKey)
      const parsedOffers = savedOffers ? JSON.parse(savedOffers) as unknown : []
      if (Array.isArray(parsedOffers)) {
        setCustomCampaignOffers(parsedOffers.filter((offer): offer is CampaignOffer => (
          typeof offer?.id === 'string'
          && typeof offer?.name === 'string'
          && typeof offer?.payout === 'number'
          && typeof offer?.country === 'string'
        )))
      }
      const savedOverrides = window.localStorage.getItem(campaignOverridesStorageKey)
      const parsedOverrides = savedOverrides ? JSON.parse(savedOverrides) as unknown : []
      const savedOffersForActive = Array.isArray(parsedOffers)
        ? parsedOffers.filter((offer): offer is CampaignOffer => (
          typeof offer?.id === 'string'
          && typeof offer?.name === 'string'
          && typeof offer?.payout === 'number'
          && typeof offer?.country === 'string'
        ))
        : []
      const realOfferIdSet = new Set(savedOffersForActive.map((offer) => offer.id))
      if (Array.isArray(parsedOverrides)) {
        // Drop overrides for removed demo/seed catalogs — only keep edits to real custom offers.
        const cleanedOverrides = parsedOverrides.filter((offer): offer is CampaignOffer => (
          typeof offer?.id === 'string'
          && realOfferIdSet.has(offer.id)
          && typeof offer?.name === 'string'
          && typeof offer?.payout === 'number'
          && typeof offer?.country === 'string'
        ))
        setManagedCampaignOverrides(cleanedOverrides)
        window.localStorage.setItem(campaignOverridesStorageKey, JSON.stringify(cleanedOverrides))
      }
      // Demo seed deletions are obsolete once the hardcoded catalog is empty.
      setDeletedCampaignIds([])
      window.localStorage.setItem(deletedCampaignsStorageKey, JSON.stringify([]))
      const realIncentiveIdSet = new Set(
        savedOffersForActive
          .filter((offer) => offer.placement === 'INCENTIVE')
          .map((offer) => offer.id),
      )
      const savedActiveIncentive = window.localStorage.getItem(activeIncentiveOffersStorageKey)
      const parsedActiveIncentive = savedActiveIncentive ? JSON.parse(savedActiveIncentive) as unknown : null
      if (Array.isArray(parsedActiveIncentive)) {
        // Keep only IDs that still exist as real user-added incentive offers.
        const nextActive = parsedActiveIncentive.filter((id): id is string => (
          typeof id === 'string' && realIncentiveIdSet.has(id)
        ))
        setActiveIncentiveOfferIds(nextActive)
        window.localStorage.setItem(activeIncentiveOffersStorageKey, JSON.stringify(nextActive))
      } else {
        const nextActive = [...realIncentiveIdSet]
        setActiveIncentiveOfferIds(nextActive)
        window.localStorage.setItem(activeIncentiveOffersStorageKey, JSON.stringify(nextActive))
      }

      const savedLockers = window.localStorage.getItem(contentLockersStorageKey)
      const savedWalls = window.localStorage.getItem(offerwallsStorageKey)
      setContentLockers(parseToolList(savedLockers ? JSON.parse(savedLockers) as unknown : [], 'locker'))
      setOfferwalls(parseToolList(savedWalls ? JSON.parse(savedWalls) as unknown : [], 'offerwall'))
    } catch {
      setCustomCampaignOffers([])
      setManagedCampaignOverrides([])
      setDeletedCampaignIds([])
      setActiveIncentiveOfferIds([])
      setContentLockers([])
      setOfferwalls([])
    }
  }, [])

  useEffect(() => {
    setAppOrigin(window.location.origin)
    const updateTime = () => setTime(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).format(new Date()))
    updateTime()
    const timer = window.setInterval(updateTime, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    // Match Affmine: new Typed(".new-updates", { strings, typeSpeed: 70, loop: true })
    // Typed.js defaults: backSpeed: 0, backDelay: 700
    let messageIndex = 0
    let characterIndex = 0
    let deleting = false
    let timer = 0
    let cancelled = false

    const humanize = (speed: number) => Math.round(Math.random() * speed / 2) + speed

    const tick = () => {
      if (cancelled) return
      const fullHtml = topbarUpdateStrings[messageIndex]
      const fullLen = visibleHtmlLength(fullHtml)

      if (deleting) {
        characterIndex = Math.max(0, characterIndex - 1)
        setTickerHtml(sliceHtmlByVisibleChars(fullHtml, characterIndex))
        setTickerTyping(true)
        if (characterIndex === 0) {
          deleting = false
          messageIndex = (messageIndex + 1) % topbarUpdateStrings.length
          timer = window.setTimeout(tick, humanize(0))
          return
        }
        timer = window.setTimeout(tick, humanize(0))
        return
      }

      characterIndex = Math.min(fullLen, characterIndex + 1)
      setTickerHtml(sliceHtmlByVisibleChars(fullHtml, characterIndex))
      if (characterIndex === fullLen) {
        setTickerTyping(false)
        deleting = true
        timer = window.setTimeout(tick, 700)
        return
      }
      setTickerTyping(true)
      timer = window.setTimeout(tick, humanize(70))
    }

    timer = window.setTimeout(tick, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    let active = true
    const applyProfile = (profile: AccountDetailsForm & {
      publisherNumber?: number | null
      createdAt?: string | null
      lastLogin?: string | null
    }) => {
      setAccountDetails({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        country: profile.country || '',
        companyName: profile.companyName || '',
        companyAddress: profile.companyAddress || '',
        companyCity: profile.companyCity || '',
        companyState: profile.companyState || '',
        companyZipCode: profile.companyZipCode || '',
        companyCountry: profile.companyCountry || '',
        leadNotifications: profile.leadNotifications !== false,
        campaignEmailUpdates: profile.campaignEmailUpdates !== false,
      })
      setAccountProfile({
        publisherNumber: typeof profile.publisherNumber === 'number' ? profile.publisherNumber : null,
        createdAt: profile.createdAt ?? null,
        lastLogin: profile.lastLogin ?? null,
      })
      if (profile.firstName || profile.lastName) {
        setUserName([profile.firstName, profile.lastName].filter(Boolean).join(' '))
      }
      if (profile.email) setUserEmail(profile.email)
    }

    // Seed identity immediately from /me, then hydrate full Affmine fields from /profile.
    void Promise.all([
      fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' }),
      fetch('/api/account/profile', { credentials: 'include', cache: 'no-store' }),
    ])
      .then(async ([meResponse, profileResponse]) => {
        if (meResponse.ok) {
          const user = await meResponse.json() as {
            id?: string
            email?: string | null
            fullName?: string | null
            username?: string
            role?: 'MANAGER' | 'PUBLISHER'
            publisherNumber?: number | null
            createdAt?: string | null
            lastLogin?: string | null
          }
          if (!active) return
          setUserId(user.id ?? null)
          setUserEmail(user.email ?? null)
          setUserName(user.fullName?.trim() || user.username || 'Publisher')
          setUserRole(user.role === 'MANAGER' ? 'MANAGER' : 'PUBLISHER')
          setAccountProfile({
            publisherNumber: typeof user.publisherNumber === 'number' ? user.publisherNumber : null,
            createdAt: user.createdAt ?? null,
            lastLogin: user.lastLogin ?? null,
          })
          // Instant first paint for permanent fields before profile returns.
          const parts = (user.fullName || '').trim().split(/\s+/).filter(Boolean)
          setAccountDetails((current) => ({
            ...current,
            firstName: current.firstName || parts[0] || '',
            lastName: current.lastName || parts.slice(1).join(' ') || '',
            email: current.email || user.email || '',
          }))
        }

        if (profileResponse.ok) {
          const data = await profileResponse.json() as {
            profile?: AccountDetailsForm & {
              publisherNumber?: number | null
              createdAt?: string | null
              lastLogin?: string | null
            }
          }
          if (!active || !data.profile) return
          applyProfile(data.profile)
        }
      })
      .catch((requestError: unknown) => {
        console.error('Unable to load the dashboard account profile:', requestError)
      })
    return () => { active = false }
  }, [])

  const loadOfferApplications = async (role: 'MANAGER' | 'PUBLISHER') => {
    const response = await fetch('/api/offer-applications', {
      credentials: 'include',
      cache: 'no-store',
    })
    if (!response.ok) return
    const data = await response.json() as { applications?: OfferApplicationRecord[] }
    const applications = Array.isArray(data.applications) ? data.applications : []
    setOfferApplications(applications)
    if (role === 'MANAGER') {
      setApprovalCounts({
        ALL: applications.length,
        PENDING: applications.filter((item) => item.status === 'PENDING').length,
        APPROVED: applications.filter((item) => item.status === 'APPROVED').length,
        REJECTED: applications.filter((item) => item.status === 'REJECTED').length,
      })
    }
  }

  const loadPublisherAccounts = async () => {
    const params = new URLSearchParams()
    if (publisherSearch.trim()) params.set('q', publisherSearch.trim())
    const query = params.toString() ? `?${params.toString()}` : ''
    const response = await fetch(`/api/publishers${query}`, {
      credentials: 'include',
      cache: 'no-store',
    })
    if (!response.ok) return
    const data = await response.json() as { publishers?: PublisherAccountRecord[] }
    const publishers = Array.isArray(data.publishers) ? data.publishers : []
    setPublisherAccounts(publishers)
    setPublisherCounts({
      ALL: publishers.length,
      PENDING: publishers.filter((item) => item.status === 'PENDING').length,
      ACTIVE: publishers.filter((item) => item.status === 'ACTIVE').length,
      DISABLED: publishers.filter((item) => item.status === 'DISABLED').length,
      REJECTED: publishers.filter((item) => item.status === 'REJECTED').length,
    })
  }

  useEffect(() => {
    if (!userRole) return
    let active = true
    loadOfferApplications(userRole)
      .catch((requestError: unknown) => {
        console.error('Unable to load offer applications:', requestError)
        if (active) {
          setOfferApplications([])
          setApprovalCounts({ ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 })
        }
      })
    return () => { active = false }
  }, [userRole, pathname])

  useEffect(() => {
    if (userRole !== 'MANAGER' || pathname !== '/account/publishers') return
    let active = true
    loadPublisherAccounts()
      .catch((requestError: unknown) => {
        console.error('Unable to load publishers:', requestError)
        if (active) {
          setPublisherAccounts([])
          setPublisherCounts({ ALL: 0, PENDING: 0, ACTIVE: 0, DISABLED: 0, REJECTED: 0 })
        }
      })
    return () => { active = false }
  }, [userRole, pathname])

  useEffect(() => {
    const activeFeaturedCampaigns = featuredCampaignsFromOffers(
      [...seedCampaignOffers, ...seedIncentiveOffers, ...customCampaignOffers]
        .filter((campaign) => !deletedCampaignIds.includes(campaign.id))
        .map((campaign) => mergeCampaignOverride(campaign, managedCampaignOverrides.find((override) => override.id === campaign.id))),
    )
    if (activeFeaturedCampaigns.length < 2) {
      setCampaignIndex(0)
      setPreviousCampaignIndex(null)
      return
    }

    const timer = window.setTimeout(() => {
      setPreviousCampaignIndex(campaignIndex % activeFeaturedCampaigns.length)
      setCampaignMotion('left')
      setCampaignIndex((index) => (index + 1) % activeFeaturedCampaigns.length)
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [campaignIndex, customCampaignOffers, managedCampaignOverrides, deletedCampaignIds])

  useEffect(() => {
    if (previousCampaignIndex === null) return
    const timer = window.setTimeout(() => setPreviousCampaignIndex(null), 600)
    return () => window.clearTimeout(timer)
  }, [campaignIndex, previousCampaignIndex])

  useEffect(() => {
    const detailId = pathname.split('/').pop() || ''
    const incentiveDetail = customCampaignOffers.some((offer) => offer.id === detailId && offer.placement === 'INCENTIVE')
    const activeGroup = menuGroups.find(({ items }) => items.some((item) => isMenuItemActive(pathname, item.href, { incentiveDetail })))?.label
    if (activeGroup) {
      setOpenGroups((groups) => groups.includes(activeGroup) ? groups : [...groups, activeGroup])
    }
  }, [pathname, customCampaignOffers])

  useEffect(() => {
    setMobileNavOpen(false)
    try {
      const storedNotice = window.sessionStorage.getItem(DASHBOARD_NOTICE_KEY)
      if (storedNotice) {
        setPageNotice(storedNotice)
        // Keep briefly so React Strict Mode remounts still see it.
        window.setTimeout(() => {
          try { window.sessionStorage.removeItem(DASHBOARD_NOTICE_KEY) } catch { /* ignore */ }
        }, 250)
      } else {
        setPageNotice('')
      }
    } catch {
      setPageNotice('')
    }
    setTrackingSubIds(['', '', '', ''])
    setGeneratedTrackingUrl(defaultCampaignTrackingUrl)
    setTrackingMessage('')
    setCampaignNoticeOpen(false)
    setCampaignPreviewOpen(false)
  }, [pathname])

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 760px)').matches) {
      setMobileNavOpen((open) => !open)
      return
    }
    setDesktopSidebarHidden((hidden) => !hidden)
  }

  useEffect(() => {
    if (!campaignNoticeOpen && !campaignPreviewOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCampaignNoticeOpen(false)
        setCampaignPreviewOpen(false)
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    campaignDialogCloseRef.current?.focus()
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [campaignNoticeOpen, campaignPreviewOpen])

  useEffect(() => {
    setWizardStep(0)
    setPageNotice('')
    setCopiedToolId(null)

    const lockerEdit = pathname.match(/^\/contentlocker\/edit\/([^/]+)$/)
    const wallEdit = pathname.match(/^\/offerwall\/edit\/([^/]+)$/)
    const isLockerNew = pathname === '/contentlocker/new'
    const isWallNew = pathname === '/offerwall/new'

    if (lockerEdit) {
      const tool = contentLockers.find((item) => item.id === lockerEdit[1])
      setEditingToolId(tool?.id ?? null)
      setWizardFields(tool ? { ...defaultLockerFields, ...tool.fields } : { ...defaultLockerFields })
      setWizardToggles(tool?.toggles ?? { ...defaultLockerToggles })
      setWizardSelectedOfferIds(tool?.selectedOfferIds ?? [])
      return
    }
    if (wallEdit) {
      const tool = offerwalls.find((item) => item.id === wallEdit[1])
      setEditingToolId(tool?.id ?? null)
      setWizardFields(tool ? { ...defaultOfferwallFields, ...tool.fields } : { ...defaultOfferwallFields })
      setWizardToggles(tool?.toggles ?? { ...defaultOfferwallToggles })
      setWizardSelectedOfferIds(tool?.selectedOfferIds ?? [])
      return
    }
    if (isLockerNew) {
      setEditingToolId(null)
      setWizardFields({ ...defaultLockerFields })
      setWizardToggles({ ...defaultLockerToggles })
      setWizardSelectedOfferIds([])
      return
    }
    if (isWallNew) {
      setEditingToolId(null)
      setWizardFields({ ...defaultOfferwallFields })
      setWizardToggles({ ...defaultOfferwallToggles })
      setWizardSelectedOfferIds([])
      return
    }

    setEditingToolId(null)
    setWizardFields({})
    setWizardToggles({ showLock: true, roundCurrency: true, hideCurrency: false })
    setWizardSelectedOfferIds([])
  }, [pathname, contentLockers, offerwalls])

  useEffect(() => {
    if ((pathname === '/campaigns/add' || pathname === '/campaigns/approvals' || pathname === '/account/publishers') && userRole === 'PUBLISHER') {
      router.replace('/campaigns/browse')
    }
  }, [pathname, userRole, router])

  useEffect(() => {
    if ((!isSupportPage && !supportMessengerOpen) || !userRole) return
    let active = true
    setSupportLoading(true)
    const query = userRole === 'MANAGER' && selectedSupportId ? `?conversationId=${encodeURIComponent(selectedSupportId)}` : ''
    fetch(`/api/support${query}`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return
        const data = await response.json() as {
          conversation?: SupportConversationRecord | null
          conversations?: SupportConversationRecord[]
        }
        if (!active) return
        if (userRole === 'MANAGER') {
          if (selectedSupportId && data.conversation) {
            setSupportConversation(data.conversation)
          } else if (Array.isArray(data.conversations)) {
            setSupportConversations(data.conversations)
            if (!selectedSupportId && data.conversations[0]) {
              setSelectedSupportId(data.conversations[0].id)
            }
          }
        } else {
          setSupportConversation(data.conversation ?? null)
        }
      })
      .catch((requestError: unknown) => {
        console.error('Unable to load support:', requestError)
      })
      .finally(() => {
        if (active) setSupportLoading(false)
      })
    return () => { active = false }
  }, [isSupportPage, supportMessengerOpen, userRole, selectedSupportId])

  useEffect(() => {
    const thread = supportPopupThreadRef.current || supportThreadRef.current
    if (!thread) return
    thread.scrollTop = thread.scrollHeight
  }, [supportConversation?.messages.length, supportMessengerOpen])

  useEffect(() => {
    if (pathname === '/incentive_offers') {
      setCampaignSort({ key: 'featured', direction: 'asc' })
      setCampaignPage(1)
    } else if (pathname === '/campaigns/browse' || pathname === '/campaigns/new') {
      setCampaignSort({ key: 'id', direction: 'desc' })
      setCampaignPage(1)
    }
  }, [pathname])

  useEffect(() => {
    if (pathname !== '/campaigns/add') {
      setEditingOfferId(null)
      setOfferPlacement('STANDARD')
      return
    }

    const searchParams = new URLSearchParams(window.location.search)
    const offerId = searchParams.get('edit')
    const nextPlacement = searchParams.get('placement') === 'incentive' ? 'INCENTIVE' : 'STANDARD'
    setOfferPlacement(nextPlacement)
    setEditingOfferId(offerId)
    setOfferFormError('')
    setGeoSearch('')
    setImagePreviewState('idle')
    if (!offerId) {
      setOfferDraft(nextPlacement === 'INCENTIVE' ? initialIncentiveOfferDraft : initialOfferDraft)
    }
  }, [pathname])

  useEffect(() => {
    if (!editingOfferId) return
    if (userRole !== 'MANAGER') {
      if (userRole === 'PUBLISHER') router.replace('/campaigns/browse')
      return
    }

    const sourceOffer = [...allSeedCampaignOffers, ...customCampaignOffers].find((offer) => offer.id === editingOfferId)
    const override = managedCampaignOverrides.find((candidate) => candidate.id === editingOfferId)
    const offer = sourceOffer ? mergeCampaignOverride(sourceOffer, override) : undefined
    if (!offer || deletedCampaignIds.includes(editingOfferId)) {
      setOfferFormError('This offer is no longer available to edit.')
      return
    }

    const geos = offer.countries?.length ? offer.countries : [offer.country]
    const nextImage = new URL(
      offer.imageSource || (offer.placement === 'INCENTIVE' ? `/affmine/preview_i/${offer.id}.png` : `/affmine/campaigns/${offer.id}.png`),
      window.location.origin,
    ).toString()
    setImagePreviewState(nextImage ? 'loading' : 'idle')
    setOfferDraft({
      ...offer,
      payout: String(offer.payout),
      offerTypes: offer.offerTypes?.length
        ? offer.offerTypes
        : (offer.placement === 'INCENTIVE' ? ['CPI'] : ['CPL', 'SOI']),
      requiresApproval: offer.placement === 'INCENTIVE' ? false : offerRequiresApproval(offer),
      device: getCampaignDevices(offer),
      country: geos[0] ?? offer.country,
      countries: geos,
      imageSource: nextImage,
      offerLink: offer.offerLink ?? '',
    })
    setOfferPlacement(offer.placement ?? (new URLSearchParams(window.location.search).get('placement') === 'incentive' ? 'INCENTIVE' : 'STANDARD'))
  }, [editingOfferId, userRole, customCampaignOffers, managedCampaignOverrides, deletedCampaignIds, router])

  useEffect(() => {
    if (!openOfferActionsId) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-offer-action-menu]')) {
        setOpenOfferActionsId(null)
        setOfferActionMenuPosition(null)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenOfferActionsId(null)
        setOfferActionMenuPosition(null)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [openOfferActionsId])

  useEffect(() => {
    // Affmine Intercom without identity secret mounts a blank overlay that
    // blocks clicks. Tear it down and use the project Support messenger.
    shutdownIntercomMessenger()
  }, [])

  useEffect(() => {
    // Only boot Affmine Intercom when identity hash is available.
    if (!intercomEnabled || !userId || !userRole) return
    let active = true
    const boot = async () => {
      let userHash: string | null = null
      try {
        const response = await fetch('/api/intercom/identity', { credentials: 'include', cache: 'no-store' })
        if (response.ok) {
          const data = await response.json() as { userHash?: string | null }
          userHash = data.userHash ?? null
        }
      } catch {
        // Identity hash required for this Intercom app; skip boot without it.
      }
      if (!active) return
      if (!userHash) {
        shutdownIntercomMessenger()
        return
      }
      bootIntercomMessenger({
        userId,
        name: userName,
        email: userEmail,
        createdAt: accountProfile.createdAt,
        publisherNumber: accountProfile.publisherNumber,
        managerName: 'John',
        totalPaid: '0',
        userHash,
      })
    }
    void boot()
    return () => { active = false }
  }, [intercomEnabled, userId, userRole, userName, userEmail, accountProfile.createdAt, accountProfile.publisherNumber])

  useEffect(() => {
    if (!isSupportPage) return
    // Affmine Support opens the messenger popup (not a blank page).
    if (userRole === 'PUBLISHER') {
      router.replace('/dashboard')
    }
    window.setTimeout(() => {
      setSupportMessengerOpen(true)
    }, 80)
  }, [isSupportPage, userRole, router])

  const signOut = async () => {
    setIsSigningOut(true)
    setError('')
    try {
      shutdownIntercomMessenger()
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(result?.error || 'Unable to sign out. Please try again.')
      }
      router.replace('/login')
      router.refresh()
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Unable to sign out. Please try again.')
      setIsSigningOut(false)
    }
  }

  const toggleGroup = (label: string) => {
    setOpenGroups((groups) => groups.includes(label) ? groups.filter((group) => group !== label) : [...groups, label])
  }

  const moveCampaign = (direction: -1 | 1) => {
    if (featuredCampaigns.length < 2) return
    setPreviousCampaignIndex(campaignIndex % featuredCampaigns.length)
    setCampaignMotion(direction === 1 ? 'left' : 'right')
    setCampaignIndex((index) => (index + direction + featuredCampaigns.length) % featuredCampaigns.length)
  }

  const applyCampaignFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAppliedCampaignFilters(campaignFilters)
    setCampaignPage(1)
  }

  const resetCampaignFilters = () => {
    const emptyFilters = { country: 'All', device: 'All', category: 'All', type: 'All' }
    setCampaignFilters(emptyFilters)
    setAppliedCampaignFilters(emptyFilters)
    setCampaignSearch('')
    setCampaignPage(1)
  }

  const updateOfferDraft = (field: keyof OfferDraft, value: string) => {
    setOfferDraft((draft) => ({ ...draft, [field]: value }))
    if (field === 'imageSource') setImagePreviewState(value.trim() ? 'loading' : 'idle')
  }

  const getDraftGeos = (draft: OfferDraft = offerDraft) => {
    if (draft.countries?.length) return draft.countries
    if (draft.country) return [draft.country]
    return []
  }

  const setDraftGeos = (geos: string[]) => {
    setOfferDraft((draft) => ({ ...draft, countries: geos, country: geos[0] ?? '' }))
  }

  const toggleDraftGeo = (geo: string) => {
    setOfferDraft((draft) => {
      const current = draft.countries?.length
        ? draft.countries
        : (draft.country ? [draft.country] : [])
      const next = current.includes(geo)
        ? current.filter((value) => value !== geo)
        : [...current, geo]
      return { ...draft, countries: next, country: next[0] ?? '' }
    })
  }

  const previewImageSrc = (() => {
    const raw = (offerDraft.imageSource ?? '').trim()
    if (!raw) return ''
    if (raw.startsWith('/') && !raw.startsWith('//')) return raw
    try {
      const parsed = new URL(raw)
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : ''
    } catch {
      return ''
    }
  })()

  const toggleOfferType = (type: string) => {
    setOfferDraft((draft) => ({
      ...draft,
      offerTypes: draft.offerTypes.includes(type)
        ? draft.offerTypes.filter((selectedType) => selectedType !== type)
        : [...draft.offerTypes, type],
    }))
  }

  const toggleOfferDevice = (device: string) => {
    setOfferDraft((draft) => ({
      ...draft,
      device: draft.device.includes(device)
        ? draft.device.filter((selectedDevice) => selectedDevice !== device)
        : [...draft.device, device],
    }))
  }

  const submitOffer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setOfferFormError('')

    if (userRole !== 'MANAGER') {
      setOfferFormError('Manager access is required to manage offers.')
      return
    }

    const id = offerDraft.id.trim()
    const name = offerDraft.name.trim()
    const payout = Number(offerDraft.payout)
    const imageSource = (offerDraft.imageSource ?? '').trim()
    const offerLink = (offerDraft.offerLink ?? '').trim()
    const description = (offerDraft.description ?? '').trim()

    if (!/^\d+$/.test(id) || Number(id) <= 0) {
      setOfferFormError('Enter a numeric offer ID.')
      return
    }
    if ([...allSeedCampaignOffers, ...customCampaignOffers].some((campaign) => campaign.id === id && campaign.id !== editingOfferId)) {
      setOfferFormError('An offer with this ID already exists.')
      return
    }
    if (!name || !Number.isFinite(payout) || payout <= 0 || !description || offerDraft.device.length === 0 || !imageSource || (!editingOfferId && !offerLink)) {
      setOfferFormError('Complete the required offer details and select at least one device.')
      return
    }
    const isValidHttpOrPath = (value: string) => {
      if (value.startsWith('/') && !value.startsWith('//')) return true
      try {
        return ['http:', 'https:'].includes(new URL(value).protocol)
      } catch {
        return false
      }
    }
    if (!isValidHttpOrPath(imageSource) || (offerLink && !isValidHttpOrPath(offerLink))) {
      setOfferFormError('Enter valid image and offer URLs (https://… or /affmine/…).')
      return
    }

    const sourceOffer = [...allSeedCampaignOffers, ...customCampaignOffers].find((campaign) => campaign.id === id)
    const override = managedCampaignOverrides.find((campaign) => campaign.id === id)
    const existingOffer = sourceOffer ? mergeCampaignOverride(sourceOffer, override) : undefined
    const placement = existingOffer?.placement ?? offerPlacement
    const isIncentive = placement === 'INCENTIVE'
    // Incentive catalog is Content Locker / OfferWall only — default open View, no Apply gate.
    const requiresApproval = isIncentive ? false : offerDraft.requiresApproval
    const selectedGeos = Array.from(new Set(
      (offerDraft.countries?.length
        ? offerDraft.countries
        : (offerDraft.country ? [offerDraft.country] : []))
        .map((geo) => geo.trim().toUpperCase())
        .filter(Boolean),
    ))
    if (!selectedGeos.length) {
      setOfferFormError('Select at least one geo.')
      return
    }
    const primaryCountry = selectedGeos[0]
    const newOffer: CampaignOffer = {
      ...offerDraft,
      id,
      name,
      payout,
      imageSource,
      offerLink,
      country: primaryCountry,
      countries: selectedGeos.length > 1 ? selectedGeos : undefined,
      category: offerDraft.category ?? (isIncentive ? 'App Install' : 'E-mail Submit'),
      description,
      requiresApproval,
      // Catalog access for publishers without an application: Apply if approval is required, otherwise open View.
      action: requiresApproval ? 'Apply' : 'View',
      isHot: existingOffer?.isHot ?? false,
      status: existingOffer?.status ?? 'ACTIVE',
      placement,
      createdAt: existingOffer?.createdAt ?? new Date().toISOString(),
    }
    try {
      if (editingOfferId && allSeedCampaignOffers.some((campaign) => campaign.id === editingOfferId)) {
        const updatedOverrides = [...managedCampaignOverrides.filter((campaign) => campaign.id !== id), newOffer]
        window.localStorage.setItem(campaignOverridesStorageKey, JSON.stringify(updatedOverrides))
        setManagedCampaignOverrides(updatedOverrides)
      } else {
        const updatedOffers = editingOfferId
          ? [...customCampaignOffers.filter((campaign) => campaign.id !== id), newOffer]
          : [...customCampaignOffers, newOffer]
        window.localStorage.setItem(customOffersStorageKey, JSON.stringify(updatedOffers))
        setCustomCampaignOffers(updatedOffers)
      }
      if (isIncentive) {
        let savedActive: string[] = activeIncentiveOfferIds
        try {
          const raw = window.localStorage.getItem(activeIncentiveOffersStorageKey)
          const parsed = raw ? JSON.parse(raw) as unknown : null
          if (Array.isArray(parsed)) {
            savedActive = parsed.filter((value): value is string => typeof value === 'string')
          }
        } catch {
          savedActive = activeIncentiveOfferIds
        }
        const nextActive = savedActive.includes(id) ? savedActive : [...savedActive, id]
        window.localStorage.setItem(activeIncentiveOffersStorageKey, JSON.stringify(nextActive))
        setActiveIncentiveOfferIds(nextActive)
      }
    } catch {
      setOfferFormError('Offer could not be saved in this browser.')
      return
    }

    setOfferDraft(isIncentive ? initialIncentiveOfferDraft : initialOfferDraft)
    setEditingOfferId(null)
    setCampaignSearch('')
    setAppliedCampaignFilters({ country: 'All', device: 'All', category: 'All', type: 'All' })
    setCampaignFilters({ country: 'All', device: 'All', category: 'All', type: 'All' })
    setCampaignPage(1)
    router.push(isIncentive ? '/incentive_offers' : '/campaigns/browse')
  }

  const sortCampaignsBy = (key: 'id' | 'name' | 'payout') => {
    setCampaignSort((sort) => ({
      key,
      direction: sort.key === key && sort.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  const applyReportDates = (start = reportStartDate, end = reportEndDate) => {
    setReportStartDate(start)
    setReportEndDate(end)
    setReportRange(`${formatReportDateLabel(start)} - ${formatReportDateLabel(end)}`)
    setShowReportDates(false)
  }

  const applyReportPreset = (preset: (typeof reportRangePresets)[number]) => {
    const end = new Date()
    end.setHours(12, 0, 0, 0)
    const start = new Date(end)

    if (preset.days === 'month') {
      start.setDate(1)
    } else if (preset.days === 'last-month') {
      start.setMonth(start.getMonth() - 1, 1)
      end.setDate(0)
    } else if (preset.label === 'Yesterday') {
      start.setDate(start.getDate() - 1)
      end.setDate(end.getDate() - 1)
    } else {
      start.setDate(start.getDate() - preset.days)
    }

    applyReportDates(toDateInputValue(start), toDateInputValue(end))
  }

  const enteringFeaturedClass = campaignMotion === 'left'
    ? styles.featuredSlideEnterFromRight
    : styles.featuredSlideEnterFromLeft
  const exitingFeaturedClass = campaignMotion === 'left'
    ? styles.featuredSlideExitToLeft
    : styles.featuredSlideExitToRight
  const reportPage = reportPages[pathname]
  const tablePage = tablePages[pathname]
  const campaignDetail = pathname.match(/^\/campaigns\/(\d+)$/)
  const allCampaignOffers = [...seedCampaignOffers, ...seedIncentiveOffers, ...customCampaignOffers]
    .filter((campaign) => !deletedCampaignIds.includes(campaign.id))
    .map((campaign) => mergeCampaignOverride(campaign, managedCampaignOverrides.find((override) => override.id === campaign.id)))
  const campaignOffers = allCampaignOffers.filter((campaign) => {
    const isIncentiveOffer = campaign.placement === 'INCENTIVE'
    return pathname === '/incentive_offers' ? isIncentiveOffer : !isIncentiveOffer
  })
  const featuredCampaigns = featuredCampaignsFromOffers(allCampaignOffers)
  const featured = featuredCampaigns.length ? featuredCampaigns[campaignIndex % featuredCampaigns.length] : undefined
  const previousFeatured = previousCampaignIndex === null || !featuredCampaigns.length
    ? null
    : featuredCampaigns[previousCampaignIndex % featuredCampaigns.length]
  const campaignUpdates = allCampaignOffers
    .map((campaign) => ({
      ...campaign,
      geo: campaign.country,
      createdAt: campaign.createdAt ?? '1970-01-01T00:00:00.000Z',
    }))
    .filter((campaign) => campaign.status !== 'PAUSED')
    .sort((first, second) => {
      const byDate = Date.parse(second.createdAt) - Date.parse(first.createdAt)
      if (byDate !== 0) return byDate
      return Number(second.id) - Number(first.id)
    })
    .slice(0, 25)
  const detailedCampaign = campaignDetail ? allCampaignOffers.find((campaign) => campaign.id === campaignDetail[1]) : undefined
  const updateCampaignTrackingLink = () => {
    const trackingUrl = new URL(defaultCampaignTrackingUrl)
    trackingSubIds.forEach((value, index) => {
      const subId = value.trim()
      if (subId) trackingUrl.searchParams.set(`s${index + 1}`, subId)
    })
    setGeneratedTrackingUrl(trackingUrl.toString())
    setTrackingMessage('Tracking URL updated with the entered Sub IDs.')
  }
  const resetCampaignTrackingLink = () => {
    setTrackingSubIds(['', '', '', ''])
    setGeneratedTrackingUrl(defaultCampaignTrackingUrl)
    setTrackingMessage('Sub IDs cleared.')
  }
  const isContentLockerWizard = /^\/contentlocker\/(?:new|edit\/[^/]+)$/.test(pathname)
  const isOfferWallWizard = /^\/offerwall\/(?:new|edit\/[^/]+)$/.test(pathname)
  const isWizard = isContentLockerWizard || isOfferWallWizard
  const isDashboard = pathname === '/dashboard'
  const isCampaignBrowse = pathname === '/campaigns/browse'
  const isIncentiveOffers = pathname === '/incentive_offers'
  const isCampaignAdd = pathname === '/campaigns/add'
  const isOfferApprovals = pathname === '/campaigns/approvals'
  const isPublisherAccounts = pathname === '/account/publishers'
  const isCampaignCatalog = isCampaignBrowse || pathname === '/campaigns/new' || isIncentiveOffers
  const canManageOffers = userRole === 'MANAGER' && (isCampaignBrowse || isIncentiveOffers)
  const pageTitle = isDashboard ? 'DASHBOARD'
    : isContentLockerWizard ? (pathname.endsWith('/new') ? 'NEW CONTENT LOCKER' : 'EDIT CONTENT LOCKER')
      : isOfferWallWizard ? (pathname.endsWith('/new') ? 'NEW OFFERWALL' : 'EDIT OFFERWALL')
        : isCampaignBrowse ? 'Browse campaigns'
          : isIncentiveOffers ? ''
            : isOfferApprovals ? 'Offer Approval'
              : isPublisherAccounts ? 'Publishers'
                : isCampaignAdd
                  ? (editingOfferId
                    ? (offerPlacement === 'INCENTIVE' ? 'Edit incentive offer' : 'Edit offer')
                    : (offerPlacement === 'INCENTIVE' ? 'Add incentive offer' : 'Add offer'))
                  : reportPage?.title ?? tablePage?.title ?? pageTitles[pathname] ?? 'Account'
  const toggleIncentiveOfferActive = (campaignId: string) => {
    setActiveIncentiveOfferIds((current) => {
      const next = current.includes(campaignId)
        ? current.filter((id) => id !== campaignId)
        : [...current, campaignId]
      try {
        window.localStorage.setItem(activeIncentiveOffersStorageKey, JSON.stringify(next))
      } catch { /* ignore */ }
      return next
    })
  }

  const activeIncentiveCatalog = allCampaignOffers
    .filter((campaign) => campaign.placement === 'INCENTIVE' && !deletedCampaignIds.includes(campaign.id))
    .map((campaign) => {
      const override = managedCampaignOverrides.find((item) => item.id === campaign.id)
      return mergeCampaignOverride(campaign, override)
    })
    .filter((campaign) => activeIncentiveOfferIds.includes(campaign.id) && campaign.status !== 'PAUSED')
    .map((campaign) => ({
      ...campaign,
      offerLink: incentiveOfferDestination({
        id: campaign.id,
        offerLink: campaign.offerLink || '',
      }),
      imageSource: campaign.imageSource || `/affmine/preview_i/${campaign.id}.png`,
    }))

  const wizardPreviewOffers = (wizardSelectedOfferIds.length
    ? activeIncentiveCatalog.filter((offer) => wizardSelectedOfferIds.includes(offer.id))
    : activeIncentiveCatalog
  ).slice(0, Number(wizardFields.desktopMaxOffers || 5) || 5)

  const persistTools = (kind: 'locker' | 'offerwall', next: IncentiveToolRecord[]) => {
    if (kind === 'locker') {
      setContentLockers(next)
      writeJson(contentLockersStorageKey, next)
      return
    }
    setOfferwalls(next)
    writeJson(offerwallsStorageKey, next)
  }

  const saveIncentiveTool = () => {
    const kind = isContentLockerWizard ? 'locker' as const : 'offerwall' as const
    const name = (kind === 'locker' ? wizardFields.lockerName : wizardFields.offerwallName)?.trim()
    if (!name) {
      setPageNotice(`Enter a ${kind === 'locker' ? 'content locker' : 'offerwall'} name.`)
      setWizardStep(0)
      return
    }
    if (!activeIncentiveCatalog.length) {
      setPageNotice('Activate at least one incentive offer before publishing this tool.')
      return
    }

    const now = new Date().toISOString()
    const existingId = editingToolId
    const nextTool: IncentiveToolRecord = {
      id: existingId || createToolId(),
      kind,
      name,
      createdAt: existingId
        ? ((kind === 'locker' ? contentLockers : offerwalls).find((item) => item.id === existingId)?.createdAt || now)
        : now,
      updatedAt: now,
      fields: { ...(kind === 'locker' ? defaultLockerFields : defaultOfferwallFields), ...wizardFields },
      toggles: { ...wizardToggles },
      selectedOfferIds: [...wizardSelectedOfferIds],
    }

    const current = kind === 'locker' ? contentLockers : offerwalls
    const next = existingId
      ? current.map((item) => (item.id === existingId ? nextTool : item))
      : [nextTool, ...current]
    persistTools(kind, next)
    setEditingToolId(nextTool.id)
    setPageNotice(`${kind === 'locker' ? 'Content locker' : 'OfferWall'} “${name}” is live and connected to incentive offers.`)
    setWizardStep(2)
    router.replace(kind === 'locker' ? `/contentlocker/edit/${nextTool.id}` : `/offerwall/edit/${nextTool.id}`)
  }

  const deleteIncentiveTool = (kind: 'locker' | 'offerwall', toolId: string) => {
    const current = kind === 'locker' ? contentLockers : offerwalls
    persistTools(kind, current.filter((item) => item.id !== toolId))
    setPageNotice(`${kind === 'locker' ? 'Content locker' : 'OfferWall'} deleted.`)
  }

  const copyToolEmbed = async (tool: IncentiveToolRecord) => {
    const code = toolEmbedCode(tool, appOrigin || window.location.origin)
    try {
      await navigator.clipboard.writeText(code)
      setCopiedToolId(tool.id)
      setPageNotice('Embed code copied.')
    } catch {
      setPageNotice('Could not copy embed code.')
    }
  }
  const publisherOfferActionById = new Map(
    offerApplications.map((application) => [
      application.campaignId,
      application.status === 'APPROVED' ? 'View' as const : application.status === 'PENDING' ? 'Pending' as const : null,
    ]).filter((entry): entry is [string, 'View' | 'Pending'] => Boolean(entry[1])),
  )
  const getOfferActionKind = (campaign: { id: string; action?: 'Apply' | 'Pending' | 'View'; requiresApproval?: boolean }) => {
    if (userRole === 'MANAGER') return 'View' as const
    const catalogOffer = allCampaignOffers.find((offer) => offer.id === campaign.id)
    const catalogAction = campaign.action
      ?? catalogOffer?.action
      ?? (offerRequiresApproval({
        action: campaign.action ?? 'Apply',
        requiresApproval: campaign.requiresApproval ?? catalogOffer?.requiresApproval,
      }) ? 'Apply' : 'View')
    return publisherOfferActionById.get(campaign.id) ?? catalogAction
  }
  const isIncentiveCampaign = (campaign: { placement?: 'STANDARD' | 'INCENTIVE' } | undefined) => (
    campaign?.placement === 'INCENTIVE'
  )
  /** Pending applications stay closed until a manager approves; Apply/View (and managers) may navigate. */
  const canNavigateOffer = (campaign: { id: string; action?: 'Apply' | 'Pending' | 'View'; requiresApproval?: boolean; placement?: 'STANDARD' | 'INCENTIVE' }) => (
    userRole === 'MANAGER' || getOfferActionKind(campaign) !== 'Pending'
  )
  // Lock pending offers for anyone who is not a manager — including while role is still loading —
  // so tracking URLs never flash before approval.
  const detailedCampaignLocked = Boolean(
    detailedCampaign
    && !isIncentiveCampaign(detailedCampaign)
    && userRole !== 'MANAGER'
    && getOfferActionKind(detailedCampaign) === 'Pending',
  )
  const detailedCampaignIncentiveOnly = Boolean(detailedCampaign && isIncentiveCampaign(detailedCampaign))

  useEffect(() => {
    // Pending offers cannot be opened/used until a manager approves them.
    if (!campaignDetail || !detailedCampaign || !detailedCampaignLocked) return
    if (userRole !== 'PUBLISHER') return
    try {
      window.sessionStorage.setItem(DASHBOARD_NOTICE_KEY, pendingOfferNotice(detailedCampaign.id))
    } catch { /* ignore */ }
    router.replace('/campaigns/browse')
  }, [campaignDetail, userRole, detailedCampaign, detailedCampaignLocked, router])

  const filteredOfferApplications = offerApplications
    .filter((application) => {
      if (approvalStatusFilter !== 'ALL' && application.status !== approvalStatusFilter) return false
      const term = approvalSearch.trim().toLowerCase()
      if (!term) return true
      return `${application.campaignId} ${application.campaignName} ${application.publisherUsername} ${application.publisherEmail ?? ''}`.toLowerCase().includes(term)
    })
  const approvedOfferNotices = userRole === 'PUBLISHER'
    ? offerApplications.filter((application) => application.status === 'APPROVED' && !application.noticeDismissed)
    : []
  const dismissOfferApprovalNotice = async (applicationId: string) => {
    if (dismissingNoticeId) return
    setDismissingNoticeId(applicationId)
    try {
      const response = await fetch(`/api/offer-applications/${applicationId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissNotice: true }),
      })
      const data = await response.json() as { application?: OfferApplicationRecord; error?: string }
      if (!response.ok || !data.application) {
        throw new Error(data.error || 'Unable to dismiss notice')
      }
      setOfferApplications((current) => current.map((item) => (
        item.id === applicationId ? { ...item, noticeDismissed: true } : item
      )))
    } catch (dismissError) {
      setPageNotice(dismissError instanceof Error ? dismissError.message : 'Unable to dismiss notice')
    } finally {
      setDismissingNoticeId(null)
    }
  }
  const saveAccountDetails = async () => {
    if (accountSaving) return
    setAccountSaving(true)
    setPageNotice('')
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: accountDetails.address,
          city: accountDetails.city,
          state: accountDetails.state,
          zipCode: accountDetails.zipCode,
          country: accountDetails.country,
          companyName: accountDetails.companyName,
          companyAddress: accountDetails.companyAddress,
          companyCity: accountDetails.companyCity,
          companyState: accountDetails.companyState,
          companyZipCode: accountDetails.companyZipCode,
          companyCountry: accountDetails.companyCountry,
          leadNotifications: accountDetails.leadNotifications,
          campaignEmailUpdates: accountDetails.campaignEmailUpdates,
        }),
      })
      const data = await response.json() as { profile?: AccountDetailsForm; error?: string }
      if (!response.ok || !data.profile) {
        throw new Error(data.error || 'Unable to save account details')
      }
      setAccountDetails((current) => ({
        ...current,
        ...data.profile!,
        email: data.profile!.email || current.email,
      }))
      setUserName([data.profile.firstName, data.profile.lastName].filter(Boolean).join(' ') || userName)
      setPageNotice('Account details saved.')
    } catch (saveError) {
      setPageNotice(saveError instanceof Error ? saveError.message : 'Unable to save account details')
    } finally {
      setAccountSaving(false)
    }
  }
  const changeAccountPassword = async () => {
    if (passwordSaving) return
    setPasswordSaving(true)
    setPasswordNotice('')
    try {
      const response = await fetch('/api/account/password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      })
      const data = await response.json() as { success?: boolean; error?: string }
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to change password')
      }
      setPasswordForm({ currentPassword: '', newPassword: '', repeatPassword: '' })
      setPasswordNotice('Password changed successfully.')
    } catch (passwordError) {
      setPasswordNotice(passwordError instanceof Error ? passwordError.message : 'Unable to change password')
    } finally {
      setPasswordSaving(false)
    }
  }
  const sendSupportMessage = async () => {
    if (supportSending || !supportDraft.trim()) return
    setSupportSending(true)
    setPageNotice('')
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: supportDraft.trim(),
          ...(userRole === 'MANAGER' && selectedSupportId ? { conversationId: selectedSupportId } : {}),
        }),
      })
      const data = await response.json() as { conversation?: SupportConversationRecord; error?: string }
      if (!response.ok || !data.conversation) {
        throw new Error(data.error || 'Unable to send message')
      }
      setSupportConversation(data.conversation)
      setSelectedSupportId(data.conversation.id)
      setSupportConversations((current) => {
        const without = current.filter((item) => item.id !== data.conversation!.id)
        return [data.conversation!, ...without]
      })
      setSupportDraft('')
    } catch (supportError) {
      setPageNotice(supportError instanceof Error ? supportError.message : 'Unable to send message')
    } finally {
      setSupportSending(false)
    }
  }
  const reviewOfferApplication = async (applicationId: string, status: 'APPROVED' | 'REJECTED') => {
    if (userRole !== 'MANAGER' || reviewingApplicationId) return
    setReviewingApplicationId(applicationId)
    try {
      const response = await fetch(`/api/offer-applications/${applicationId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await response.json() as { application?: OfferApplicationRecord; error?: string }
      if (!response.ok || !data.application) {
        throw new Error(data.error || 'Unable to update application')
      }
      setOfferApplications((current) => {
        const next = current.map((item) => (item.id === applicationId ? data.application! : item))
        setApprovalCounts({
          ALL: next.length,
          PENDING: next.filter((item) => item.status === 'PENDING').length,
          APPROVED: next.filter((item) => item.status === 'APPROVED').length,
          REJECTED: next.filter((item) => item.status === 'REJECTED').length,
        })
        return next
      })
      setPageNotice(status === 'APPROVED'
        ? `Approved application for #${data.application.campaignId}.`
        : `Rejected application for #${data.application.campaignId}.`)
    } catch (reviewError) {
      setPageNotice(reviewError instanceof Error ? reviewError.message : 'Unable to update application')
    } finally {
      setReviewingApplicationId(null)
    }
  }
  const visibleMenuGroups = userRole === 'MANAGER'
    ? menuGroups
    : menuGroups.map((group) => {
      if (group.label === 'Offers') {
        return { ...group, items: group.items.filter((item) => item.href !== '/campaigns/add' && item.href !== '/campaigns/approvals') }
      }
      if (group.label === 'Account') {
        return { ...group, items: group.items.filter((item) => item.href !== '/account/publishers') }
      }
      return group
    })
  const filteredPublisherAccounts = publisherAccounts.filter((publisher) => {
    if (publisherStatusFilter !== 'ALL' && publisher.status !== publisherStatusFilter) return false
    const term = publisherSearch.trim().toLowerCase()
    if (!term) return true
    return `${publisher.publisherNumber ?? ''} ${publisher.username} ${publisher.email} ${publisher.fullName ?? ''} ${publisher.contractNumber ?? ''}`.toLowerCase().includes(term)
  })
  const updatePublisherStatus = async (publisherId: string, status: PublisherAccountRecord['status']) => {
    if (userRole !== 'MANAGER' || updatingPublisherId) return
    setUpdatingPublisherId(publisherId)
    try {
      const response = await fetch(`/api/publishers/${publisherId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await response.json() as { publisher?: PublisherAccountRecord; error?: string }
      if (!response.ok || !data.publisher) {
        throw new Error(data.error || 'Unable to update publisher')
      }
      setPublisherAccounts((current) => {
        const next = current.map((item) => (item.id === publisherId ? data.publisher! : item))
        setPublisherCounts({
          ALL: next.length,
          PENDING: next.filter((item) => item.status === 'PENDING').length,
          ACTIVE: next.filter((item) => item.status === 'ACTIVE').length,
          DISABLED: next.filter((item) => item.status === 'DISABLED').length,
          REJECTED: next.filter((item) => item.status === 'REJECTED').length,
        })
        return next
      })
      const labels: Record<PublisherAccountRecord['status'], string> = {
        ACTIVE: 'approved',
        REJECTED: 'rejected',
        DISABLED: 'disabled',
        PENDING: 'set to pending',
      }
      setPageNotice(`Publisher ${data.publisher.username} ${labels[status]}.`)
    } catch (updateError) {
      setPageNotice(updateError instanceof Error ? updateError.message : 'Unable to update publisher')
    } finally {
      setUpdatingPublisherId(null)
    }
  }
  const campaignCatalogOrder = new Map(campaignOffers.map((campaign, index) => [campaign.id, index]))
  const getCampaignGeos = (campaign: CampaignOffer) => (
    campaign.countries?.length ? campaign.countries : [campaign.country]
  )
  const filteredCampaigns = campaignOffers
    .filter((campaign) => {
      const searchTerm = campaignSearch.trim().toLowerCase()
      const geos = getCampaignGeos(campaign)
      return (!searchTerm || `${campaign.id} ${campaign.name}`.toLowerCase().includes(searchTerm))
        && (appliedCampaignFilters.country === 'All' || geos.includes(appliedCampaignFilters.country))
        && (appliedCampaignFilters.device === 'All' || getCampaignDevices(campaign).includes(appliedCampaignFilters.device))
        && (appliedCampaignFilters.category === 'All' || appliedCampaignFilters.category === 'CPL SOI')
        && (appliedCampaignFilters.type === 'All' || appliedCampaignFilters.type === 'E-mail Submit')
    })
    .sort((first, second) => {
      if (campaignSort.key === 'featured') {
        return (campaignCatalogOrder.get(first.id) ?? 0) - (campaignCatalogOrder.get(second.id) ?? 0)
      }
      const order = campaignSort.key === 'id'
        ? Number(first.id) - Number(second.id)
        : campaignSort.key === 'payout'
          ? first.payout - second.payout
          : first.name.localeCompare(second.name)
      return campaignSort.direction === 'asc' ? order : -order
    })
  const campaignPageSize = pathname === '/campaigns/new' ? 100 : 50
  const campaignPageCount = Math.max(1, Math.ceil(filteredCampaigns.length / campaignPageSize))
  const visibleCampaigns = filteredCampaigns.slice((campaignPage - 1) * campaignPageSize, campaignPage * campaignPageSize)
  const deleteCampaignOffer = (campaign: CampaignOffer) => {
    if (userRole !== 'MANAGER' || !window.confirm(`Delete offer #${campaign.id} - ${campaign.name}?`)) return

    try {
      if (allSeedCampaignOffers.some((seed) => seed.id === campaign.id)) {
        const updatedDeletedIds = [...new Set([...deletedCampaignIds, campaign.id])]
        window.localStorage.setItem(deletedCampaignsStorageKey, JSON.stringify(updatedDeletedIds))
        setDeletedCampaignIds(updatedDeletedIds)
      } else {
        const updatedOffers = customCampaignOffers.filter((offer) => offer.id !== campaign.id)
        window.localStorage.setItem(customOffersStorageKey, JSON.stringify(updatedOffers))
        setCustomCampaignOffers(updatedOffers)
      }

      const updatedOverrides = managedCampaignOverrides.filter((offer) => offer.id !== campaign.id)
      if (updatedOverrides.length !== managedCampaignOverrides.length) {
        window.localStorage.setItem(campaignOverridesStorageKey, JSON.stringify(updatedOverrides))
        setManagedCampaignOverrides(updatedOverrides)
      }
      setCampaignPage(1)
    } catch {
      window.alert('Offer could not be deleted in this browser.')
    }
  }
  const updateCampaignOfferStatus = (campaign: CampaignOffer, updates: Partial<Pick<CampaignOffer, 'isHot' | 'status'>>) => {
    if (userRole !== 'MANAGER') return

    const updatedOffer = { ...campaign, ...updates }
    try {
      if (allSeedCampaignOffers.some((seed) => seed.id === campaign.id)) {
        const updatedOverrides = [...managedCampaignOverrides.filter((offer) => offer.id !== campaign.id), updatedOffer]
        window.localStorage.setItem(campaignOverridesStorageKey, JSON.stringify(updatedOverrides))
        setManagedCampaignOverrides(updatedOverrides)
      } else {
        const updatedOffers = [...customCampaignOffers.filter((offer) => offer.id !== campaign.id), updatedOffer]
        window.localStorage.setItem(customOffersStorageKey, JSON.stringify(updatedOffers))
        setCustomCampaignOffers(updatedOffers)
      }

      const notice = updates.isHot !== undefined
        ? updates.isHot ? 'Offer marked HOT.' : 'HOT label removed.'
        : updates.status === 'PAUSED' ? 'Offer paused.' : 'Offer marked active.'
      setPageNotice(notice)
    } catch {
      setPageNotice('Offer status could not be saved in this browser.')
    }
  }
  const chartPoints = chartClicks
    .map((value, index) => `${36 + index * 19.2},${210 - value * 210}`)
    .join(' ')

  const renderFeaturedSlide = (
    campaign: FeaturedCampaign,
    key: string,
    animationClass: string,
    isOutgoing = false,
  ) => (
    <div key={key} className={`${styles.featuredSlide} ${animationClass}`} aria-hidden={isOutgoing}>
      <Image src={campaign.imageSource ?? `/affmine/campaigns/${campaign.id}.png`} alt={`${campaign.name} offer preview`} width={200} height={124} className={styles.campaignImage} unoptimized={Boolean(campaign.imageSource)} />
      <div className={styles.featuredDetails}>
        <div className={styles.featuredTitle}>
          #{campaign.id}{' '}
          {canNavigateOffer(campaign) ? (
            <a href={`/campaigns/${campaign.id}`} target="_blank" rel="noreferrer"><strong>{campaign.name}</strong></a>
          ) : (
            <strong className={styles.campaignNameLocked} title={PENDING_OFFER_HINT}>{campaign.name}</strong>
          )}
        </div>
        <div className={styles.featuredMeta}>
          <b>Geo:</b> <CampaignUpdateFlag geo={campaign.country} id={campaign.id} /> <b>|</b>{' '}
          {campaign.placement === 'INCENTIVE' ? 'Incent' : 'Non-Incent'} <b>|</b> {campaign.category}
        </div>
        <div className={styles.featuredMeta}><b>Payout:</b> <strong className={styles.payout}>{campaign.payout}</strong></div>
      </div>
    </div>
  )

  const wizardTextField = (name: string, label: string, placeholder = '', type = 'text') => (
    <label className={styles.wizardField} key={name}>
      <span>{label}</span>
      <input type={type} value={wizardFields[name] ?? (type === 'color' ? '#ffffff' : '')} placeholder={placeholder} onChange={(event) => setWizardFields((fields) => ({ ...fields, [name]: event.target.value }))} />
    </label>
  )

  const wizardSelect = (name: string, label: string, options: string[]) => (
    <label className={styles.wizardField} key={name}>
      <span>{label}</span>
      <select value={wizardFields[name] ?? (name === 'desktopMaxOffers' ? '5' : options[0])} onChange={(event) => setWizardFields((fields) => ({ ...fields, [name]: event.target.value }))}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )

  const wizardToggle = (name: keyof typeof wizardToggles, label: string, description?: string) => (
    <label className={styles.wizardToggle} key={name}>
      <input type="checkbox" checked={wizardToggles[name]} onChange={(event) => setWizardToggles((toggles) => ({ ...toggles, [name]: event.target.checked }))} />
      <span><strong>{label}</strong>{description && <small>{description}</small>}</span>
      <b>{wizardToggles[name] ? 'On' : 'Off'}</b>
    </label>
  )

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <Link href="/dashboard" className={styles.brand} aria-label="Affmine dashboard">
          <Image src="/affmine/logo.png" alt="affmine" width={150} height={38} priority />
        </Link>
        <button
          type="button"
          className={styles.menuToggle}
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
          aria-expanded={mobileNavOpen || !desktopSidebarHidden}
        >
          <i className="fa fa-bars" aria-hidden="true" />
        </button>
        <form className={styles.searchForm} onSubmit={(event) => {
          event.preventDefault()
          setCampaignSearch(search)
          setCampaignPage(1)
          if (pathname !== '/campaigns/browse') router.push('/campaigns/browse')
        }}>
          <button type="submit" className={styles.searchButton} aria-label="Search offers"><i className="fa fa-search" aria-hidden="true" /></button>
          <input name="qcmp" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search offers" />
        </form>
        <div className={styles.updates}>
          <span className={styles.updatesLabel}>Updates:</span>{' '}
          <span className={styles.updatesText} dangerouslySetInnerHTML={{ __html: tickerHtml }} />
          <span className={`${styles.updatesCursor}${tickerTyping ? ` ${styles.updatesCursorTyping}` : ''}`} aria-hidden="true">|</span>
        </div>
        <div className={styles.topActions}>
          <div className={styles.popoverWrap}>
            <button type="button" className={styles.iconButton} aria-label="News and notifications" aria-expanded={newsOpen} onClick={() => { setNewsOpen(!newsOpen); setProfileOpen(false) }}>
              <Mail size={16} />
            </button>
            {newsOpen && (
              <div className={`${styles.popover} ${styles.newsPopover}`}>
                <div className={styles.popoverTitle}>NEWS &amp; UPDATES</div>
                <div className={styles.newsList}>
                  {newsItems.map((item) => <article key={item.title}><strong>{item.title}</strong><p>{item.body}</p></article>)}
                </div>
              </div>
            )}
          </div>
          <div className={styles.popoverWrap}>
            <button type="button" className={styles.profileButton} aria-expanded={profileOpen} onClick={() => { setProfileOpen(!profileOpen); setNewsOpen(false) }}>
              <CircleUserRound size={17} />
              <b>{userName}</b>
              <ChevronDown size={12} />
            </button>
            {profileOpen && (
              <div className={`${styles.popover} ${styles.profilePopover}`}>
                <div className={styles.popoverTitle}>Profile</div>
                <Link href="/account/settings"><Settings size={14} />Settings</Link>
                <button type="button" onClick={signOut} disabled={isSigningOut}><LogOut size={14} />{isSigningOut ? 'Logging out…' : 'Logout'}</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <aside className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ''} ${desktopSidebarHidden ? styles.sidebarHidden : ''}`}>
        <nav className={styles.navigation} aria-label="Main navigation">
          <Link className={`${styles.navLink} ${pathname === '/dashboard' ? styles.navActive : ''}`} href="/dashboard" aria-current={pathname === '/dashboard' ? 'page' : undefined} onClick={() => setMobileNavOpen(false)}>
            <i className={`fas fa-tachometer-alt ${styles.navIcon}`} aria-hidden="true" /><span>Dashboard</span>
          </Link>
          {visibleMenuGroups.slice(0, 4).map(({ label, iconClass, items }) => (
            <div className={styles.navGroup} key={label}>
              <button type="button" className={`${styles.navLink} ${items.some((item) => isMenuItemActive(pathname, item.href, { incentiveDetail: detailedCampaignIncentiveOnly })) ? styles.navActive : ''}`} aria-expanded={openGroups.includes(label)} onClick={() => toggleGroup(label)}>
                <i className={`${iconClass} ${styles.navIcon}`} aria-hidden="true" /><span>{label}</span><span className={`${styles.navCaret} ${items.some((item) => isMenuItemActive(pathname, item.href, { incentiveDetail: detailedCampaignIncentiveOnly })) ? styles.navCaretActive : ''}`} aria-hidden="true" />
              </button>
              {(openGroups.includes(label) || items.some((item) => isMenuItemActive(pathname, item.href, { incentiveDetail: detailedCampaignIncentiveOnly }))) && <div className={styles.submenu}>{items.map((item) => <Link className={isMenuItemActive(pathname, item.href, { incentiveDetail: detailedCampaignIncentiveOnly }) ? styles.submenuActive : ''} href={item.href} key={item.href} aria-current={isMenuItemActive(pathname, item.href, { incentiveDetail: detailedCampaignIncentiveOnly }) ? 'page' : undefined} onClick={() => setMobileNavOpen(false)}>{item.label}</Link>)}</div>}
            </div>
          ))}
          <Link className={`${styles.navLink} ${pathname === '/payments' ? styles.navActive : ''}`} href="/payments" aria-current={pathname === '/payments' ? 'page' : undefined} onClick={() => setMobileNavOpen(false)}><i className={`fa fa-money ${styles.navIcon}`} aria-hidden="true" /><span>Payments</span></Link>
          <div className={styles.navGroup}>
            <button type="button" className={`${styles.navLink} ${(visibleMenuGroups.find((group) => group.label === 'Account')?.items ?? []).some((item) => isMenuItemActive(pathname, item.href)) ? styles.navActive : ''}`} aria-expanded={openGroups.includes('Account')} onClick={() => toggleGroup('Account')}>
              <i className={`fa fa-user ${styles.navIcon}`} aria-hidden="true" /><span>Account</span><span className={`${styles.navCaret} ${(visibleMenuGroups.find((group) => group.label === 'Account')?.items ?? []).some((item) => isMenuItemActive(pathname, item.href)) ? styles.navCaretActive : ''}`} aria-hidden="true" />
            </button>
            {(openGroups.includes('Account') || (visibleMenuGroups.find((group) => group.label === 'Account')?.items ?? []).some((item) => isMenuItemActive(pathname, item.href))) && <div className={styles.submenu}>{(visibleMenuGroups.find((group) => group.label === 'Account')?.items ?? []).map((item) => <Link className={isMenuItemActive(pathname, item.href) ? styles.submenuActive : ''} href={item.href} key={item.href} aria-current={isMenuItemActive(pathname, item.href) ? 'page' : undefined} onClick={() => setMobileNavOpen(false)}>{item.label}</Link>)}</div>}
          </div>
          <a
            href="#support"
            className={`${styles.navLink} ${supportMessengerOpen ? styles.navActive : ''}`}
            onClick={(event) => {
              // Affmine: Support opens the messenger popup.
              event.preventDefault()
              event.stopPropagation()
              openSupportMessenger()
            }}
          >
            <i className={`fa fa-support ${styles.navIcon}`} aria-hidden="true" /><span>Support</span>
          </a>
        </nav>

        <section className={styles.managerCard}>
          <h2>John</h2>
          <p>
            Your Affiliate Manager<br />
            <a href="https://teams.live.com/l/invite/FEApzEOIWDUIoFRhwI" target="_blank" rel="noreferrer">Chat on Teams</a><br />
            <Mail size={13} /> <a href="mailto:john@affmine.com">john@affmine.com</a>
          </p>
        </section>
        <div className={styles.sidebarFooter}>
          <Link href="/terms">Terms</Link><span>|</span><Link href="/privacy">Privacy</Link>
          <p>© 2026 Affmine LLC</p>
        </div>
      </aside>

      {mobileNavOpen && <button className={styles.backdrop} type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className={`${styles.main} ${desktopSidebarHidden ? styles.mainExpanded : ''}`}>
        {!campaignDetail && (
          <div className={`${styles.pageHeader} ${!pageTitle ? styles.pageHeaderEmpty : ''}`}>
            {pageTitle ? <h1>{pageTitle}</h1> : null}
            {isDashboard && <p>Server time: <time>{time}</time></p>}
            <div className={styles.pageHeaderRight}>
              {reportPage && (
                <div className={styles.reportDatePicker}>
                  <button type="button" className={styles.reportRangeInput} aria-expanded={showReportDates} onClick={() => setShowReportDates((open) => !open)}>
                    {reportRange}
                  </button>
                  {showReportDates && (
                    <div className={styles.reportDatePopover}>
                      <ul className={styles.reportDatePresets}>
                        {reportRangePresets.map((preset) => (
                          <li key={preset.label}>
                            <button type="button" onClick={() => applyReportPreset(preset)}>{preset.label}</button>
                          </li>
                        ))}
                        <li><button type="button" className={styles.reportDateCustomActive}>Custom Range</button></li>
                      </ul>
                      <div className={styles.reportDateCustom}>
                        <label>From<input type="date" value={reportStartDate} onChange={(event) => setReportStartDate(event.target.value)} /></label>
                        <label>To<input type="date" value={reportEndDate} min={reportStartDate} onChange={(event) => setReportEndDate(event.target.value)} /></label>
                        <button type="button" className={styles.pagePrimaryButton} onClick={() => applyReportDates()}>Apply</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {(pathname === '/contentlocker' || pathname === '/offerwall') && (
                <Link className={styles.pagePrimaryButton} href={pathname === '/contentlocker' ? '/contentlocker/new' : '/offerwall/new'}>
                  <i className="fa fa-plus" aria-hidden="true" />{pathname === '/contentlocker' ? 'New Content Locker' : 'New OfferWall'}
                </Link>
              )}
            </div>
          </div>
        )}

        {error && <div role="alert" className={styles.error}>{error}</div>}

        {isDashboard ? <div className={styles.notices}>
          <section className={`${styles.notice} ${styles.noticeInfo}`}>
            <strong>2-step verification has been enabled in Tipalti</strong>
            <p>The next time you access the Payments page, you will be prompted to add a phone number, which will be used for 2-step verification whenever you update your payment details. To save any changes to your payment settings, you will need to enter and confirm the verification code sent to that phone number. Please make sure you provide a phone number you will always have access to, as it will be required for all future changes to your payment information.</p>
          </section>
          <section className={`${styles.notice} ${styles.noticeSuccess}`}>
            <div className={styles.payoneer}><span />Payoneer</div>
            <p><strong>We have some good news!</strong> We are happy to announce that <strong>Payoneer is now officially back</strong> as a supported payment method. Furthermore, payments will have 0$ fee and are now instantly arriving into your Payoneer account.</p>
            <p>Here are the steps to follow in order to configure Tipalti with your Payoneer details: <a href="https://afficix.com">Click here for Payoneer instructions</a></p>
            <p>After you fill in your ACH details, you will be asked to introduce your Payoneer email address. This step is mandatory as we need your Payoneer email to process the payment. Contact us if you need more help with the setup process.</p>
          </section>
          {approvedOfferNotices.map((notice) => (
            <section key={notice.id} className={`${styles.notice} ${styles.noticeApproved}`}>
              <div className={styles.noticeApprovedHead}>
                <span className={styles.noticeApprovedIcon}>✓</span>
                <span>Offer request approved</span>
              </div>
              <p>
                Your request on offer <Link href={`/campaigns/${notice.campaignId}`}><strong>#{notice.campaignId} {notice.campaignName}</strong></Link> has been approved. You can start sending high-quality traffic.
              </p>
              <button
                type="button"
                className={styles.noticeApprovedClose}
                aria-label={`Dismiss offer approval notice for ${notice.campaignName}`}
                disabled={dismissingNoticeId === notice.id}
                onClick={() => void dismissOfferApprovalNotice(notice.id)}
              >
                ×
              </button>
            </section>
          ))}
        </div> : null}

        {isCampaignAdd && userRole === null ? (
          <section className={`${styles.panel} ${styles.dataPage}`}>
            <h2 className={styles.sectionTitle}>OFFER MANAGEMENT</h2>
            <p className={styles.addOfferLoading}>Loading offer editor…</p>
          </section>
        ) : isCampaignAdd && userRole !== 'MANAGER' ? (
          <section className={`${styles.panel} ${styles.dataPage}`}>
            <h2 className={styles.sectionTitle}>OFFER MANAGEMENT</h2>
            <p>Manager access is required to add or edit offers.</p>
            <Link href={offerPlacement === 'INCENTIVE' ? '/incentive_offers' : '/campaigns/browse'} className={styles.pageSecondaryButton}>
              {offerPlacement === 'INCENTIVE' ? 'Back to incentive offers' : 'Back to campaigns'}
            </Link>
          </section>
        ) : isCampaignAdd ? (
          <section className={`${styles.panel} ${styles.dataPage} ${styles.addOfferPage}`}>
            <div className={styles.dataPageHeading}>
              <h2>
                {editingOfferId
                  ? (offerPlacement === 'INCENTIVE' ? 'EDIT INCENTIVE OFFER' : 'EDIT OFFER')
                  : (offerPlacement === 'INCENTIVE' ? 'ADD INCENTIVE OFFER' : 'ADD OFFER')}
              </h2>
              <Link href={offerPlacement === 'INCENTIVE' ? '/incentive_offers' : '/campaigns/browse'} className={styles.pageSecondaryButton}>
                {offerPlacement === 'INCENTIVE' ? 'Back to incentive offers' : 'Back to campaigns'}
              </Link>
            </div>
            {offerPlacement === 'INCENTIVE' && (
              <div className={styles.addIncentiveNotice} role="note">
                <span className={styles.addIncentiveNoticeBadge}>Incentive</span>
                <p>
                  These campaigns run only in <Link href="/contentlocker/new">Content Locker</Link> and <Link href="/offerwall/new">OfferWall</Link>.
                  Publishers cannot direct-link them.
                </p>
              </div>
            )}
            {offerFormError && <div role="alert" className={styles.error}>{offerFormError}</div>}
            <form className={`${styles.addOfferForm} ${offerPlacement === 'INCENTIVE' ? styles.addIncentiveOfferForm : ''}`} onSubmit={submitOffer}>
              {offerPlacement === 'INCENTIVE' ? (
                <>
                  <section className={styles.addOfferSection}>
                    <header className={styles.addOfferSectionHead}>
                      <h3><span className={styles.addOfferSectionIndex}>01</span> Campaign details</h3>
                      <p>ID, name, payout, and conversion type for the catalog row.</p>
                    </header>
                    <div className={styles.addOfferFields}>
                      <label className={styles.addOfferField}>Offer ID
                        <div className={styles.addOfferIdRow}>
                          <input name="offerId" type="text" inputMode="numeric" pattern="[0-9]+" value={offerDraft.id} onChange={(event) => updateOfferDraft('id', event.target.value)} readOnly={Boolean(editingOfferId)} required />
                          {!editingOfferId && (
                            <button
                              type="button"
                              className={styles.addOfferGhostButton}
                              onClick={() => {
                                const maxId = Math.max(0, ...[...allSeedCampaignOffers, ...customCampaignOffers].map((offer) => Number(offer.id) || 0))
                                updateOfferDraft('id', String(maxId + 1))
                              }}
                            >
                              Next ID
                            </button>
                          )}
                        </div>
                      </label>
                      <label className={styles.addOfferField}>Offer name
                        <input
                          name="offerName"
                          type="text"
                          placeholder="My App - iPhone/iPad - CPE - US"
                          value={offerDraft.name}
                          onChange={(event) => updateOfferDraft('name', event.target.value)}
                          required
                        />
                      </label>
                      <label className={styles.addOfferField}>Payout (USD)
                        <input name="payout" type="number" min="0.01" step="0.01" value={offerDraft.payout} onChange={(event) => updateOfferDraft('payout', event.target.value)} required />
                      </label>
                      <fieldset className={`${styles.addOfferField} ${styles.addOfferTypeField}`}>
                        <legend>Offer type</legend>
                        <div className={styles.addOfferTypeOptions} role="group" aria-label="Offer types">
                          {incentiveOfferTypeOptions.map((type) => {
                            const selected = offerDraft.offerTypes.includes(type)
                            return <button key={type} type="button" aria-pressed={selected} className={`${styles.addOfferTypeButton} ${selected ? styles.addOfferTypeSelected : ''} ${type === 'SOI' ? styles.addOfferTypeSoi : ''}`} onClick={() => toggleOfferType(type)}>{type}</button>
                          })}
                        </div>
                      </fieldset>
                      <label className={styles.addOfferField}>Category
                        <select value={offerDraft.category} onChange={(event) => updateOfferDraft('category', event.target.value)}>
                          {offerCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                      </label>
                    </div>
                  </section>

                  <section className={styles.addOfferSection}>
                    <header className={styles.addOfferSectionHead}>
                      <h3><span className={styles.addOfferSectionIndex}>02</span> Targeting</h3>
                      <p>Geos and devices shown in the incentive catalog.</p>
                    </header>
                    <div className={styles.addOfferFields}>
                      <fieldset className={`${styles.addOfferField} ${styles.addOfferTypeField} ${styles.addOfferWideField} ${styles.addOfferGeoField}`}>
                        <legend>Geo</legend>
                        {(() => {
                          const geoOptions = campaignFilterOptions.country.filter((option) => option.value !== 'All')
                          const selectedGeos = getDraftGeos()
                          const query = geoSearch.trim().toLowerCase()
                          const filteredGeos = query
                            ? geoOptions.filter((option) => (
                              option.value.toLowerCase().includes(query)
                              || option.label.toLowerCase().includes(query)
                            ))
                            : geoOptions
                          const allSelected = geoOptions.every((option) => selectedGeos.includes(option.value))

                          return (
                            <div className={styles.addOfferGeoPicker}>
                              <div className={styles.addOfferGeoToolbar}>
                                <label className={styles.addOfferGeoSearch}>
                                  <Search size={13} aria-hidden="true" />
                                  <input
                                    type="search"
                                    value={geoSearch}
                                    onChange={(event) => setGeoSearch(event.target.value)}
                                    placeholder="Search country or code…"
                                    aria-label="Search geos"
                                  />
                                  {geoSearch ? (
                                    <button
                                      type="button"
                                      className={styles.addOfferGeoSearchClear}
                                      aria-label="Clear geo search"
                                      onClick={() => setGeoSearch('')}
                                    >
                                      <X size={12} aria-hidden="true" />
                                    </button>
                                  ) : null}
                                </label>
                                <div className={styles.addOfferGeoToolbarActions}>
                                  <button
                                    type="button"
                                    className={styles.addOfferTextButton}
                                    onClick={() => setDraftGeos(geoOptions.map((option) => option.value))}
                                    disabled={allSelected}
                                  >
                                    Select all
                                  </button>
                                  <span className={styles.addOfferGeoToolbarSep} aria-hidden="true">·</span>
                                  <button
                                    type="button"
                                    className={styles.addOfferTextButton}
                                    onClick={() => setDraftGeos([])}
                                    disabled={selectedGeos.length === 0}
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>

                              <div className={styles.addOfferGeoSelected} aria-live="polite">
                                {selectedGeos.length ? selectedGeos.map((geo) => {
                                  const option = geoOptions.find((candidate) => candidate.value === geo)
                                  const Flag = CountryFlags[geo.toUpperCase() as keyof typeof CountryFlags]
                                  return (
                                    <button
                                      key={geo}
                                      type="button"
                                      className={styles.addOfferGeoTag}
                                      onClick={() => toggleDraftGeo(geo)}
                                      title={`Remove ${option?.label ?? geo}`}
                                    >
                                      {Flag ? <Flag className={styles.addOfferGeoFlag} aria-hidden="true" /> : null}
                                      <span>{geo}</span>
                                      <X size={11} aria-hidden="true" />
                                    </button>
                                  )
                                }) : (
                                  <span className={styles.addOfferGeoEmptyHint}>No geos selected</span>
                                )}
                                <span className={styles.addOfferGeoCount}>{selectedGeos.length} selected</span>
                              </div>

                              <div className={styles.addOfferGeoList} role="group" aria-label="Geo options">
                                {filteredGeos.map((option) => {
                                  const selected = selectedGeos.includes(option.value)
                                  const Flag = option.flag
                                    ? CountryFlags[option.flag as keyof typeof CountryFlags]
                                    : null
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      aria-pressed={selected}
                                      title={option.label}
                                      className={`${styles.addOfferGeoChip} ${selected ? styles.addOfferGeoChipSelected : ''}`}
                                      onClick={() => toggleDraftGeo(option.value)}
                                    >
                                      {Flag ? <Flag className={styles.addOfferGeoFlag} aria-hidden="true" /> : null}
                                      <span className={styles.addOfferGeoCode}>{option.value}</span>
                                      <span className={styles.addOfferGeoLabel}>{option.label}</span>
                                      {selected ? <Check size={12} className={styles.addOfferGeoCheck} aria-hidden="true" /> : null}
                                    </button>
                                  )
                                })}
                                {!filteredGeos.length && (
                                  <div className={styles.addOfferGeoEmpty}>No countries match “{geoSearch.trim()}”.</div>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                      </fieldset>
                      <fieldset className={`${styles.addOfferField} ${styles.addOfferTypeField} ${styles.addOfferWideField}`}>
                        <legend className={styles.addOfferDeviceLegend}>
                          <span>Device</span>
                          <CampaignDeviceIcons devices={offerDraft.device} />
                        </legend>
                        <div className={styles.addOfferTypeOptions} role="group" aria-label="Device options">
                          {[{ value: 'All', label: 'All' }, ...campaignFilterOptions.device.filter((option) => option.value !== 'All')].map((option) => {
                            const { value, label } = option
                            const selected = value === 'All'
                              ? offerDraft.device.length === campaignFilterOptions.device.filter((candidate) => candidate.value !== 'All').length
                              : offerDraft.device.includes(value)
                            return <button key={value} type="button" aria-pressed={selected} className={`${styles.addOfferTypeButton} ${selected ? styles.addOfferTypeSelected : ''}`} onClick={() => {
                              if (value === 'All') {
                                setOfferDraft((draft) => ({ ...draft, device: campaignFilterOptions.device.filter((candidate) => candidate.value !== 'All').map((candidate) => candidate.value) }))
                                return
                              }
                              toggleOfferDevice(value)
                            }}>{label}</button>
                          })}
                        </div>
                        <p className={styles.addOfferFieldHint}>App Install CPI/CPE offers usually use iPhone, iPad, and Mobile (Other).</p>
                      </fieldset>
                    </div>
                  </section>

                  <section className={styles.addOfferSection}>
                    <header className={styles.addOfferSectionHead}>
                      <h3><span className={styles.addOfferSectionIndex}>03</span> Creative & destination</h3>
                      <p>Catalog thumbnail and locker conversion URL.</p>
                    </header>
                    <div className={styles.addOfferFields}>
                      <div className={`${styles.addOfferField} ${styles.addOfferWideField} ${styles.addOfferThumbField}`}>
                        <span className={styles.addOfferThumbLabel}>Preview thumbnail URL</span>
                        <div className={styles.addOfferThumbRow}>
                          <input
                            name="imageSource"
                            type="text"
                            inputMode="url"
                            placeholder="/affmine/preview_i/34928.png"
                            value={offerDraft.imageSource}
                            onChange={(event) => updateOfferDraft('imageSource', event.target.value)}
                            required
                            aria-describedby="incentive-thumb-preview-status"
                          />
                          <div
                            className={`${styles.addOfferThumbPreview} ${imagePreviewState === 'ready' ? styles.addOfferThumbPreviewReady : ''} ${imagePreviewState === 'error' ? styles.addOfferThumbPreviewError : ''}`}
                            aria-live="polite"
                          >
                            {previewImageSrc && imagePreviewState !== 'error' ? (
                              // Native img so relative + any https URL preview reliably (Next/Image remote allowlist).
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={previewImageSrc}
                                src={previewImageSrc}
                                alt="Catalog thumbnail preview"
                                width={50}
                                height={50}
                                onLoad={() => setImagePreviewState('ready')}
                                onError={() => setImagePreviewState('error')}
                              />
                            ) : (
                              <span className={styles.addOfferThumbPlaceholder}>50×50</span>
                            )}
                          </div>
                        </div>
                        <span
                          id="incentive-thumb-preview-status"
                          className={`${styles.addOfferFieldHint} ${imagePreviewState === 'ready' ? styles.addOfferHintOk : ''} ${imagePreviewState === 'error' || (!previewImageSrc && (offerDraft.imageSource ?? '').trim()) ? styles.addOfferHintError : ''}`}
                        >
                          {!previewImageSrc && (offerDraft.imageSource ?? '').trim()
                            ? 'Enter a path like /affmine/preview_i/34928.png or a full https:// image URL.'
                            : imagePreviewState === 'error'
                              ? 'Could not load that image — check the path or URL.'
                              : imagePreviewState === 'ready'
                                ? 'Live 50×50 catalog thumbnail.'
                                : previewImageSrc
                                  ? 'Loading thumbnail…'
                                  : 'Paste a local /affmine/… path or remote image URL to preview.'}
                        </span>
                      </div>

                      <div className={`${styles.addOfferCatalogLive} ${styles.addOfferWideField}`} aria-label="Live catalog row preview">
                        <div className={styles.addOfferCatalogLiveHead}>
                          <span>Live catalog row</span>
                          <span>Incentive Offers</span>
                        </div>
                        <div className={styles.addOfferCatalogLiveRow}>
                          <span className={`${styles.incentiveCheckbox} ${styles.incentiveCheckboxChecked}`} aria-hidden="true">
                            <span className={styles.incentiveCheckboxLabel} />
                          </span>
                          <span className={styles.addOfferCatalogLiveThumb}>
                            {previewImageSrc && imagePreviewState === 'ready' ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={previewImageSrc} alt="" width={36} height={36} />
                            ) : (
                              <span>50×50</span>
                            )}
                          </span>
                          <div className={styles.addOfferCatalogLiveMeta}>
                            <div className={styles.addOfferCatalogLiveTitle}>
                              <span className={styles.addOfferCatalogLiveName}>
                                {(offerDraft.name || 'Offer name').trim()}
                              </span>
                              <strong className={styles.addOfferCatalogLivePayout}>
                                ${Number(offerDraft.payout || 0).toFixed(2)}
                              </strong>
                            </div>
                            <div className={styles.addOfferCatalogLiveSub}>
                              <span>{offerDraft.category || 'App Install'}</span>
                              <span aria-hidden="true">·</span>
                              <span>{getDraftGeos().join(', ') || 'No geo'}</span>
                              <span aria-hidden="true">·</span>
                              <span>{(offerDraft.offerTypes[0] || 'CPI')}</span>
                              <CampaignDeviceIcons devices={offerDraft.device} />
                            </div>
                          </div>
                          <span className={`${styles.offerAction} ${styles.offerActionView}`}>
                            <i className="fa fa-check" aria-hidden="true" />
                            View
                          </span>
                        </div>
                      </div>

                      <label className={`${styles.addOfferField} ${styles.addOfferWideField}`}>Description
                        <textarea
                          name="description"
                          rows={3}
                          placeholder="Complete profile registration and mobile verification."
                          value={offerDraft.description}
                          onChange={(event) => updateOfferDraft('description', event.target.value)}
                          required
                        />
                      </label>
                      <label className={`${styles.addOfferField} ${styles.addOfferWideField}`}>
                        Destination / conversion URL
                        <input
                          name="offerLink"
                          type="text"
                          inputMode="url"
                          placeholder="https://example.com/offer"
                          value={offerDraft.offerLink}
                          onChange={(event) => updateOfferDraft('offerLink', event.target.value)}
                          required={!editingOfferId}
                        />
                        <span className={styles.addOfferFieldHint}>Used inside Content Locker / OfferWall. Not published as a publisher tracking link.</span>
                      </label>
                    </div>
                  </section>

                  <div className={styles.addOfferActions}>
                    <button type="submit" className={styles.pagePrimaryButton}>
                      {editingOfferId ? <Check size={14} /> : <Plus size={14} />}
                      {editingOfferId ? 'Save changes' : 'Add incentive offer'}
                    </button>
                    <Link href="/incentive_offers" className={styles.pageSecondaryButton}>Cancel</Link>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.addOfferFields}>
                    <label className={styles.addOfferField}>Offer ID
                      <input name="offerId" type="text" inputMode="numeric" pattern="[0-9]+" value={offerDraft.id} onChange={(event) => updateOfferDraft('id', event.target.value)} readOnly={Boolean(editingOfferId)} required />
                    </label>
                    <label className={styles.addOfferField}>Offer name
                      <input name="offerName" type="text" placeholder="Offer name" value={offerDraft.name} onChange={(event) => updateOfferDraft('name', event.target.value)} required />
                    </label>
                    <label className={styles.addOfferField}>Payout
                      <input name="payout" type="number" min="0.01" step="0.01" value={offerDraft.payout} onChange={(event) => updateOfferDraft('payout', event.target.value)} required />
                    </label>
                    <fieldset className={`${styles.addOfferField} ${styles.addOfferTypeField}`}>
                      <legend>Offer type</legend>
                      <div className={styles.addOfferTypeOptions} role="group" aria-label="Offer types">
                        {standardOfferTypeOptions.map((type) => {
                          const selected = offerDraft.offerTypes.includes(type)
                          return <button key={type} type="button" aria-pressed={selected} className={`${styles.addOfferTypeButton} ${selected ? styles.addOfferTypeSelected : ''} ${type === 'SOI' ? styles.addOfferTypeSoi : ''}`} onClick={() => toggleOfferType(type)}>{type}</button>
                        })}
                      </div>
                    </fieldset>
                    <fieldset className={`${styles.addOfferField} ${styles.addOfferTypeField}`}>
                      <legend>Need approval</legend>
                      <div className={styles.addOfferTypeOptions} role="group" aria-label="Need approval">
                        <button type="button" aria-pressed={offerDraft.requiresApproval} className={`${styles.addOfferTypeButton} ${offerDraft.requiresApproval ? styles.addOfferTypeSelected : ''}`} onClick={() => setOfferDraft((draft) => ({ ...draft, requiresApproval: true }))}>Yes</button>
                        <button type="button" aria-pressed={!offerDraft.requiresApproval} className={`${styles.addOfferTypeButton} ${!offerDraft.requiresApproval ? styles.addOfferTypeSelected : ''}`} onClick={() => setOfferDraft((draft) => ({ ...draft, requiresApproval: false }))}>No</button>
                      </div>
                      <p className={styles.addOfferFieldHint}>
                        {offerDraft.requiresApproval
                          ? 'Publishers must apply. Tracking stays locked until a manager approves.'
                          : 'Publishers can open and use this offer immediately (View).'}
                      </p>
                    </fieldset>
                    <label className={styles.addOfferField}>Category
                      <select value={offerDraft.category} onChange={(event) => updateOfferDraft('category', event.target.value)}>
                        {offerCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </label>
                    <label className={styles.addOfferField}>Geo
                      <select value={offerDraft.country} onChange={(event) => updateOfferDraft('country', event.target.value)}>
                        {campaignFilterOptions.country.filter((option) => option.value !== 'All').map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <fieldset className={`${styles.addOfferField} ${styles.addOfferTypeField} ${styles.addOfferWideField}`}>
                      <legend>Device</legend>
                      <div className={styles.addOfferTypeOptions} role="group" aria-label="Device options">
                        {[{ value: 'All', label: 'All' }, ...campaignFilterOptions.device.filter((option) => option.value !== 'All')].map((option) => {
                          const { value, label } = option
                          const selected = value === 'All'
                            ? offerDraft.device.length === campaignFilterOptions.device.filter((candidate) => candidate.value !== 'All').length
                            : offerDraft.device.includes(value)
                          return <button key={value} type="button" aria-pressed={selected} className={`${styles.addOfferTypeButton} ${selected ? styles.addOfferTypeSelected : ''}`} onClick={() => {
                            if (value === 'All') {
                              setOfferDraft((draft) => ({ ...draft, device: campaignFilterOptions.device.filter((candidate) => candidate.value !== 'All').map((candidate) => candidate.value) }))
                              return
                            }
                            toggleOfferDevice(value)
                          }}>{label}</button>
                        })}
                      </div>
                    </fieldset>
                    <label className={`${styles.addOfferField} ${styles.addOfferWideField}`}>View image source
                      <input name="imageSource" type="url" placeholder="https://example.com/offer-image.png" value={offerDraft.imageSource} onChange={(event) => updateOfferDraft('imageSource', event.target.value)} required />
                    </label>
                    {offerDraft.imageSource && (
                      <div className={`${styles.addOfferImagePreview} ${styles.addOfferWideField}`}>
                        <span>Preview</span>
                        <Image src={offerDraft.imageSource} alt="Offer preview" width={160} height={100} unoptimized />
                      </div>
                    )}
                    <label className={`${styles.addOfferField} ${styles.addOfferWideField}`}>Description
                      <textarea name="description" rows={4} value={offerDraft.description} onChange={(event) => updateOfferDraft('description', event.target.value)} required />
                    </label>
                    <label className={`${styles.addOfferField} ${styles.addOfferWideField}`}>Offer link
                      <input name="offerLink" type="url" placeholder="https://example.com/offer" value={offerDraft.offerLink} onChange={(event) => updateOfferDraft('offerLink', event.target.value)} required={!editingOfferId} />
                    </label>
                  </div>
                  <div className={styles.addOfferActions}>
                    <button type="submit" className={styles.pagePrimaryButton}>
                      {editingOfferId ? <Check size={14} /> : <Plus size={14} />}
                      {editingOfferId ? 'Save changes' : 'Add offer'}
                    </button>
                    <Link href="/campaigns/browse" className={styles.pageSecondaryButton}>Cancel</Link>
                  </div>
                </>
              )}
            </form>
          </section>
        ) : reportPage ? (
          <section className={`${styles.panel} ${styles.dataPage}`}>
            <div className={styles.reportHeading}>
              <h2><i className="fa fa-bar-chart" aria-hidden="true" /> {reportPage.title}</h2>
              <div className={styles.reportTools}>
                <input type="search" aria-label="Search report" placeholder="Search" value={pageSearch} onChange={(event) => setPageSearch(event.target.value)} />
              </div>
            </div>
            <div className={styles.reportChart} role="img" aria-label={`${reportPage.title.toLowerCase()} chart showing no account activity`}>
              <ReportLineChart labels={['11/05/2026', '11/06/2026', '11/07/2026', '11/08/2026', '11/09/2026', '11/10/2026', '11/11/2026']} />
            </div>
            <div className={styles.reportLegend}><span><i className={styles.reportClicks} />Clicks</span><span><i className={styles.reportConversions} />Conversions</span><span><i className={styles.reportRevenue} />Revenue</span></div>
            <div className={styles.dataTableWrap}>
              <table className={styles.dataTable}>
                <thead><tr>{reportPage.columns.map((column) => <th key={column} className={styles.sortableHeader}>{column}</th>)}</tr></thead>
                <tbody>
                  {pathname !== '/reports/conversions' && (
                    <tr className={styles.dataTotal}>
                      {reportPage.columns.map((column, index) => {
                        if (index === 0) return <th scope="row" key={column}>TOTAL</th>
                        const value = ['Revenue', 'EPC'].includes(column) ? '$0.00' : column === 'CR' ? '0%' : ['Tool ID', 'Name'].includes(column) ? '' : '0'
                        return <td key={column}>{value}</td>
                      })}
                    </tr>
                  )}
                  <tr><td colSpan={reportPage.columns.length}>No data available</td></tr>
                </tbody>
              </table>
            </div>
            <div className={styles.reportPagination}><span>Showing 0 to 0 of 0 entries</span><div><button type="button" disabled>Previous</button><button type="button" className={styles.campaignPageActive}>1</button><button type="button" disabled>Next</button></div></div>
            <div className={styles.dataPageFooter}>* All reports are displayed in EST time (GMT -4:00).</div>
          </section>
        ) : isPublisherAccounts ? (
          userRole === null ? (
            <section className={`${styles.panel} ${styles.dataPage}`}>
              <p className={styles.pageHint}>Loading publishers…</p>
            </section>
          ) : userRole !== 'MANAGER' ? (
            <section className={`${styles.panel} ${styles.dataPage}`}>
              <p className={styles.pageHint}>Only managers can approve and control publisher accounts.</p>
              <Link href="/campaigns/browse" className={styles.pageSecondaryButton}>Back to campaigns</Link>
            </section>
          ) : (
            <>
              <section className={`${styles.panel} ${styles.browseCampaigns}`}>
                <div className={styles.browseCampaignsHeading}>
                  <h2><CircleUserRound size={16} />PUBLISHERS</h2>
                  <div className={styles.browseCampaignActions}>
                    <div className={styles.statusTabs} role="tablist" aria-label="Publisher status">
                      {([
                        ['ALL', 'All'],
                        ['PENDING', 'Pending'],
                        ['ACTIVE', 'Active'],
                        ['DISABLED', 'Disabled'],
                        ['REJECTED', 'Rejected'],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          role="tab"
                          aria-selected={publisherStatusFilter === value}
                          className={`${styles.statusTab} ${publisherStatusFilter === value ? styles.statusTabActive : ''}`}
                          onClick={() => setPublisherStatusFilter(value)}
                        >
                          {label}
                          <span className={styles.statusTabCount}>{publisherCounts[value]}</span>
                        </button>
                      ))}
                    </div>
                    <label className={styles.campaignTableSearch}>
                      <Search size={14} />
                      <input
                        type="search"
                        placeholder="Search"
                        aria-label="Search publishers"
                        value={publisherSearch}
                        onChange={(event) => setPublisherSearch(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            void loadPublisherAccounts()
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                {pageNotice && <p className={styles.pageNotice} role="status">{pageNotice}</p>}
                <div className={styles.campaignTableWrap}>
                  <table className={`${styles.campaignTable} ${styles.publisherTable}`}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Publisher</th>
                        <th>Contact</th>
                        <th>Details</th>
                        <th>Joined</th>
                        <th>Last login</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPublisherAccounts.length ? filteredPublisherAccounts.map((publisher) => {
                        const joinedAt = new Date(publisher.createdAt)
                        const lastLoginAt = publisher.lastLogin ? new Date(publisher.lastLogin) : null
                        const statusClass = styles[`publisherStatus${publisher.status}` as 'publisherStatusPENDING' | 'publisherStatusACTIVE' | 'publisherStatusDISABLED' | 'publisherStatusREJECTED']
                        return (
                          <tr key={publisher.id}>
                            <td>
                              <strong className={styles.publisherIdCell}>
                                {publisher.publisherNumber != null ? `#${publisher.publisherNumber}` : '—'}
                              </strong>
                            </td>
                            <td>
                              <div className={styles.approvalPublisher}>
                                <strong>{publisher.username}</strong>
                                {publisher.fullName ? <span>{publisher.fullName}</span> : <span className={styles.publisherMetaMuted}>No full name</span>}
                              </div>
                            </td>
                            <td>
                              <div className={styles.approvalPublisher}>
                                <span>{publisher.email}</span>
                                {publisher.telegramUsername ? <span>{publisher.telegramUsername}</span> : <span className={styles.publisherMetaMuted}>No Teams/Telegram</span>}
                              </div>
                            </td>
                            <td>
                              <div className={styles.approvalPublisher}>
                                {publisher.contractNumber ? <span>Contract {publisher.contractNumber}</span> : <span className={styles.publisherMetaMuted}>No contract #</span>}
                                {publisher.address ? <span className={styles.publisherSource}>{publisher.address}</span> : null}
                                {publisher.referredBy ? <span>Ref: {publisher.referredBy.username}</span> : null}
                                {publisher.source ? <span className={styles.publisherSource}>{publisher.source}</span> : null}
                              </div>
                            </td>
                            <td>{Number.isNaN(joinedAt.getTime()) ? '—' : joinedAt.toLocaleDateString()}</td>
                            <td>{lastLoginAt && !Number.isNaN(lastLoginAt.getTime()) ? lastLoginAt.toLocaleDateString() : 'Never'}</td>
                            <td>
                              <span className={`${styles.approvalStatus} ${statusClass}`}>
                                {publisher.status}
                              </span>
                            </td>
                            <td>
                              <div className={styles.approvalActions}>
                                {publisher.status !== 'ACTIVE' && (
                                  <button
                                    type="button"
                                    className={`${styles.offerAction} ${styles.approvalApprove}`}
                                    disabled={updatingPublisherId === publisher.id}
                                    onClick={() => void updatePublisherStatus(publisher.id, 'ACTIVE')}
                                  >
                                    <Check size={12} aria-hidden="true" />{publisher.status === 'PENDING' ? 'Approve' : 'Enable'}
                                  </button>
                                )}
                                {publisher.status === 'PENDING' && (
                                  <button
                                    type="button"
                                    className={`${styles.offerAction} ${styles.approvalReject}`}
                                    disabled={updatingPublisherId === publisher.id}
                                    onClick={() => void updatePublisherStatus(publisher.id, 'REJECTED')}
                                  >
                                    <X size={12} aria-hidden="true" />Reject
                                  </button>
                                )}
                                {publisher.status === 'ACTIVE' && (
                                  <button
                                    type="button"
                                    className={`${styles.offerAction} ${styles.publisherDisable}`}
                                    disabled={updatingPublisherId === publisher.id}
                                    onClick={() => void updatePublisherStatus(publisher.id, 'DISABLED')}
                                  >
                                    <Pause size={12} aria-hidden="true" />Disable
                                  </button>
                                )}
                                {(publisher.status === 'REJECTED' || publisher.status === 'DISABLED') && (
                                  <button
                                    type="button"
                                    className={`${styles.offerAction} ${styles.offerActionPending}`}
                                    disabled={updatingPublisherId === publisher.id}
                                    onClick={() => void updatePublisherStatus(publisher.id, 'PENDING')}
                                  >
                                    <RotateCcw size={12} aria-hidden="true" />Pending
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      }) : (
                        <tr>
                          <td className={styles.publisherEmpty} colSpan={8}>
                            {publisherStatusFilter === 'PENDING'
                              ? 'No publishers awaiting approval.'
                              : publisherStatusFilter === 'ALL'
                                ? 'No publisher accounts found.'
                                : `No ${publisherStatusFilter.toLowerCase()} publishers.`}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )
        ) : isOfferApprovals ? (
          userRole === null ? (
            <section className={`${styles.panel} ${styles.dataPage}`}>
              <p className={styles.pageHint}>Loading offer applications…</p>
            </section>
          ) : userRole !== 'MANAGER' ? (
            <section className={`${styles.panel} ${styles.dataPage}`}>
              <p className={styles.pageHint}>Only managers can review offer applications.</p>
              <Link href="/campaigns/browse" className={styles.pageSecondaryButton}>Back to campaigns</Link>
            </section>
          ) : (
            <>
              <section className={`${styles.panel} ${styles.browseCampaigns}`}>
                <div className={styles.browseCampaignsHeading}>
                  <h2><Tags size={16} fill="currentColor" />OFFER APPROVAL</h2>
                  <div className={styles.browseCampaignActions}>
                    <div className={styles.statusTabs} role="tablist" aria-label="Application status">
                      {([
                        ['PENDING', 'Pending'],
                        ['APPROVED', 'Approved'],
                        ['REJECTED', 'Rejected'],
                        ['ALL', 'All'],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          role="tab"
                          aria-selected={approvalStatusFilter === value}
                          className={`${styles.statusTab} ${approvalStatusFilter === value ? styles.statusTabActive : ''}`}
                          onClick={() => setApprovalStatusFilter(value)}
                        >
                          {label}
                          <span className={styles.statusTabCount}>{approvalCounts[value]}</span>
                        </button>
                      ))}
                    </div>
                    <label className={styles.campaignTableSearch}>
                      <Search size={14} />
                      <input
                        type="search"
                        placeholder="Search"
                        aria-label="Search offer applications"
                        value={approvalSearch}
                        onChange={(event) => setApprovalSearch(event.target.value)}
                      />
                    </label>
                  </div>
                </div>
                {pageNotice && <p className={styles.pageNotice} role="status">{pageNotice}</p>}
                <div className={styles.campaignTableWrap}>
                  <table className={`${styles.campaignTable} ${styles.approvalTable}`}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>View</th>
                        <th>Offer</th>
                        <th>Publisher</th>
                        <th>Payout</th>
                        <th>Geo</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOfferApplications.length ? filteredOfferApplications.map((application) => {
                        const CountryFlag = CountryFlags[application.campaignCountry.toUpperCase() as keyof typeof CountryFlags]
                        const submittedAt = new Date(application.createdAt)
                        return (
                          <tr key={application.id}>
                            <td>{application.campaignId}</td>
                            <td>
                              <Image
                                className={styles.campaignThumb}
                                src={application.campaignImage || `/affmine/campaigns/${application.campaignId}.png`}
                                alt=""
                                width={64}
                                height={50}
                                unoptimized={Boolean(application.campaignImage && !application.campaignImage.startsWith('/'))}
                              />
                            </td>
                            <td>
                              <Link className={styles.campaignName} href={`/campaigns/${application.campaignId}`}>
                                {application.campaignName}
                              </Link>
                            </td>
                            <td>
                              <div className={styles.approvalPublisher}>
                                <strong>{application.publisherUsername}</strong>
                                {application.publisherEmail ? <span>{application.publisherEmail}</span> : null}
                              </div>
                            </td>
                            <td><strong className={styles.campaignPayout}>${application.campaignPayout.toFixed(2)}</strong></td>
                            <td>{CountryFlag ? <CountryFlag className={styles.campaignFlag} aria-label={application.campaignCountry} /> : application.campaignCountry}</td>
                            <td>{Number.isNaN(submittedAt.getTime()) ? '—' : submittedAt.toLocaleDateString()}</td>
                            <td>
                              <span className={`${styles.approvalStatus} ${styles[`approvalStatus${application.status}` as 'approvalStatusPENDING' | 'approvalStatusAPPROVED' | 'approvalStatusREJECTED']}`}>
                                {application.status}
                              </span>
                            </td>
                            <td>
                              {application.status === 'PENDING' ? (
                                <div className={styles.approvalActions}>
                                  <button
                                    type="button"
                                    className={`${styles.offerAction} ${styles.approvalApprove}`}
                                    disabled={reviewingApplicationId === application.id}
                                    onClick={() => void reviewOfferApplication(application.id, 'APPROVED')}
                                  >
                                    <Check size={12} aria-hidden="true" />Approve
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.offerAction} ${styles.approvalReject}`}
                                    disabled={reviewingApplicationId === application.id}
                                    onClick={() => void reviewOfferApplication(application.id, 'REJECTED')}
                                  >
                                    <X size={12} aria-hidden="true" />Reject
                                  </button>
                                </div>
                              ) : (
                                <span className={styles.approvalReviewedBy}>
                                  {application.reviewedByUsername ? `by ${application.reviewedByUsername}` : '—'}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      }) : (
                        <tr>
                          <td className={styles.publisherEmpty} colSpan={9}>
                            {approvalStatusFilter === 'PENDING'
                              ? 'No offer applications awaiting review.'
                              : approvalStatusFilter === 'ALL'
                                ? 'No offer applications found.'
                                : `No ${approvalStatusFilter.toLowerCase()} applications.`}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )
        ) : isCampaignCatalog ? (
          <>
            <section className={`${styles.panel} ${styles.browseFilters}`}>
              <div className={styles.browseFiltersHeading}>
                <h2>FILTERS</h2>
                <button type="button" aria-expanded={showCampaignFilters} onClick={() => setShowCampaignFilters((show) => !show)}>
                  <ChevronDown size={14} className={showCampaignFilters ? styles.filterChevronOpen : ''} />
                  {showCampaignFilters ? 'Hide filters' : 'Show filters'}
                </button>
              </div>
              {showCampaignFilters && (
                <form className={styles.browseFilterForm} onSubmit={applyCampaignFilters}>
                  <div className={styles.browseFilterField}>
                    <label id="campaign-country-label" htmlFor="campaign-country-filter">Country</label>
                    <CampaignFilterSelect id="campaign-country-filter" label="Country" value={campaignFilters.country} options={campaignFilterOptions.country} onChange={(country) => setCampaignFilters((filters) => ({ ...filters, country }))} />
                  </div>
                  <div className={styles.browseFilterField}>
                    <label id="campaign-device-label" htmlFor="campaign-device-filter">Device</label>
                    <CampaignFilterSelect id="campaign-device-filter" label="Device" value={campaignFilters.device} options={campaignFilterOptions.device} onChange={(device) => setCampaignFilters((filters) => ({ ...filters, device }))} />
                  </div>
                  <div className={styles.browseFilterField}>
                    <label id="campaign-category-label" htmlFor="campaign-category-filter">Category</label>
                    <CampaignFilterSelect id="campaign-category-filter" label="Category" value={campaignFilters.category} options={campaignFilterOptions.category} onChange={(category) => setCampaignFilters((filters) => ({ ...filters, category }))} />
                  </div>
                  <div className={styles.browseFilterField}>
                    <label id="campaign-type-label" htmlFor="campaign-type-filter">Type</label>
                    <CampaignFilterSelect id="campaign-type-filter" label="Type" value={campaignFilters.type} options={campaignFilterOptions.type} onChange={(type) => setCampaignFilters((filters) => ({ ...filters, type }))} />
                  </div>
                  <button type="submit" className={styles.filterApply}>Filter</button>
                  <button type="button" className={styles.filterReset} onClick={resetCampaignFilters}>Reset</button>
                </form>
              )}
            </section>

            <section className={`${styles.panel} ${styles.browseCampaigns} ${isIncentiveOffers ? styles.incentiveCampaigns : ''}`}>
              <div className={styles.browseCampaignsHeading}>
                <h2><Tags size={16} fill="currentColor" />CAMPAIGNS</h2>
                <div className={styles.browseCampaignActions}>
                  {userRole === 'MANAGER' && pathname !== '/campaigns/new' && <Link href={isIncentiveOffers ? '/campaigns/add?placement=incentive' : '/campaigns/add'} className={`${styles.pagePrimaryButton} ${styles.addOfferButton}`}><Plus size={14} />Add offer</Link>}
                  <label className={styles.campaignTableSearch}><Search size={14} /><input type="search" placeholder="Search" aria-label="Search campaigns" value={campaignSearch} onChange={(event) => { setCampaignSearch(event.target.value); setCampaignPage(1) }} /></label>
                </div>
              </div>
              {pageNotice && (
                <div className={styles.pageNotice} role="status">
                  <span>{pageNotice}</span>
                  <button type="button" className={styles.pageNoticeDismiss} aria-label="Dismiss notice" onClick={() => setPageNotice('')}>
                    <X size={12} aria-hidden="true" />
                  </button>
                </div>
              )}
              <div className={styles.campaignTableWrap}>
                <table className={`${styles.campaignTable} ${isIncentiveOffers ? styles.campaignTableIncentive : ''} ${canManageOffers ? styles.campaignTableManager : ''} ${isIncentiveOffers && canManageOffers ? styles.campaignTableManagerIncentive : ''}`}>
                  <thead>
                    <tr>
                      {isIncentiveOffers && <th>Active</th>}
                      <th aria-sort={campaignSort.key === 'id' ? (campaignSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button type="button" onClick={() => sortCampaignsBy('id')}>ID</button></th>
                      <th>View</th>
                      <th aria-sort={campaignSort.key === 'name' ? (campaignSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button type="button" onClick={() => sortCampaignsBy('name')}>Name</button></th>
                      <th aria-sort={campaignSort.key === 'payout' ? (campaignSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button type="button" onClick={() => sortCampaignsBy('payout')}>Payout</button></th>
                      <th>Category</th><th>Geo</th><th>Device</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCampaigns.length ? visibleCampaigns.map((campaign) => {
                      const campaignGeos = getCampaignGeos(campaign)
                      const campaignTypes = campaign.offerTypes?.length ? campaign.offerTypes : (isIncentiveOffers ? ['CPI'] : ['CPL', 'SOI'])
                      const isIncentive = isIncentiveOffers
                      const actionKind = getOfferActionKind(campaign)
                      const incentiveActive = activeIncentiveOfferIds.includes(campaign.id)
                      const actionClass = actionKind === 'Apply'
                        ? styles.offerActionApply
                        : actionKind === 'Pending'
                          ? styles.offerActionPending
                          : styles.offerActionView
                      return <tr key={campaign.id} className={isIncentive && incentiveActive ? styles.incentiveOfferActiveRow : undefined}>
                        {isIncentive && (
                          <td className={styles.incentiveActiveCell}>
                            <div className={`${styles.incentiveCheckbox} ${incentiveActive ? styles.incentiveCheckboxChecked : ''}`}>
                              <input
                                id={`active-${campaign.id}`}
                                type="checkbox"
                                className={styles.incentiveCheckboxInput}
                                checked={incentiveActive}
                                disabled={actionKind === 'Pending'}
                                onChange={() => toggleIncentiveOfferActive(campaign.id)}
                                aria-label={`Activate offer ${campaign.id} for Content Locker and OfferWall`}
                              />
                              <label htmlFor={`active-${campaign.id}`} className={styles.incentiveCheckboxLabel} />
                            </div>
                          </td>
                        )}
                        <td>{campaign.id}</td>
                        <td>
                          <Image
                            className={`${styles.campaignThumb} ${isIncentive ? styles.campaignThumbIncentive : ''}`}
                            src={campaign.imageSource ?? (isIncentive ? `/affmine/preview_i/${campaign.id}.png` : `/affmine/campaigns/${campaign.id}.png`)}
                            alt=""
                            width={isIncentive ? 50 : 64}
                            height={50}
                            unoptimized={Boolean(campaign.imageSource) || isIncentive}
                          />
                        </td>
                        <td>
                          <div className={styles.campaignNameCell}>
                            {canNavigateOffer(campaign) ? (
                              <Link className={`${styles.campaignName} ${isIncentive ? styles.campaignNameIncentiveLink : ''}`} href={`/campaigns/${campaign.id}`}>{campaign.name}</Link>
                            ) : (
                              <span className={`${styles.campaignName} ${styles.campaignNameLocked}`} title={PENDING_OFFER_HINT}>{campaign.name}</span>
                            )}
                            {!isIncentive && campaign.isHot && <span className={`${styles.campaignHot} ${styles.campaignRowHot}`}>HOT</span>}
                            {campaign.status === 'PAUSED' && <span className={styles.campaignPausedLabel}>PAUSED</span>}
                          </div>
                        </td>
                        <td>
                          <strong className={`${styles.campaignPayout} ${isIncentive ? styles.campaignPayoutIncentive : ''}`}>${campaign.payout.toFixed(2)}</strong>
                          {!isIncentive && <span className={styles.campaignTags}>{campaignTypes.map((type) => <span key={type}>{type}</span>)}</span>}
                        </td>
                        <td>{campaign.category ?? 'E-mail Submit'}</td>
                        <td>
                          <span className={styles.campaignGeoFlags}>
                            {campaignGeos.map((geo) => {
                              const Flag = CountryFlags[geo.toUpperCase() as keyof typeof CountryFlags]
                              if (isIncentive) {
                                return (
                                  <img
                                    key={geo}
                                    className={styles.campaignFlagImg}
                                    src={`/affmine/flags/${geo.toLowerCase()}.png`}
                                    alt={campaignCountryLabels[geo] ?? geo}
                                    title={campaignCountryLabels[geo] ?? geo}
                                    height={18}
                                  />
                                )
                              }
                              return Flag
                                ? <Flag key={geo} className={styles.campaignFlag} aria-label={geo} title={campaignCountryLabels[geo] ?? geo} />
                                : <span key={geo}>{geo}</span>
                            })}
                          </span>
                        </td>
                        <td><CampaignDeviceIcons devices={getCampaignDevices(campaign)} /></td>
                        <td>
                          <div className={styles.offerRowActions}>
                            {actionKind === 'Apply' && !isIncentive ? (
                              <button
                                type="button"
                                className={`${styles.offerAction} ${actionClass}`}
                                onClick={() => {
                                  setApplyCampaignId(campaign.id)
                                  setApplyTermsAccepted(false)
                                  setApplyTermsError(false)
                                }}
                              >
                                <i className="fa fa-check" aria-hidden="true" />Apply
                              </button>
                            ) : actionKind === 'Pending' && !isIncentive ? (
                              <button
                                type="button"
                                className={`${styles.offerAction} ${actionClass}`}
                                disabled
                                title={PENDING_OFFER_HINT}
                                aria-label={`Offer ${campaign.id} ${PENDING_OFFER_HINT.toLowerCase()}`}
                              >
                                <i className="fa fa-check" aria-hidden="true" />Pending
                              </button>
                            ) : (
                              <a className={`${styles.offerAction} ${styles.offerActionView}`} href={`/campaigns/${campaign.id}`} target="_blank" rel="noreferrer">
                                <i className="fa fa-check" aria-hidden="true" />View
                              </a>
                            )}
                            {canManageOffers && !isIncentive && (
                              <div className={styles.offerActionMenu} data-offer-action-menu>
                                <button type="button" className={styles.offerManagementAction} aria-label={`More actions for offer ${campaign.id}`} title="Offer actions" aria-haspopup="menu" aria-expanded={openOfferActionsId === campaign.id} onClick={(event) => {
                                  if (openOfferActionsId === campaign.id) {
                                    setOpenOfferActionsId(null)
                                    setOfferActionMenuPosition(null)
                                    return
                                  }
                                  const buttonRect = event.currentTarget.getBoundingClientRect()
                                  setOfferActionMenuPosition({ top: buttonRect.bottom + 4, left: Math.max(8, Math.min(buttonRect.right - 210, window.innerWidth - 218)) })
                                  setOpenOfferActionsId(campaign.id)
                                }}><MoreHorizontal size={15} aria-hidden="true" /></button>
                                {openOfferActionsId === campaign.id && (
                                  <div className={styles.offerActionMenuItems} style={offerActionMenuPosition ?? undefined} role="menu">
                                    <button type="button" role="menuitem" onClick={() => { router.push(`/campaigns/add?edit=${encodeURIComponent(campaign.id)}`); setOpenOfferActionsId(null); setOfferActionMenuPosition(null) }}><Pencil size={14} aria-hidden="true" />Edit offer</button>
                                    <button type="button" role="menuitem" onClick={() => { updateCampaignOfferStatus(campaign, { isHot: !campaign.isHot }); setOpenOfferActionsId(null); setOfferActionMenuPosition(null) }}><Flame size={14} aria-hidden="true" />{campaign.isHot ? 'Remove HOT' : 'Mark as HOT'}</button>
                                    {campaign.status === 'PAUSED'
                                      ? <button type="button" role="menuitem" onClick={() => { updateCampaignOfferStatus(campaign, { status: 'ACTIVE' }); setOpenOfferActionsId(null); setOfferActionMenuPosition(null) }}><Play size={14} aria-hidden="true" />Mark as Active</button>
                                      : <button type="button" role="menuitem" onClick={() => { updateCampaignOfferStatus(campaign, { status: 'PAUSED' }); setOpenOfferActionsId(null); setOfferActionMenuPosition(null) }}><Pause size={14} aria-hidden="true" />Pause offer</button>}
                                    <button type="button" role="menuitem" className={styles.offerActionMenuDelete} onClick={() => { setOpenOfferActionsId(null); setOfferActionMenuPosition(null); deleteCampaignOffer(campaign) }}><Trash2 size={14} aria-hidden="true" />Delete offer</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    }) : <tr><td className={styles.campaignNoResults} colSpan={isIncentiveOffers ? 9 : 8}>{isIncentiveOffers ? 'No incentive offers found' : 'No matching campaigns found'}</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className={styles.campaignTableFooter}>
                <span>Showing {filteredCampaigns.length ? (campaignPage - 1) * campaignPageSize + 1 : 0} to {Math.min(campaignPage * campaignPageSize, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns</span>
                <div className={styles.campaignPagination}>
                  <button type="button" disabled={campaignPage === 1} onClick={() => setCampaignPage((page) => page - 1)}>Previous</button>
                  {Array.from({ length: campaignPageCount }, (_, index) => index + 1).map((page) => <button type="button" className={page === campaignPage ? styles.campaignPageActive : ''} key={page} onClick={() => setCampaignPage(page)}>{page}</button>)}
                  <button type="button" disabled={campaignPage === campaignPageCount} onClick={() => setCampaignPage((page) => page + 1)}>Next</button>
                </div>
              </div>
            </section>
          </>
        ) : campaignDetail ? (
          <section className={`${styles.panel} ${styles.dataPage} ${styles.campaignDetails}`}>
            <div className={styles.detailHeading}>
              <Link href={detailedCampaignIncentiveOnly ? '/incentive_offers' : '/campaigns/browse'}>‹ Back to campaigns</Link>
            </div>
            {detailedCampaignLocked ? (
              <div className={styles.offerPendingLock} role="status">
                <span className={styles.offerPendingLockIcon} aria-hidden="true"><Lock size={20} strokeWidth={2} /></span>
                <h2>Pending approval</h2>
                <p className={styles.offerPendingLockOffer}>
                  #{detailedCampaign?.id} {detailedCampaign?.name}
                </p>
                <p className={styles.offerPendingLockHint}>
                  This offer cannot be opened or used until your manager approves it.
                </p>
                {userRole === 'PUBLISHER' ? (
                  <p className={styles.offerPendingLockHint}>Returning to browse…</p>
                ) : (
                  <Link href="/campaigns/browse" className={styles.pagePrimaryButton}>Back to browse</Link>
                )}
              </div>
            ) : detailedCampaign ? (
              <>
                <div className={styles.detailTitleBlock}>
                  <span className={styles.detailTitleId}>#{detailedCampaign.id}</span>
                  <h2>
                    <span className={styles.detailTitleName}>{detailedCampaign.name}</span>
                    {detailedCampaign.isHot && <span className={styles.campaignHot}>HOT</span>}
                    {!detailedCampaignIncentiveOnly && (detailedCampaign.status === 'PAUSED'
                      ? <span className={styles.campaignPaused}><Pause size={11} aria-hidden="true" />Paused</span>
                      : <span className={styles.campaignActive}><Check size={11} aria-hidden="true" />Active</span>)}
                  </h2>
                </div>
                <div className={styles.detailContentGrid}>
                  <div className={styles.infoPanel}>
                    <div className={styles.panelTitle}><span className={styles.panelTitleIcon}></span>Details</div>
                    <div className={styles.infoPanelBody}>
                      <div className={styles.infoRow}><div className={styles.infoLabel}>Description</div><div className={styles.infoValue}>{detailedCampaign.description ?? 'Get $1000 Towards iPhone 18 Pro!'}</div></div>
                      <div className={styles.infoRow}><div className={styles.infoLabel}>Category</div><div className={styles.infoValue}>{detailedCampaign.category ?? 'E-mail Submit'}</div></div>
                      <div className={styles.infoRow}><div className={styles.infoLabel}>Device</div><div className={styles.infoValue}>{formatCampaignDevices(getCampaignDevices(detailedCampaign))}</div></div>
                      <div className={styles.infoRow}>
                        <div className={styles.infoLabel}>Incentive</div>
                        <div className={styles.infoValue} style={{ color: detailedCampaignIncentiveOnly ? '#008000' : '#d24d4d' }}>
                          {detailedCampaignIncentiveOnly ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div className={styles.infoRow}><div className={styles.infoLabel}>Converts on</div><div className={styles.infoValue}>{detailedCampaign.category ?? 'E-mail Submit'}</div></div>
                      <div className={styles.infoRow}>
                        <div className={styles.infoLabel}>Preview</div>
                        <div className={styles.infoValue}>
                          <button type="button" className={styles.previewButton} aria-label="Enlarge offer preview" onClick={() => setCampaignPreviewOpen(true)}>
                            <Image
                              className={styles.detailPreviewThumb}
                              src={detailedCampaign.imageSource ?? `/affmine/campaigns/${detailedCampaign.id}.png`}
                              alt="Offer preview"
                              width={160}
                              height={100}
                              unoptimized={Boolean(detailedCampaign.imageSource)}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.payoutColumn}>
                    <div className={styles.payoutPanel}>
                      <div className={styles.panelTitle}><span className={styles.panelTitleIcon}></span>GEO and Payouts</div>
                      <div className={styles.payoutTableWrap}>
                        <table className={styles.dataTable}>
                          <tbody>
                            <tr>
                              <td>
                                <span className={styles.geoFlag}>
                                  <img
                                    src={`/affmine/flags/${detailedCampaign.country.toLowerCase()}.png`}
                                    alt={detailedCampaign.country}
                                    onError={(event) => { event.currentTarget.style.display = 'none' }}
                                  />
                                </span>
                                {' '}
                                {campaignCountryLabels[detailedCampaign.country] ?? detailedCampaign.country}
                              </td>
                              <td>{formatCampaignDevices(getCampaignDevices(detailedCampaign))}</td>
                              <td><strong>{detailedCampaign.payout.toFixed(2)} USD</strong></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {!detailedCampaignIncentiveOnly && (
                      <button type="button" className={styles.noticeLink} onClick={() => setCampaignNoticeOpen(true)}>MANDATORY NOTICE FROM ADVERTISER (MUST READ)</button>
                    )}
                  </div>
                </div>
                {detailedCampaignIncentiveOnly ? (
                  <>
                    <h4 className={styles.incentiveDirectLinkNotice}>
                      Direct linking not allowed,{' '}
                      <Link href="/contentlocker/new">create a content locker</Link>
                      {' '}or{' '}
                      <Link href="/offerwall/new">offerwall</Link>
                      {' '}to use this offer.
                    </h4>
                    <button type="button" className={styles.noticeLink} onClick={() => setCampaignNoticeOpen(true)}>MANDATORY NOTICE FROM ADVERTISER (MUST READ)</button>
                  </>
                ) : (
                  <div className={styles.trackingPanel}>
                    <div className={styles.panelTitle}><span className={styles.panelTitleIcon}></span>Tracking</div>
                    <div className={styles.trackingContent}>
                      <div className={styles.trackingLeft}>
                        <div className={styles.fieldLabel}>Tracking URL</div>
                        <div className={styles.trackingBadgeSuccess}>NEW tracking link - increased performance</div>
                        <textarea aria-label="New tracking URL" readOnly value={generatedTrackingUrl} onClick={(event) => event.currentTarget.select()} />
                        <div className={styles.trackingBadgePrimary}>OLD tracking link</div>
                        <input aria-label="Old tracking URL" type="text" readOnly value={`https://go2affm.com/c/?p=63460&o=${detailedCampaign.id}`} onClick={(event) => event.currentTarget.select()} />
                        <p>You can append subIDs to this URL for tracking purposes, for example add <code>&amp;s1=1234</code> where 1234 is your unique tracking ID. If you have <Link href="/tools/postback">postback</Link> set up, once a lead is generated, this information will be sent according to your postback setup.</p>
                        <p>Supported subIDs: <code>&amp;s1=</code>, <code>&amp;s2=</code>, <code>&amp;s3=</code>, <code>&amp;s4=</code></p>
                      </div>
                      <div className={styles.trackingRight}>
                        {['Sub ID 1', 'Sub ID 2', 'Sub ID 3', 'Sub ID 4'].map((label, index) => (
                          <label className={styles.subIdField} key={label}>
                            <span>{label}</span>
                            <input type="text" value={trackingSubIds[index]} maxLength={100} onChange={(event) => setTrackingSubIds((current) => current.map((value, currentIndex) => currentIndex === index ? event.target.value : value))} />
                          </label>
                        ))}
                        <div className={styles.trackingActions}>
                          <button type="button" className={styles.pageSecondaryButton} onClick={resetCampaignTrackingLink}><RotateCcw size={13} aria-hidden="true" />Reset</button>
                          <button type="button" className={styles.pagePrimaryButton} onClick={updateCampaignTrackingLink}><Check size={13} aria-hidden="true" />Update</button>
                        </div>
                        {trackingMessage && <p className={styles.trackingStatus} role="status">{trackingMessage}</p>}
                      </div>
                    </div>
                  </div>
                )}
                {(campaignNoticeOpen || campaignPreviewOpen) && (
                  <div className={styles.campaignDialogBackdrop} onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                      setCampaignNoticeOpen(false)
                      setCampaignPreviewOpen(false)
                    }
                  }}>
                    <section className={styles.campaignDialog} role="dialog" aria-modal="true" aria-labelledby="campaign-dialog-title">
                      <header className={styles.campaignDialogHeader}>
                        <h2 id="campaign-dialog-title">{campaignNoticeOpen ? 'MANDATORY NOTICE FROM ADVERTISER (MUST READ)' : 'Offer preview'}</h2>
                        <button ref={campaignDialogCloseRef} type="button" className={styles.campaignDialogClose} aria-label="Close dialog" onClick={() => {
                          setCampaignNoticeOpen(false)
                          setCampaignPreviewOpen(false)
                        }}><X size={18} /></button>
                      </header>
                      {campaignNoticeOpen ? (
                        <div className={styles.campaignDialogBody}>
                          <p><strong>Affmine is required to provide notice that you are prohibited from engaging in acts or practices in violation of the Federal Trade Commission Consent Order while promoting RewardZone USA and related offers. All advertising material must meet the requirements in the Advertising &amp; Marketing Requirements policy, including its pre-approved examples. Violations may result in disciplinary action, including immediate termination and forfeiture of monies owed.</strong></p>
                          <p><a href="https://network.affmine.com/notice/FTC-Consent-Order.pdf" target="_blank" rel="noreferrer">Federal Trade Commission Consent Order</a></p>
                          <p><a href="https://network.affmine.com/notice/RZ-Advertising-Marketing-Requirements.pdf" target="_blank" rel="noreferrer">Advertising &amp; Marketing Requirements</a></p>
                        </div>
                      ) : (
                        <div className={styles.campaignDialogBody}>
                          <Image className={styles.campaignPreviewLarge} src={`/affmine/campaigns/${detailedCampaign.id}.png`} alt="Full offer preview" width={700} height={440} />
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.dataPageEmpty}>Campaign details are not available for this offer.</div>
            )}
          </section>
        ) : pathname === '/payments' ? (
          <>
            <section className={`${styles.panel} ${styles.dataPage} ${styles.paymentInfo}`}>
              <h2 className={styles.sectionTitle}><i className="fa fa-info" aria-hidden="true" />INFO</h2>
              <div className={styles.paymentSummary}>
                <div><strong className={styles.paymentUp}>$0.00</strong><span>Total Paid</span></div>
                <div><strong>$0.00</strong><span>Pending</span></div>
                <div><strong className={styles.paymentUp}>$4.10</strong><span>Earnings since last invoice</span></div>
                <div><strong>0</strong><span>Total payments</span></div>
              </div>
              <section className={styles.paymentInfoSection}>
                <h2>Payment Schedule</h2>
                <p>Your payment schedule is: <strong>Weekly</strong>. Weekly means that you will be paid every week. Billing period is <strong>Monday to Sunday</strong>, invoice is generated and payment is sent on <strong>Tuesday</strong>.</p>
              </section>
              <section className={styles.paymentInfoSection}>
                <h2>Payment Details</h2>
                <p>You must meet the minimum payment threshold of <strong>$50</strong> for ACH, Payoneer, PayPal, eCheck and <strong>$100</strong> for Wire, in order to receive the payment. Unpaid earnings accumulate in your account until your balance reaches the threshold, then you&apos;ll be paid on the next scheduled payment date.</p>
              </section>
              <section className={styles.paymentInfoSection}>
                <h2>Tax Forms</h2>
                <p>Tax form is based on the country of your residency and whether you are an individual or business. Please use the correct form as it is really important, see instructions below:</p>
                <ul>
                  <li>For Non-US individuals - complete W-8BEN form</li>
                  <li>For Non-US businesses - complete W-8BEN-E form</li>
                  <li>For USA individuals and businesses - complete W-9 form</li>
                </ul>
              </section>
              <section className={`${styles.paymentInfoSection} ${styles.payoneerNotice}`}>
                <h2>Payoneer Payments <span>IMPORTANT!</span> <b>ACTIVE AGAIN</b></h2>
                <p>In order to be able to receive Payoneer payments, you need to follow some steps. <a href="https://network.affmine.com/payoneer" target="_blank" rel="noreferrer">Please see instructions here.</a></p>
              </section>
            </section>
            <section className={`${styles.panel} ${styles.dataPage} ${styles.paymentSettings}`}>
              <h2 className={styles.sectionTitle}><i className="fa fa-credit-card" aria-hidden="true" />PAYMENT SETTINGS</h2>
              <p role="status"><strong>You need at least $40 earnings and after that you will be able to set up your payment details.</strong></p>
            </section>
            <section className={`${styles.panel} ${styles.dataPage} ${styles.paymentHistory}`}>
              <h2 className={styles.sectionTitle}><i className="fa fa-credit-card" aria-hidden="true" />PAYMENT HISTORY</h2>
              <div className={styles.dataTableWrap}>
                <table className={styles.dataTable}>
                  <thead><tr>{['Period', 'Amount Paid', 'Method', 'Status', 'Invoice'].map((column) => <th key={column} className={styles.sortableHeader}>{column}</th>)}</tr></thead>
                  <tbody><tr><td colSpan={5}>No data available</td></tr></tbody>
                </table>
              </div>
              <div className={styles.reportPagination}><div><button type="button" disabled>Previous</button><button type="button" disabled>Next</button></div></div>
            </section>
          </>
        ) : pathname === '/contentlocker' || pathname === '/offerwall' ? (
          (() => {
            const kind = pathname === '/contentlocker' ? 'locker' as const : 'offerwall' as const
            const tools = (kind === 'locker' ? contentLockers : offerwalls)
              .filter((tool) => {
                const query = pageSearch.trim().toLowerCase()
                if (!query) return true
                return toolDisplayName(tool).toLowerCase().includes(query) || tool.id.toLowerCase().includes(query)
              })
            return (
              <section className={`${styles.panel} ${styles.dataPage} ${styles.incentiveToolsPage}`}>
                <div className={styles.dataPageHeading}>
                  <h2>{kind === 'locker' ? 'Content Lockers' : 'OfferWalls'}</h2>
                </div>

                <div className={styles.incentiveToolsHero}>
                  <div className={styles.incentiveToolsHeroCopy}>
                    <p className={styles.incentiveToolsEyebrow}>Publisher setup</p>
                    <h3>{kind === 'locker' ? 'Gate downloads, videos, or pages behind offers' : 'Let users earn rewards by completing offers'}</h3>
                    <p>
                      Built from your active <Link href="/incentive_offers">Incentive Offers</Link>.
                      Share a link or paste the embed on your site — visitors complete offers, you get paid.
                    </p>
                  </div>
                  <div className={styles.incentiveToolsHeroStats}>
                    <div><b>{tools.length}</b><span>Your tools</span></div>
                    <div><b>{activeIncentiveCatalog.length}</b><span>Live offers</span></div>
                  </div>
                </div>

                <ol className={styles.incentiveToolsSteps}>
                  <li>
                    <span>1</span>
                    <div>
                      <strong>Pick offers</strong>
                      <p>Use active Incentive Offers (or choose specific ones).</p>
                    </div>
                  </li>
                  <li>
                    <span>2</span>
                    <div>
                      <strong>{kind === 'locker' ? 'Create a locker' : 'Create a wall'}</strong>
                      <p>{kind === 'locker' ? 'Set how many offers unlock your content.' : 'Set points, currency, and look & feel.'}</p>
                    </div>
                  </li>
                  <li>
                    <span>3</span>
                    <div>
                      <strong>Share or embed</strong>
                      <p>Copy the public link or iframe code into your site/app.</p>
                    </div>
                  </li>
                </ol>

                <div className={styles.incentiveToolsToolbar}>
                  <input
                    type="search"
                    aria-label={kind === 'locker' ? 'Search content lockers' : 'Search offerwalls'}
                    placeholder={kind === 'locker' ? 'Search lockers…' : 'Search offerwalls…'}
                    value={pageSearch}
                    onChange={(event) => setPageSearch(event.target.value)}
                  />
                </div>

                {tools.length ? (
                  <div className={styles.incentiveToolGrid}>
                    {tools.map((tool) => {
                      const publicPath = toolPublicPath(tool)
                      const offerCount = tool.selectedOfferIds.length || activeIncentiveCatalog.length
                      const absoluteUrl = `${appOrigin}${publicPath}`
                      return (
                        <article key={tool.id} className={styles.incentiveToolCard}>
                          <header className={styles.incentiveToolCardHead}>
                            <div>
                              <p className={styles.incentiveToolBadge}>{kind === 'locker' ? 'Content Locker' : 'OfferWall'}</p>
                              <h3>{toolDisplayName(tool)}</h3>
                              <p className={styles.incentiveToolMeta}>
                                {offerCount} offer{offerCount === 1 ? '' : 's'} · Updated {new Date(tool.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={styles.incentiveToolLive}>Live</span>
                          </header>

                          <div className={styles.incentiveToolUrlBox}>
                            <label htmlFor={`tool-url-${tool.id}`}>Share link</label>
                            <div>
                              <input id={`tool-url-${tool.id}`} readOnly value={absoluteUrl || publicPath} />
                              <button
                                type="button"
                                className={styles.incentiveToolCopyBtn}
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(absoluteUrl || publicPath)
                                    setCopiedToolId(`url-${tool.id}`)
                                    setPageNotice('Share link copied.')
                                  } catch {
                                    setPageNotice('Could not copy link.')
                                  }
                                }}
                              >
                                {copiedToolId === `url-${tool.id}` ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>

                          <div className={styles.incentiveToolCardActions}>
                            <Link href={publicPath} target="_blank" rel="noreferrer" className={styles.pagePrimaryButton}>
                              Open preview
                            </Link>
                            <button type="button" className={styles.pageSecondaryButton} onClick={() => void copyToolEmbed(tool)}>
                              {copiedToolId === tool.id ? 'Embed copied' : 'Copy embed'}
                            </button>
                            <Link
                              href={kind === 'locker' ? `/contentlocker/edit/${tool.id}` : `/offerwall/edit/${tool.id}`}
                              className={styles.pageSecondaryButton}
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              className={styles.incentiveToolDelete}
                              onClick={() => {
                                if (window.confirm(`Delete “${toolDisplayName(tool)}”? This cannot be undone.`)) {
                                  deleteIncentiveTool(kind, tool.id)
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <div className={styles.incentiveToolsEmpty}>
                    <div className={styles.incentiveToolsEmptyIcon} aria-hidden="true">{kind === 'locker' ? '🔒' : '🎁'}</div>
                    <h3>{kind === 'locker' ? 'No content lockers yet' : 'No offerwalls yet'}</h3>
                    <p>
                      {kind === 'locker'
                        ? 'Create one in a minute, then paste the embed where you want visitors to unlock content.'
                        : 'Create a rewards wall, then drop the embed into your site or app.'}
                    </p>
                    <div className={styles.incentiveToolsEmptyActions}>
                      <Link className={styles.pagePrimaryButton} href={kind === 'locker' ? '/contentlocker/new' : '/offerwall/new'}>
                        <i className="fa fa-plus" aria-hidden="true" />
                        {kind === 'locker' ? 'Create Content Locker' : 'Create OfferWall'}
                      </Link>
                      <Link className={styles.pageSecondaryButton} href="/incentive_offers">
                        Review Incentive Offers
                      </Link>
                    </div>
                  </div>
                )}
                {pageNotice && <p className={styles.pageNotice} role="status">{pageNotice}</p>}
              </section>
            )
          })()
        ) : tablePage ? (
          <section className={`${styles.panel} ${styles.dataPage}`}>
            <div className={styles.dataPageHeading}><h2>{tablePage.title}</h2></div>
            <div className={styles.dataTableWrap}>
              <table className={styles.dataTable}>
                <thead><tr>{tablePage.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                <tbody><tr><td colSpan={tablePage.columns.length}>No data available</td></tr></tbody>
              </table>
            </div>
          </section>
        ) : isWizard ? (
          <section className={`${styles.panel} ${styles.dataPage} ${styles.wizardPage}`}>
            <div className={styles.wizardBack}>
              <Link href={isContentLockerWizard ? '/contentlocker' : '/offerwall'}>‹ Back to {isContentLockerWizard ? 'Content Lockers' : 'Offer Walls'}</Link>
            </div>
            <div className={styles.wizardTabs} role="tablist" aria-label="Setup steps">
              {(isContentLockerWizard
                ? ['1. Basics', '2. Look & feel', '3. Publish']
                : ['1. Basics', '2. Look & feel', '3. Publish']
              ).map((tab, index) => (
                <button type="button" role="tab" aria-selected={wizardStep === index} className={wizardStep === index ? styles.wizardTabActive : ''} key={tab} onClick={() => setWizardStep(index)}>
                  {tab}
                </button>
              ))}
            </div>
            <p className={styles.wizardPublisherTip}>
              {wizardStep === 0
                ? (isContentLockerWizard
                  ? 'Tip: Start with 1 conversion required so users unlock quickly.'
                  : 'Tip: 100 points per $1 is a clear, publisher-friendly default.')
                : wizardStep === 1
                  ? 'Tip: Keep titles short — users see this on mobile too.'
                  : 'Tip: Copy the share link for chats/SMS, or embed code for your website.'}
            </p>
            <div className={styles.wizardLayout}>
              <section className={styles.wizardStepContent}>
                {wizardStep === 0 ? (
                  <>
                    <h2>{isContentLockerWizard ? 'GENERAL' : 'GENERAL SETTINGS'}</h2>
                    {isContentLockerWizard ? (
                      <>
                        {wizardTextField('lockerName', 'Name', 'Choose a name')}
                        <div className={styles.wizardFieldGrid}>
                          {wizardSelect('conversionsRequired', 'Conversions required', ['1', '2', '3', '4', '5'])}
                          {wizardTextField('minimumPayout', 'Minimum payout', '0.25', 'number')}
                          {wizardSelect('desktopMaxOffers', 'Desktop max offers', ['1', '2', '3', '4', '5'])}
                          {wizardSelect('mobileMaxOffers', 'Mobile max offers', ['No limit', '1', '2', '3', '4', '5'])}
                        </div>
                        {wizardSelect('unlockAction', 'Unlock action', ['Redirect to URL', 'Remove locker'])}
                        {wizardTextField('redirectUrl', 'Redirect URL', 'https://example.com')}
                        {wizardSelect('javascriptAction', 'JavaScript action', ['Show on page load', 'Use onClick() button'])}
                      </>
                    ) : (
                      <>
                        <div className={styles.wizardFieldGrid}>
                          {wizardTextField('offerwallName', 'Offer Wall Name', 'Choose a name')}
                          {wizardTextField('exchangeRate', 'Exchange Rate (per 1 USD)', 'e.g: 200', 'number')}
                          {wizardTextField('currencyName', 'Currency Name', 'e.g: Points/Coins/Tokens')}
                          {wizardTextField('minimumPayout', 'Minimum Payout (optional)', 'e.g: 0.20 (not recommended)', 'number')}
                        </div>
                        {wizardToggle('roundCurrency', 'Round Currency', "You can round the user's points to whole numbers.")}
                        {wizardToggle('hideCurrency', 'Hide Currency', 'Currency name can be hidden and show only numbers.')}
                      </>
                    )}
                  </>
                ) : wizardStep === 1 ? (
                  <>
                    <h2>CUSTOMIZATION</h2>
                    {isContentLockerWizard ? (
                      <>
                        <h3>GENERAL</h3>
                        {wizardTextField('lockerTitle', 'Title', 'Complete an offer to unlock')}
                        {wizardToggle('showLock', 'Show lock icon')}
                        {wizardTextField('lockerDescription', 'Description', 'Unlocking will allow access to the premium content.')}
                        {wizardTextField('lockerButtonText', 'Button text', 'Unlock content')}
                        {wizardTextField('lockerMainColor', 'Main Color', '', 'color')}
                        {wizardTextField('lockerBackground', 'Background Color (Desktop)', '', 'color')}
                        <h3>OFFERS SECTION</h3>
                        {wizardTextField('offersBackground', 'Background Color', '', 'color')}
                        {wizardTextField('offersTextColor', 'Text Color', '', 'color')}
                        {wizardTextField('offersButtonColor', 'Button Color', '', 'color')}
                      </>
                    ) : (
                      <>
                        <h3>HEADER SECTION</h3>
                        {wizardTextField('offerwallTitle', 'Title', 'Complete offers and earn rewards')}
                        {wizardTextField('offerwallBackground', 'Background Color', '', 'color')}
                        <h3>OFFERS SECTION</h3>
                        {wizardTextField('offerBoxBackground', 'Offers box background', '', 'color')}
                        {wizardTextField('offerBoxText', 'Offers box text', '', 'color')}
                        {wizardTextField('offerButtonColor', 'Offers button color', '', 'color')}
                        {wizardTextField('offerButtonBorder', 'Offers button border', '', 'color')}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h2>FINISH</h2>
                    <p className={styles.pageHint}>
                      Publish to get a live public URL and embed code powered by your active Incentive Offers.
                      Offer clicks open each campaign’s conversion URL.
                    </p>
                    <div className={styles.wizardOfferPicker}>
                      <div className={styles.wizardOfferPickerHead}>
                        <strong>Connected incentive offers</strong>
                        <button
                          type="button"
                          className={styles.addOfferTextButton}
                          onClick={() => setWizardSelectedOfferIds([])}
                          disabled={wizardSelectedOfferIds.length === 0}
                        >
                          Use all active
                        </button>
                      </div>
                      <div className={styles.wizardOfferPickerList}>
                        {activeIncentiveCatalog.length ? activeIncentiveCatalog.map((offer) => {
                          const selected = wizardSelectedOfferIds.length === 0 || wizardSelectedOfferIds.includes(offer.id)
                          return (
                            <label key={offer.id} className={`${styles.wizardOfferPick} ${selected ? styles.wizardOfferPickSelected : ''}`}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => {
                                  setWizardSelectedOfferIds((current) => {
                                    if (current.length === 0) {
                                      return activeIncentiveCatalog
                                        .map((item) => item.id)
                                        .filter((id) => id !== offer.id)
                                    }
                                    if (current.includes(offer.id)) {
                                      const next = current.filter((id) => id !== offer.id)
                                      return next
                                    }
                                    return [...current, offer.id]
                                  })
                                }}
                              />
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={offer.imageSource || `/affmine/preview_i/${offer.id}.png`} alt="" width={28} height={28} />
                              <span>
                                <b>#{offer.id}</b> {offer.name}
                                <small>${offer.payout.toFixed(2)} · {offer.offerLink}</small>
                              </span>
                            </label>
                          )
                        }) : (
                          <p className={styles.pageHint}>No active incentive offers. Activate some on <Link href="/incentive_offers">Incentive Offers</Link>.</p>
                        )}
                      </div>
                    </div>
                    {editingToolId ? (
                      <>
                        <label className={styles.wizardField}>
                          Public URL
                          <input
                            readOnly
                            value={`${appOrigin}${toolPublicPath({ id: editingToolId, kind: isContentLockerWizard ? 'locker' : 'offerwall' })}`}
                          />
                        </label>
                        <label className={styles.wizardField}>
                          Integration code
                          <textarea
                            readOnly
                            rows={4}
                            value={toolEmbedCode(
                              {
                                id: editingToolId,
                                kind: isContentLockerWizard ? 'locker' : 'offerwall',
                                name: '',
                                createdAt: '',
                                updatedAt: '',
                                fields: wizardFields,
                                toggles: wizardToggles,
                                selectedOfferIds: wizardSelectedOfferIds,
                              },
                              appOrigin,
                            )}
                          />
                        </label>
                      </>
                    ) : (
                      <label className={styles.wizardField}>
                        Integration code
                        <textarea readOnly value="Publish this tool to generate a live iframe embed connected to incentive offer URLs." rows={3} />
                      </label>
                    )}
                    <div className={styles.wizardFinishActions}>
                      <button type="button" className={styles.pagePrimaryButton} onClick={saveIncentiveTool}>
                        {editingToolId ? 'Save changes' : `Create ${isContentLockerWizard ? 'Content Locker' : 'OfferWall'}`}
                      </button>
                      {editingToolId ? (
                        <Link
                          className={styles.pageSecondaryButton}
                          href={toolPublicPath({ id: editingToolId, kind: isContentLockerWizard ? 'locker' : 'offerwall' })}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open live preview
                        </Link>
                      ) : null}
                    </div>
                    {pageNotice && <p className={styles.pageNotice} role="status">{pageNotice}</p>}
                  </>
                )}
                {wizardStep < 2 && (
                  <div className={styles.wizardNavigation}>
                    <button type="button" className={styles.pageSecondaryButton} disabled={wizardStep === 0} onClick={() => setWizardStep((step) => Math.max(0, step - 1))}>Previous</button>
                    <button type="button" className={styles.pagePrimaryButton} onClick={() => setWizardStep((step) => Math.min(2, step + 1))}>Next →</button>
                  </div>
                )}
              </section>
              <aside className={styles.wizardPreview}>
                <div className={styles.wizardPreviewHeader}>
                  <strong>ⓘ&nbsp; Live preview</strong>
                  <select aria-label="Preview as" value={wizardFields.previewDevice ?? 'Desktop'} onChange={(event) => setWizardFields((fields) => ({ ...fields, previewDevice: event.target.value }))}>
                    <option>Desktop</option>
                    <option>Mobile</option>
                  </select>
                </div>
                {isContentLockerWizard ? (
                  <div
                    className={`${styles.lockerPreview} ${wizardFields.previewDevice === 'Mobile' ? styles.wizardPreviewMobile : ''}`}
                    style={{
                      background: wizardFields.lockerBackground || '#fff',
                      ['--locker-btn' as string]: wizardFields.offersButtonColor || '#5cb85c',
                      ['--locker-offers-bg' as string]: wizardFields.offersBackground || '#f7f8f9',
                      ['--locker-offers-text' as string]: wizardFields.offersTextColor || '#58666e',
                    }}
                  >
                    <div className={styles.lockerPreviewHead}>
                      {wizardToggles.showLock ? <span aria-hidden="true">🔒</span> : null}
                      <strong>{wizardFields.lockerTitle || 'Complete an offer below to unlock your content.'}</strong>
                    </div>
                    <p>{wizardFields.lockerDescription || 'Unlocking will allow access to the premium content.'}</p>
                    <div className={styles.lockerPreviewProgress}>
                      0 / {wizardFields.conversionsRequired || '1'} required · min ${wizardFields.minimumPayout || '0.25'}
                    </div>
                    {wizardPreviewOffers.length ? wizardPreviewOffers.map((offer) => (
                      <div key={offer.id} className={styles.lockerPreviewOffer}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={offer.imageSource || `/affmine/preview_i/${offer.id}.png`} alt="" width={36} height={36} />
                        <span>
                          <b>{offer.name}</b>
                          <small>${offer.payout.toFixed(2)} · {offer.country}</small>
                        </span>
                        <button
                          type="button"
                          onClick={() => window.open(offer.offerLink, '_blank', 'noopener,noreferrer')}
                        >
                          FREE
                        </button>
                      </div>
                    )) : (
                      <div className={styles.lockerPreviewEmpty}>Activate incentive offers to preview real conversions here.</div>
                    )}
                    <button type="button" className={styles.lockerPreviewUnlock} disabled>
                      {wizardFields.lockerButtonText || 'Unlock content'}
                    </button>
                  </div>
                ) : (
                  <div
                    className={`${styles.offerwallPreview} ${wizardFields.previewDevice === 'Mobile' ? styles.wizardPreviewMobile : ''}`}
                    style={{
                      background: wizardFields.offerwallBackground || '#fff',
                      ['--wall-btn' as string]: wizardFields.offerButtonColor || '#43b6d6',
                      ['--wall-box' as string]: wizardFields.offerBoxBackground || '#f7f8f9',
                      ['--wall-text' as string]: wizardFields.offerBoxText || '#58666e',
                    }}
                  >
                    <h3>{wizardFields.offerwallTitle || 'Complete offers and earn rewards'}</h3>
                    <p>
                      {wizardToggles.hideCurrency
                        ? 'Balance: 0'
                        : `${wizardFields.currencyName || 'Points'} balance: 0`}
                      {' · '}
                      {wizardFields.exchangeRate || '100'} / $1
                    </p>
                    {wizardPreviewOffers.length ? wizardPreviewOffers.map((offer) => {
                      const rate = Number(wizardFields.exchangeRate || 100) || 100
                      const reward = wizardToggles.roundCurrency
                        ? Math.round(offer.payout * rate)
                        : Number((offer.payout * rate).toFixed(2))
                      return (
                        <div key={offer.id} className={styles.offerwallPreviewOffer}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={offer.imageSource || `/affmine/preview_i/${offer.id}.png`} alt="" width={36} height={36} />
                          <span>
                            <strong>{offer.name}</strong>
                            <small>
                              +{reward}{wizardToggles.hideCurrency ? '' : ` ${wizardFields.currencyName || 'Points'}`}
                            </small>
                          </span>
                          <button
                            type="button"
                            onClick={() => window.open(offer.offerLink, '_blank', 'noopener,noreferrer')}
                          >
                            View
                          </button>
                        </div>
                      )
                    }) : (
                      <div className={styles.lockerPreviewEmpty}>Activate incentive offers to fill this wall.</div>
                    )}
                  </div>
                )}
              </aside>
            </div>
          </section>
        ) : pathname === '/tools/postback' ? (
          <>
            <section className={`${styles.panel} ${styles.dataPage}`}>
              <h2 className={styles.sectionTitle}>EDIT POSTBACK</h2>
              <div className={styles.dataForm}>
                <label className={styles.dataField}>Postback status
                  <span className={styles.postbackToggle}>
                    <input type="checkbox" checked={postbackEnabled} onChange={(event) => setPostbackEnabled(event.target.checked)} />
                    <span>{postbackEnabled ? 'On' : 'Off'}</span>
                  </span>
                </label>
                <label className={styles.dataField}>Global S2S Postback URL
                  <input
                    type="url"
                    value={postbackUrl}
                    onChange={(event) => setPostbackUrl(event.target.value)}
                    placeholder="http://example.com/postback.php?offerID=#cmpid#&subID=#s1#&payout=#payout#"
                  />
                </label>
                <button type="button" className={styles.pagePrimaryButton} onClick={() => setPageNotice('Postback settings cannot be saved until the account service is connected.')}>
                  <i className="fa fa-save" aria-hidden="true" />Save
                </button>
                {pageNotice && <p className={styles.pageNotice} role="status">{pageNotice}</p>}
              </div>
            </section>
            <section className={`${styles.panel} ${styles.dataPage}`}>
              <h2 className={styles.sectionTitle}>POSTBACK TOKENS</h2>
              <div className={styles.postbackTokens}>
                <div className={styles.dataTableWrap}>
                  <table className={styles.dataTable}>
                    <thead><tr><th>Token</th><th>Description</th></tr></thead>
                    <tbody>{[['#cmpid#', 'Campaign ID'], ['#cmpname#', 'Campaign name'], ['#payout#', 'Payout (in USD)'], ['#datetime#', 'Conversion date & time (Unix timestamp format)'], ['#ip#', 'Conversion IP'], ['#country#', 'Conversion country']].map(([token, description]) => <tr key={token}><td>{token}</td><td>{description}</td></tr>)}</tbody>
                  </table>
                </div>
                <div className={styles.dataTableWrap}>
                  <table className={styles.dataTable}>
                    <thead><tr><th>Token</th><th>Description</th></tr></thead>
                    <tbody>{[['#s1#', 'SubID 1'], ['#s2#', 'SubID 2'], ['#s3#', 'SubID 3'], ['#s4#', 'SubID 4'], ['#amount#', 'Virtual currency amount Offerwall only']].map(([token, description]) => <tr key={token}><td>{token}</td><td>{description}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        ) : pathname === '/tools/api' ? (
          <>
            <section className={`${styles.panel} ${styles.dataPage} ${styles.apiCredentialPanel}`}>
              <h2 className={styles.sectionTitle}><CircleHelp size={15} />API CREDENTIALS</h2>
              <div className={styles.credentialList}>
                {['Affiliate ID', 'API Key'].map((label) => (
                  <div key={label}>
                    <label htmlFor={`api-${label.toLowerCase().replace(/\s/g, '-')}`}>{label}</label>
                    <div className={styles.credentialValue}>
                      <input id={`api-${label.toLowerCase().replace(/\s/g, '-')}`} value="" readOnly />
                      <button type="button" onClick={() => setPageNotice('Nothing to copy yet.')}>Copy</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className={`${styles.panel} ${styles.dataPage} ${styles.apiDocumentation}`}>
              <h2 className={styles.sectionTitle}><FileChartColumn size={15} />DOCUMENTATION &amp; EXAMPLES</h2>
              <p>Our API is easy to integrate in any platform and using any programming language by using GET requests and receiving XML/JSON responses. Please check our documentation and if you cannot integrate, please contact us and our technical team will do their best to accomplish what you need.</p>
              <a className={styles.pagePrimaryButton} href="https://network.affmine.com/data/Publisher%20API%20Documentation.pdf" target="_blank" rel="noreferrer">View API Documentation</a>
              {pageNotice && <p className={styles.pageNotice} role="status">{pageNotice}</p>}
            </section>
          </>
        ) : pathname === '/account/settings' ? (
          <>
            <section className={`${styles.panel} ${styles.dataPage} ${styles.accountMetaPanel}`}>
              <div className={styles.accountMeta}>
                <div>
                  <strong>Publisher ID</strong>
                  <span>{accountProfile.publisherNumber != null ? `#${accountProfile.publisherNumber}` : '—'}</span>
                </div>
                <div>
                  <strong>Publisher since</strong>
                  <span>
                    {accountProfile.createdAt
                      ? new Date(accountProfile.createdAt).toLocaleDateString('en-GB')
                      : '—'}
                  </span>
                </div>
                <div>
                  <strong>Last login</strong>
                  <span>
                    {accountProfile.lastLogin
                      ? new Date(accountProfile.lastLogin).toLocaleString('en-GB')
                      : 'Never'}
                  </span>
                </div>
              </div>
            </section>
            <section className={`${styles.panel} ${styles.dataPage} ${styles.accountDetailsPanel}`}>
              <h2 className={styles.accountSectionTitle}><CircleUserRound size={15} />ACCOUNT DETAILS</h2>
              <div className={styles.accountColumns}>
                <div className={styles.accountColumn}>
                  <label className={styles.dataField}>First name
                    <input
                      className={styles.accountPermanentField}
                      value={accountDetails.firstName}
                      autoComplete="given-name"
                      readOnly
                      aria-readonly="true"
                      title="First name cannot be changed"
                    />
                  </label>
                  <label className={styles.dataField}>Last name
                    <input
                      className={styles.accountPermanentField}
                      value={accountDetails.lastName}
                      autoComplete="family-name"
                      readOnly
                      aria-readonly="true"
                      title="Last name cannot be changed"
                    />
                  </label>
                  <label className={styles.dataField}>E-mail
                    <input
                      className={styles.accountPermanentField}
                      type="email"
                      value={accountDetails.email}
                      autoComplete="email"
                      readOnly
                      aria-readonly="true"
                      title="E-mail cannot be changed"
                    />
                  </label>
                  <div className={styles.settingsFields}>
                    <label className={styles.dataField}>Address
                      <input value={accountDetails.address} onChange={(event) => setAccountDetails((current) => ({ ...current, address: event.target.value }))} autoComplete="street-address" />
                    </label>
                    <label className={styles.dataField}>City
                      <input value={accountDetails.city} onChange={(event) => setAccountDetails((current) => ({ ...current, city: event.target.value }))} autoComplete="address-level2" />
                    </label>
                    <label className={styles.dataField}>State
                      <input value={accountDetails.state} onChange={(event) => setAccountDetails((current) => ({ ...current, state: event.target.value }))} autoComplete="address-level1" />
                    </label>
                    <label className={styles.dataField}>ZIP Code
                      <input value={accountDetails.zipCode} onChange={(event) => setAccountDetails((current) => ({ ...current, zipCode: event.target.value }))} autoComplete="postal-code" />
                    </label>
                    <label className={styles.dataField}>Country
                      <input value={accountDetails.country} onChange={(event) => setAccountDetails((current) => ({ ...current, country: event.target.value }))} autoComplete="country-name" />
                    </label>
                  </div>
                </div>
                <div className={styles.accountColumn}>
                  <label className={styles.dataField}>Company Name
                    <input value={accountDetails.companyName} onChange={(event) => setAccountDetails((current) => ({ ...current, companyName: event.target.value }))} autoComplete="organization" />
                  </label>
                  <div className={styles.settingsFields}>
                    <label className={styles.dataField}>Company Address
                      <input value={accountDetails.companyAddress} onChange={(event) => setAccountDetails((current) => ({ ...current, companyAddress: event.target.value }))} />
                    </label>
                    <label className={styles.dataField}>Company City
                      <input value={accountDetails.companyCity} onChange={(event) => setAccountDetails((current) => ({ ...current, companyCity: event.target.value }))} />
                    </label>
                    <label className={styles.dataField}>Company State
                      <input value={accountDetails.companyState} onChange={(event) => setAccountDetails((current) => ({ ...current, companyState: event.target.value }))} />
                    </label>
                    <label className={styles.dataField}>Company ZIP Code
                      <input value={accountDetails.companyZipCode} onChange={(event) => setAccountDetails((current) => ({ ...current, companyZipCode: event.target.value }))} />
                    </label>
                    <label className={styles.dataField}>Company Country
                      <input value={accountDetails.companyCountry} onChange={(event) => setAccountDetails((current) => ({ ...current, companyCountry: event.target.value }))} />
                    </label>
                  </div>
                </div>
              </div>
              <section className={styles.accountSettingsSection}>
                <h2 className={styles.accountSectionTitle}><Settings size={15} />SETTINGS</h2>
                <div className={styles.settingsOptions}>
                  <label>
                    <input
                      type="checkbox"
                      checked={accountDetails.leadNotifications}
                      onChange={(event) => setAccountDetails((current) => ({ ...current, leadNotifications: event.target.checked }))}
                    />
                    Enable lead notifications
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={accountDetails.campaignEmailUpdates}
                      onChange={(event) => setAccountDetails((current) => ({ ...current, campaignEmailUpdates: event.target.checked }))}
                    />
                    Receive campaign e-mail updates (new added, removed, payout changes etc.)
                  </label>
                </div>
                <button type="button" className={styles.pagePrimaryButton} disabled={accountSaving} onClick={() => void saveAccountDetails()}>
                  {accountSaving ? 'Saving…' : 'Save'}
                </button>
              </section>
              {pageNotice && <p className={styles.pageNotice} role="status">{pageNotice}</p>}
            </section>
            <section className={`${styles.panel} ${styles.dataPage} ${styles.passwordPanel}`}>
              <h2 className={styles.accountSectionTitle}><Lock size={15} />CHANGE PASSWORD</h2>
              <div className={styles.settingsFields}>
                <label className={styles.dataField}>Current Password
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  />
                </label>
                <label className={styles.dataField}>New Password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                  />
                </label>
                <label className={styles.dataField}>Repeat Password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={passwordForm.repeatPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, repeatPassword: event.target.value }))}
                  />
                </label>
              </div>
              <button type="button" className={styles.pagePrimaryButton} disabled={passwordSaving} onClick={() => void changeAccountPassword()}>
                {passwordSaving ? 'Changing…' : 'Change'}
              </button>
              {passwordNotice && <p className={styles.pageNotice} role="status">{passwordNotice}</p>}
            </section>
          </>
        ) : isSupportPage ? (
          <section className={`${styles.panel} ${styles.dataPage} ${styles.supportBridge}`}>
            <div className={styles.dataPageHeading}>
              <h2><MessageCircle size={15} />SUPPORT</h2>
            </div>
            <p className={styles.pageHint}>
              {userRole === 'MANAGER'
                ? 'Reply to publisher support threads from this inbox.'
                : 'Message your affiliate manager directly. Replies appear in this conversation.'}
            </p>
            {pageNotice && <p className={styles.pageNotice} role="status">{pageNotice}</p>}
            <div className={`${styles.supportLayout} ${userRole === 'MANAGER' ? styles.supportLayoutManager : ''}`}>
              {userRole === 'MANAGER' && (
                <aside className={styles.supportInbox} aria-label="Publisher conversations">
                  {supportLoading && !supportConversations.length ? <p className={styles.pageHint}>Loading conversations…</p> : null}
                  {!supportLoading && !supportConversations.length ? <p className={styles.pageHint}>No publisher messages yet.</p> : null}
                  {supportConversations.map((conversation) => {
                    const latest = conversation.messages[conversation.messages.length - 1]
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        className={`${styles.supportInboxItem} ${selectedSupportId === conversation.id ? styles.supportInboxItemActive : ''}`}
                        onClick={() => setSelectedSupportId(conversation.id)}
                      >
                        <strong>{conversation.publisher?.fullName || conversation.publisher?.username || 'Publisher'}</strong>
                        <span>{conversation.publisher?.email || conversation.publisher?.username}</span>
                        <span className={styles.supportInboxPreview}>{latest?.body || 'No messages yet'}</span>
                      </button>
                    )
                  })}
                </aside>
              )}
              <div className={styles.supportThreadPanel}>
                <div className={styles.supportThreadMeta}>
                  {userRole === 'MANAGER' ? (
                    <strong>
                      {supportConversation?.publisher?.fullName || supportConversation?.publisher?.username || 'Select a publisher'}
                    </strong>
                  ) : (
                    <strong>
                      {supportConversation?.manager?.fullName || supportConversation?.manager?.username || 'Affiliate Manager'}
                    </strong>
                  )}
                  <span>{supportConversation?.status === 'OPEN' ? 'Open' : supportConversation ? supportConversation.status : 'New conversation'}</span>
                </div>
                <div className={styles.supportThread} ref={supportThreadRef}>
                  {supportLoading ? <p className={styles.pageHint}>Loading messages…</p> : null}
                  {!supportLoading && !(supportConversation?.messages.length) ? (
                    <p className={styles.pageHint}>
                      {userRole === 'MANAGER' ? 'Select a conversation or wait for a publisher message.' : 'Send a message to start a conversation with your manager.'}
                    </p>
                  ) : null}
                  {supportConversation?.messages.map((message) => {
                    const isMine = userId ? message.senderId === userId : (userRole === 'MANAGER' ? message.sender.role === 'MANAGER' : message.sender.role === 'PUBLISHER')
                    return (
                      <div key={message.id} className={`${styles.supportBubble} ${isMine ? styles.supportBubbleMine : styles.supportBubbleTheirs}`}>
                        <div className={styles.supportBubbleHead}>
                          <strong>{message.sender.fullName || message.sender.username}</strong>
                          <span>{new Date(message.createdAt).toLocaleString()}</span>
                        </div>
                        <p>{message.body}</p>
                      </div>
                    )
                  })}
                </div>
                <form
                  className={styles.supportComposer}
                  onSubmit={(event) => {
                    event.preventDefault()
                    void sendSupportMessage()
                  }}
                >
                  <label className={styles.dataField} htmlFor="support-message">
                    Message
                    <textarea
                      id="support-message"
                      value={supportDraft}
                      onChange={(event) => setSupportDraft(event.target.value)}
                      placeholder={userRole === 'MANAGER' ? 'Reply to publisher…' : 'Ask your affiliate manager…'}
                      rows={3}
                      disabled={userRole === 'MANAGER' && !selectedSupportId && !supportConversation}
                    />
                  </label>
                  <button
                    type="submit"
                    className={styles.pagePrimaryButton}
                    disabled={supportSending || !supportDraft.trim() || (userRole === 'MANAGER' && !selectedSupportId && !supportConversation)}
                  >
                    {supportSending ? 'Sending…' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          </section>
        ) : pathname === '/account/referral' ? (
          <>
            <section className={`${styles.panel} ${styles.dataPage}`}>
              <h2 className={styles.sectionTitle}>REFERRAL TERMS</h2>
              <div className={styles.referralSummary}>
                <div><span>Active referrals</span><strong>0</strong></div>
                <div><span>Referral commission</span><strong>5%</strong></div>
              </div>
              <div className={styles.referralLink}>
                <label className={styles.dataField}>Referral link<input value="https://www.affmine.com/r/63460" readOnly /></label>
                <button
                  type="button"
                  className={styles.pagePrimaryButton}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText('https://www.affmine.com/r/63460')
                      setPageNotice('Referral link copied.')
                    } catch {
                      setPageNotice('Unable to copy referral link.')
                    }
                  }}
                >
                  Copy
                </button>
              </div>
              {pageNotice && <p className={styles.pageNotice} role="status">{pageNotice}</p>}
            </section>
            <section className={`${styles.panel} ${styles.dataPage}`}>
              <h2 className={styles.sectionTitle}>REFERRAL COMMISSIONS</h2>
              <div className={styles.dataTableWrap}>
                <table className={styles.dataTable}>
                  <thead><tr><th>Referral</th><th>Commissions</th></tr></thead>
                  <tbody><tr><td colSpan={2}>No data available</td></tr></tbody>
                </table>
              </div>
            </section>
          </>
        ) : pathname === '/terms' || pathname === '/privacy' ? (
          <section className={`${styles.panel} ${styles.dataPage}`}>
            <h2 className={styles.sectionTitle}>{pathname === '/terms' ? 'TERMS & CONDITIONS' : 'PRIVACY POLICY'}</h2>
            <p className={styles.pageHint}>For assistance with account terms or privacy questions, please contact support.</p>
            <button type="button" className={styles.pageInlineLink} onClick={openSupportMessenger}>Contact support</button>
          </section>
        ) : !isDashboard ? (
          <section className={`${styles.panel} ${styles.dataPage}`}>
            <div className={styles.dataPageHeading}><h2>{pageTitle}</h2></div>
            <div className={styles.dataPageEmpty}>No data available</div>
          </section>
        ) : null}

        {isDashboard && <div className={styles.dashboardGrid}>
          <section className={`${styles.panel} ${styles.performancePanel}`}>
            <h2><span className={styles.titleIcon}>ϟ</span> TODAY PERFORMANCE</h2>
            <div className={styles.chartWrap}>
              <div className={styles.yLabels}>{['1.0', '0.9', '0.8', '0.7', '0.6', '0.5', '0.4', '0.3', '0.2', '0.1', '0'].map((label) => <span key={label}>{label}</span>)}</div>
              <div className={styles.chart}>
                <div className={styles.chartGrid} />
                <svg viewBox="0 0 480 224" preserveAspectRatio="none" role="img" aria-label="Today hourly clicks, conversions, and revenue chart">
                  <polyline points={chartPoints} fill="none" stroke="#3d464d" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                  <polyline points={chartClicks.map((_, index) => `${36 + index * 19.2},${210}`).join(' ')} fill="none" stroke="#3498db" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  <polyline points={chartClicks.map((_, index) => `${36 + index * 19.2},${210}`).join(' ')} fill="none" stroke="#60ed32" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  {chartClicks.map((value, index) => <circle key={index} cx={36 + index * 19.2} cy={210 - value * 210} r="3" fill="#3d464d" />)}
                  {chartClicks.map((_, index) => <circle key={`blue-${index}`} cx={36 + index * 19.2} cy="210" r="2.5" fill="#3498db" />)}
                </svg>
                <div className={styles.xLabels}>{Array.from({ length: 24 }, (_, index) => <span key={index}>{index}</span>)}</div>
              </div>
            </div>
            <div className={styles.legend}><span><i className={styles.legendClicks} />Clicks</span><span><i className={styles.legendConversions} />Conversions</span><span><i className={styles.legendRevenue} />Revenue</span></div>
          </section>

          <div className={styles.rightColumn}>
            <section className={`${styles.panel} ${styles.statsPanel}`} aria-label="Today's statistics">
              <div><p><CircleDollarSign size={15} />Revenue</p><strong>$0</strong></div>
              <div><p><ShoppingCart size={15} />Conversions</p><strong>0</strong></div>
              <div><p><MousePointer2 size={15} />Clicks</p><strong>0</strong></div>
              <div><p><BriefcaseBusiness size={15} />Avg. EPC</p><strong>$0</strong></div>
              <div><p><BarChart3 size={15} />Conv. Rate</p><strong className={styles.successValue}>0<small>%</small></strong></div>
              <div><p><CalendarDays size={15} />This Month</p><strong>$0.00</strong></div>
            </section>

            <section className={`${styles.panel} ${styles.featuredPanel}`}>
              <h2><span className={styles.titleIcon}>★</span> FEATURED CAMPAIGNS</h2>
              {featured ? (
                <div className={styles.featuredItem}>
                  <button type="button" className={styles.featuredControlPrevious} aria-label="Previous featured campaign" disabled={featuredCampaigns.length < 2} onClick={() => moveCampaign(-1)}>‹</button>
                  <div className={styles.featuredViewport}>
                    {previousFeatured && renderFeaturedSlide(previousFeatured, `previous-${previousFeatured.id}`, exitingFeaturedClass, true)}
                    {renderFeaturedSlide(featured, `current-${featured.id}`, previousFeatured ? enteringFeaturedClass : '')}
                  </div>
                  <button type="button" className={styles.featuredControlNext} aria-label="Next featured campaign" disabled={featuredCampaigns.length < 2} onClick={() => moveCampaign(1)}>›</button>
                </div>
              ) : (
                <div className={styles.featuredEmpty}><Flame size={18} aria-hidden="true" /><span>No active HOT offers</span><Link href="/campaigns/browse">Browse campaigns</Link></div>
              )}
            </section>
          </div>

          <section className={`${styles.panel} ${styles.tablePanel} ${styles.campaignUpdatesPanel}`}>
            <h2><span className={styles.titleIcon}>▤</span> CAMPAIGN UPDATES</h2>
            <div className={styles.tableScroll}>
              <table>
                <tbody>
                  {campaignUpdates.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>
                        <span className={styles.added}>✚</span> Added:{' '}
                        <strong>
                          #{campaign.id}{' '}
                          <Link href={`/campaigns/${campaign.id}`}>{campaign.name}</Link>
                        </strong>{' '}
                        <CampaignUpdateFlag geo={campaign.geo} id={campaign.id} />
                        {campaign.placement === 'INCENTIVE' ? <span className={styles.campaignUpdateTag}>Incent</span> : null}
                        {campaign.isHot ? <span className={styles.campaignUpdateHot}>HOT</span> : null}
                      </td>
                      <td>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(campaign.createdAt))}</td>
                    </tr>
                  ))}
                  {!campaignUpdates.length && <tr><td className={styles.campaignUpdateEmpty} colSpan={2}>No campaign updates yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.tablePanel}`}>
            <h2><ShoppingCart size={15} /> CONVERSIONS</h2>
            <div className={styles.emptyConversions}>No data to display</div>
            <div className={styles.tableScroll}>
              <table><tbody /></table>
            </div>
          </section>
        </div>}
      </main>
      {supportMessengerOpen && (
        <div className={styles.supportMessenger} role="dialog" aria-label="Support messenger" aria-modal="false">
          {supportMessengerTab === 'home' ? (
            <div className={styles.supportMessengerHome}>
              <div className={styles.supportMessengerHomeTop}>
                <div className={styles.supportMessengerHomeBar}>
                  <span className={styles.supportMessengerLogo} aria-hidden="true">a</span>
                  <button type="button" className={styles.supportMessengerClose} aria-label="Close support" onClick={closeSupportMessenger}>
                    <X size={18} strokeWidth={2.25} />
                  </button>
                </div>
                <div className={styles.supportMessengerGreeting}>
                  <p>Hi {supportFirstName} <span aria-hidden="true">👋</span></p>
                  <h2>How can we help?</h2>
                </div>
                <button type="button" className={styles.supportMessengerActionCard} onClick={openSupportCompose}>
                  <span>
                    <strong>Send us a message</strong>
                    <span>We typically reply in a few minutes</span>
                  </span>
                  <span className={styles.supportMessengerActionIcon} aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M3.4 11.2 20.2 3.7c.7-.3 1.4.4 1.1 1.1L13.8 21.6c-.3.8-1.4.7-1.6-.1l-1.8-7.1-7.1-1.8c-.8-.2-.9-1.3-.1-1.6Z" fill="currentColor" />
                      <path d="m10.9 13.1 9.4-9.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
              </div>
              <div className={styles.supportMessengerHomeBody} />
            </div>
          ) : (
            <div className={styles.supportMessengerMessages}>
              <header className={styles.supportMessengerMessagesHeader}>
                <div>
                  <strong>Messages</strong>
                  <span>
                    {userRole === 'MANAGER'
                      ? (supportConversation?.publisher?.fullName || supportConversation?.publisher?.username || 'Publisher inbox')
                      : (supportConversation?.manager?.fullName || 'John')}
                  </span>
                </div>
                <button type="button" className={styles.supportMessengerCloseDark} aria-label="Close support" onClick={closeSupportMessenger}>
                  <X size={18} strokeWidth={2.25} />
                </button>
              </header>

              {userRole === 'MANAGER' && (
                <div className={styles.supportMessengerInbox} aria-label="Publisher conversations">
                  {!supportLoading && !supportConversations.length ? (
                    <p className={styles.supportMessengerEmpty}>No publisher messages yet.</p>
                  ) : null}
                  {supportConversations.map((conversation) => {
                    const latest = conversation.messages[conversation.messages.length - 1]
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        className={`${styles.supportMessengerInboxItem} ${selectedSupportId === conversation.id ? styles.supportMessengerInboxItemActive : ''}`}
                        onClick={() => setSelectedSupportId(conversation.id)}
                      >
                        <strong>{conversation.publisher?.fullName || conversation.publisher?.username || 'Publisher'}</strong>
                        <span>{latest?.body || 'No messages yet'}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              <div className={styles.supportMessengerThread} ref={supportPopupThreadRef}>
                {supportLoading && !(supportConversation?.messages.length) ? (
                  <p className={styles.supportMessengerEmpty}>Loading messages…</p>
                ) : null}
                {!supportLoading && !(supportConversation?.messages.length) ? (
                  <div className={styles.supportMessengerWelcome}>
                    <p>Send us a message</p>
                    <p>We typically reply in a few minutes.</p>
                  </div>
                ) : null}
                {supportConversation?.messages.map((message) => {
                  const isMine = userId
                    ? message.senderId === userId
                    : (userRole === 'MANAGER' ? message.sender.role === 'MANAGER' : message.sender.role === 'PUBLISHER')
                  return (
                    <div
                      key={message.id}
                      className={`${styles.supportMessengerBubble} ${isMine ? styles.supportMessengerBubbleMine : styles.supportMessengerBubbleTheirs}`}
                    >
                      <p>{message.body}</p>
                      <span>{new Date(message.createdAt).toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>

              <form
                className={styles.supportMessengerComposer}
                onSubmit={(event) => {
                  event.preventDefault()
                  void sendSupportMessage()
                }}
              >
                <textarea
                  ref={supportComposerRef}
                  value={supportDraft}
                  onChange={(event) => setSupportDraft(event.target.value)}
                  placeholder="Message…"
                  rows={1}
                  disabled={userRole === 'MANAGER' && !selectedSupportId && !supportConversation}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void sendSupportMessage()
                    }
                  }}
                />
                <button
                  type="submit"
                  className={styles.supportMessengerSend}
                  aria-label="Send message"
                  disabled={supportSending || !supportDraft.trim() || (userRole === 'MANAGER' && !selectedSupportId && !supportConversation)}
                >
                  <SendHorizontal size={18} strokeWidth={2.4} />
                </button>
              </form>
            </div>
          )}

          <nav className={styles.supportMessengerTabs} aria-label="Messenger spaces">
            <button
              type="button"
              className={`${styles.supportMessengerTab} ${supportMessengerTab === 'home' ? styles.supportMessengerTabActive : ''}`}
              onClick={() => setSupportMessengerTab('home')}
            >
              {/* Affmine/Intercom Home = rounded square with smile */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="5" stroke="currentColor" strokeWidth="1.85" />
                <path d="M8.2 13.1c1.05 1.35 2.35 2.05 3.8 2.05s2.75-.7 3.8-2.05" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
              </svg>
              <span>Home</span>
            </button>
            <button
              type="button"
              className={`${styles.supportMessengerTab} ${supportMessengerTab === 'messages' ? styles.supportMessengerTabActive : ''}`}
              onClick={() => setSupportMessengerTab('messages')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 6.6A1.85 1.85 0 0 1 6.85 4.75h10.3A1.85 1.85 0 0 1 19 6.6v7.05a1.85 1.85 0 0 1-1.85 1.85H10.2L6.2 18.7c-.5.35-1.2-.02-1.2-.62V6.6Z" stroke="currentColor" strokeWidth="1.85" strokeLinejoin="round" />
              </svg>
              <span>Messages</span>
            </button>
          </nav>
        </div>
      )}

      <button
        id="dashboard-support-chat"
        type="button"
        className={`${styles.chatButton} launch_help`}
        aria-label={supportMessengerOpen ? 'Close support' : 'Contact support'}
        aria-expanded={supportMessengerOpen}
        onClick={() => {
          if (supportMessengerOpen) closeSupportMessenger()
          else openSupportMessenger()
        }}
      >
        {supportMessengerOpen ? <X size={22} /> : <MessageCircle size={23} />}
      </button>

      {applyCampaignId && (() => {
        const applyCampaign = allCampaignOffers.find((campaign) => campaign.id === applyCampaignId)
        if (!applyCampaign) return null
        const applyIsIncentive = isIncentiveCampaign(applyCampaign)
        const applyTypes = applyCampaign.offerTypes?.length ? applyCampaign.offerTypes : (applyIsIncentive ? ['CPI'] : ['CPL', 'SOI'])
        return (
          <div
            className={styles.campaignDialogBackdrop}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setApplyCampaignId(null)
                setApplyTermsAccepted(false)
                setApplyTermsError(false)
              }
            }}
          >
            <section className={`${styles.campaignDialog} ${styles.applyDialog}`} role="dialog" aria-modal="true" aria-labelledby="apply-dialog-title">
              <header className={styles.campaignDialogHeader}>
                <h2 id="apply-dialog-title">
                  <i className="fa fa-tags" aria-hidden="true" /> <span>#{applyCampaign.id}</span> {applyCampaign.name}
                </h2>
                <button
                  type="button"
                  className={styles.campaignDialogClose}
                  aria-label="Close dialog"
                  onClick={() => {
                    setApplyCampaignId(null)
                    setApplyTermsAccepted(false)
                    setApplyTermsError(false)
                  }}
                >
                  <X size={18} />
                </button>
              </header>
              <div className={styles.campaignDialogBody}>
                <div className={styles.applyDialogLayout}>
                  <Image
                    className={styles.applyDialogPreview}
                    src={applyCampaign.imageSource ?? `/affmine/campaigns/${applyCampaign.id}.png`}
                    alt=""
                    width={280}
                    height={175}
                    unoptimized={Boolean(applyCampaign.imageSource)}
                  />
                  <dl className={styles.applyDialogMeta}>
                    <div><dt>Description</dt><dd>{applyCampaign.description || `Promote ${applyCampaign.name}`}</dd></div>
                    <div><dt>Vertical</dt><dd>{applyCampaign.category ?? (applyIsIncentive ? 'App Install' : 'E-mail Submit')}</dd></div>
                    <div><dt>Platform</dt><dd>{formatCampaignDevices(getCampaignDevices(applyCampaign))}</dd></div>
                    <div><dt>Allow Incentive</dt><dd>{applyIsIncentive ? <span className={styles.applyYes}>Yes — tools only</span> : <span className={styles.applyNo}>No</span>}</dd></div>
                    <div><dt>Direct link</dt><dd>{applyIsIncentive ? <span className={styles.applyNo}>Not available</span> : <span className={styles.applyYes}>After approval</span>}</dd></div>
                    <div><dt>Country</dt><dd>{applyCampaign.country}</dd></div>
                    <div><dt>Payout</dt><dd>${applyCampaign.payout.toFixed(2)} {applyTypes.join(' ')}</dd></div>
                    <div><dt>Converts on</dt><dd>{applyCampaign.category ?? (applyIsIncentive ? 'App Install' : 'E-mail Submit')}</dd></div>
                  </dl>
                </div>
                <label className={`${styles.applyTerms} ${applyTermsError ? styles.applyTermsError : ''}`}>
                  <input
                    type="checkbox"
                    checked={applyTermsAccepted}
                    onChange={(event) => {
                      setApplyTermsAccepted(event.target.checked)
                      if (event.target.checked) setApplyTermsError(false)
                    }}
                  />
                  <span>I accept the Terms and Conditions and agree to the campaign restrictions.</span>
                </label>
                <button
                  type="button"
                  className={styles.pagePrimaryButton}
                  disabled={applySubmitting}
                  onClick={async () => {
                    if (!applyTermsAccepted) {
                      setApplyTermsError(true)
                      return
                    }
                    setApplySubmitting(true)
                    try {
                      const response = await fetch('/api/offer-applications', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          campaignId: applyCampaign.id,
                          campaignName: applyCampaign.name,
                          campaignPayout: applyCampaign.payout,
                          campaignCountry: applyCampaign.country,
                          campaignCategory: applyCampaign.category ?? 'E-mail Submit',
                          campaignImage: applyCampaign.imageSource ?? `/affmine/campaigns/${applyCampaign.id}.png`,
                        }),
                      })
                      const data = await response.json() as { application?: OfferApplicationRecord; error?: string }
                      if (!response.ok || !data.application) {
                        throw new Error(data.error || 'Unable to submit application')
                      }
                      setOfferApplications((current) => {
                        const without = current.filter((item) => item.id !== data.application!.id && !(item.campaignId === data.application!.campaignId && item.publisherId === data.application!.publisherId))
                        return [data.application!, ...without]
                      })
                      setApplyCampaignId(null)
                      setApplyTermsAccepted(false)
                      setApplyTermsError(false)
                      setPageNotice(
                        applyIsIncentive
                          ? `Application submitted for #${applyCampaign.id}. After approval, activate it for Content Locker / OfferWall — no direct offer link.`
                          : `Application submitted for #${applyCampaign.id}. ${PENDING_OFFER_HINT}.`,
                      )
                    } catch (submitError) {
                      setPageNotice(submitError instanceof Error ? submitError.message : 'Unable to submit application')
                    } finally {
                      setApplySubmitting(false)
                    }
                  }}
                >
                  {applySubmitting ? 'Submitting…' : 'Apply for campaign'}
                </button>
              </div>
            </section>
          </div>
        )
      })()}
    </div>
  )
}
