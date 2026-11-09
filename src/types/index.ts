export type UserRole = 'MANAGER' | 'PUBLISHER'

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
  lastLogin: string | null
}

export interface LinkAccount {
  id: string
  accountName: string
  slug: string
  customDomainId: string | null
  customDomain: CustomDomain | null
  offerGroupName: string | null
  userId: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  totalClicks: number
  uniqueClicks: number
  botClicks: number
  publicDashboard: PublicDashboard | null
}

export interface CustomDomain {
  id: string
  domain: string
  userId: string
  verified: boolean
  verifiedAt: string | null
  sslEnabled: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface OfferVault {
  id: string
  country: string
  groupName: string | null
  offerUrl: string
  isActive: boolean
  isGlobal: boolean
  isContentLocker: boolean
  usaSecretRedirectEnabled: boolean
  usaSecretRedirectPercentage: number
  priority: number
  rotationMode: 'PRIORITY' | 'RANDOM'
  userId: string
  createdAt: string
  updatedAt: string
}

export interface PublicDashboard {
  id: string
  publicId: string
  linkAccountId: string
  isPrivate: boolean
  createdAt: string
  updatedAt: string
}

export interface Click {
  id: string
  linkAccountId: string
  timestamp: string
  ipAddress: string
  country: string | null
  region: string | null
  city: string | null
  isp: string | null
  browser: string | null
  browserVersion: string | null
  os: string | null
  deviceType: string | null
  deviceBrand: string | null
  screenResolution: string | null
  referrer: string | null
  language: string | null
  timeZone: string | null
  userAgent: string | null
  clickSignature: string | null
  isUnique: boolean
  isBot: boolean
  botScore: number | null
  botReason: string | null
  createdAt: string
}

export interface GeoStat {
  id: string
  linkAccountId: string
  country: string
  countryCode: string
  clicks: number
  uniqueClicks: number
  botClicks: number
  updatedAt: string
}

export interface DailyAnalytics {
  id: string
  linkAccountId: string
  date: string
  clicks: number
  uniqueClicks: number
  botClicks: number
}

export interface HourlyAnalytics {
  id: string
  linkAccountId: string
  hour: string
  clicks: number
  uniqueClicks: number
  botClicks: number
}

export interface BrowserStat {
  id: string
  linkAccountId: string
  browser: string
  clicks: number
  uniqueClicks: number
  botClicks: number
}

export interface OSStat {
  id: string
  linkAccountId: string
  os: string
  clicks: number
  uniqueClicks: number
  botClicks: number
}

export interface DeviceStat {
  id: string
  linkAccountId: string
  deviceType: string
  clicks: number
  uniqueClicks: number
  botClicks: number
}

export interface ReferrerStat {
  id: string
  linkAccountId: string
  referrer: string
  clicks: number
  uniqueClicks: number
  botClicks: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
  limit: number
}