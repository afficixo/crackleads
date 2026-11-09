import { NextResponse } from 'next/server'
import { buildGoogleAuthUrl, getGoogleOAuthConfig, getGoogleOAuthRedirectUri } from '@/lib/auth/google'

export async function GET(request: Request) {
  const state = Buffer.from(JSON.stringify({ redirect: '/dashboard' })).toString('base64url')
  const { clientId } = getGoogleOAuthConfig()
  const redirectUri = getGoogleOAuthRedirectUri(request.url)

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Google OAuth is not configured' }, { status: 500 })
  }

  const authUrl = buildGoogleAuthUrl(redirectUri, state)
  return NextResponse.redirect(authUrl)
}
