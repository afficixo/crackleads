import { NextResponse } from 'next/server'
import { getCorsHeaders } from '@/config/cors'
import { getTokenFromCookie, getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { ensurePublisherNumber } from '@/lib/db/user'

function splitFullName(fullName?: string | null) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function cleanText(value: unknown, max = 200) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, max)
  return trimmed || null
}

async function requireUser(request: Request) {
  const origin = request.headers.get('origin') || null
  const token = getTokenFromCookie(request.headers.get('cookie') || '')
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(origin) }) }
  }
  const user = await getUserFromToken(token)
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(origin) }) }
  }
  return { user, origin }
}

const profileSelect = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  firstName: true,
  lastName: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  country: true,
  companyName: true,
  companyAddress: true,
  companyCity: true,
  companyState: true,
  companyZipCode: true,
  companyCountry: true,
  leadNotifications: true,
  campaignEmailUpdates: true,
  publisherNumber: true,
  role: true,
  createdAt: true,
  lastLogin: true,
} as const

/** Split legacy "street, city, state, zip, country" blobs into Affmine fields. */
function expandPackedAddress(fields: {
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}) {
  if (fields.city || fields.state || fields.zipCode || fields.country) return fields
  const parts = fields.address.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length < 2) return fields

  const country = parts[parts.length - 1] || ''
  const maybeZip = parts[parts.length - 2] || ''
  const hasZip = /^\d{3,12}[a-zA-Z0-9\- ]*$/.test(maybeZip) && /\d/.test(maybeZip)
  const zipCode = hasZip ? maybeZip : ''
  const state = hasZip ? (parts[parts.length - 3] || '') : (parts[parts.length - 2] || '')
  const cityIndex = hasZip ? parts.length - 4 : parts.length - 3
  const city = cityIndex >= 0 ? (parts[cityIndex] || '') : ''
  const addressParts = parts.slice(0, Math.max(0, cityIndex))
  const address = addressParts.join(', ') || (cityIndex < 0 ? parts[0] : '')

  return {
    address: address || fields.address,
    city,
    state,
    zipCode,
    country,
  }
}

function serializeProfile(user: {
  id: string
  username: string
  email: string
  fullName: string | null
  firstName: string | null
  lastName: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  companyName: string | null
  companyAddress: string | null
  companyCity: string | null
  companyState: string | null
  companyZipCode: string | null
  companyCountry: string | null
  leadNotifications: boolean
  campaignEmailUpdates: boolean
  publisherNumber: number | null
  role: string
  createdAt: Date
  lastLogin: Date | null
}) {
  const split = splitFullName(user.fullName)
  const location = expandPackedAddress({
    address: user.address || '',
    city: user.city || '',
    state: user.state || '',
    zipCode: user.zipCode || '',
    country: user.country || '',
  })
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName || split.firstName,
    lastName: user.lastName || split.lastName,
    address: location.address,
    city: location.city,
    state: location.state,
    zipCode: location.zipCode,
    country: location.country,
    companyName: user.companyName || '',
    companyAddress: user.companyAddress || '',
    companyCity: user.companyCity || '',
    companyState: user.companyState || '',
    companyZipCode: user.companyZipCode || '',
    companyCountry: user.companyCountry || '',
    leadNotifications: user.leadNotifications,
    campaignEmailUpdates: user.campaignEmailUpdates,
    publisherNumber: user.publisherNumber,
    role: user.role,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  }
}

export async function GET(request: Request) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error

  const { user, origin } = auth
  try {
    if (user.role === 'PUBLISHER') {
      await ensurePublisherNumber(user.id)
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: profileSelect,
    })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: getCorsHeaders(origin) })
    }

    return NextResponse.json({ profile: serializeProfile(profile) }, { headers: getCorsHeaders(origin) })
  } catch (error) {
    console.error('Load account profile failed:', error)
    return NextResponse.json({ error: 'Unable to load profile' }, { status: 503, headers: getCorsHeaders(origin) })
  }
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error

  const { user, origin } = auth
  try {
    const body = await request.json()
    // First name, last name, and email are permanent identity fields — not editable here.
    const address = cleanText(body?.address, 300)
    const city = cleanText(body?.city, 100)
    const state = cleanText(body?.state, 100)
    const zipCode = cleanText(body?.zipCode, 40)
    const country = cleanText(body?.country, 100)
    const companyName = cleanText(body?.companyName, 150)
    const companyAddress = cleanText(body?.companyAddress, 300)
    const companyCity = cleanText(body?.companyCity, 100)
    const companyState = cleanText(body?.companyState, 100)
    const companyZipCode = cleanText(body?.companyZipCode, 40)
    const companyCountry = cleanText(body?.companyCountry, 100)
    const leadNotifications = typeof body?.leadNotifications === 'boolean' ? body.leadNotifications : undefined
    const campaignEmailUpdates = typeof body?.campaignEmailUpdates === 'boolean' ? body.campaignEmailUpdates : undefined

    const profile = await prisma.user.update({
      where: { id: user.id },
      data: {
        address,
        city,
        state,
        zipCode,
        country,
        companyName,
        companyAddress,
        companyCity,
        companyState,
        companyZipCode,
        companyCountry,
        ...(leadNotifications === undefined ? {} : { leadNotifications }),
        ...(campaignEmailUpdates === undefined ? {} : { campaignEmailUpdates }),
      },
      select: profileSelect,
    })

    return NextResponse.json({ profile: serializeProfile(profile) }, { headers: getCorsHeaders(origin) })
  } catch (error) {
    console.error('Update account profile failed:', error)
    return NextResponse.json({ error: 'Unable to save profile' }, { status: 503, headers: getCorsHeaders(origin) })
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) })
}
