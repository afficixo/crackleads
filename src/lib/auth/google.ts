import { prisma } from '@/lib/db/prisma'
import { generateToken } from '@/lib/auth'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim()
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim()
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI?.trim()

export function buildGoogleUsername(email?: string | null, fallback = 'google-user'): string {
  if (!email) return fallback

  const normalized = email.trim().toLowerCase()
  const localPart = normalized.split('@')[0] ?? ''
  return localPart.replace(/[^a-z0-9._-]+/g, '').trim() || fallback
}

export function normalizeGoogleRedirectPath(redirect: string | null | undefined, fallback = '/dashboard'): string {
  if (typeof redirect !== 'string' || !redirect.trim()) return fallback

  const trimmed = redirect.trim()
  if (!trimmed.startsWith('/')) return fallback
  if (trimmed.startsWith('//')) return fallback

  return trimmed
}

export function getGoogleOAuthConfig() {
  return {
    clientId: GOOGLE_CLIENT_ID || '',
    clientSecret: GOOGLE_CLIENT_SECRET || '',
    redirectUri: GOOGLE_REDIRECT_URI || '',
  }
}

export function getGoogleOAuthRedirectUri(requestUrl?: string): string {
  if (requestUrl) {
    const requestOrigin = new URL(requestUrl)
    if (['localhost', '127.0.0.1', '[::1]'].includes(requestOrigin.hostname)) {
      return new URL('/api/auth/google/callback', requestOrigin).toString()
    }
  }

  return GOOGLE_REDIRECT_URI || ''
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID || '',
    client_secret: GOOGLE_CLIENT_SECRET || '',
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google token exchange failed: ${errorText}`)
  }

  return response.json() as Promise<{ access_token?: string }>
}

export async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google userinfo request failed: ${errorText}`)
  }

  return response.json() as Promise<{
    email?: string
    email_verified?: boolean
    name?: string
    picture?: string
  }>
}

export async function findGoogleUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return null

  return prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, username: true, email: true, role: true, status: true },
  })
}

export async function createGoogleAuthResponse(user: { id: string; username: string; role: string }) {
  const token = generateToken(user.id)
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  }
}
