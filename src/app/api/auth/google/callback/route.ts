import { NextResponse } from 'next/server'
import { generateToken, JWT_EXPIRY } from '@/lib/auth'
import {
  exchangeGoogleCode,
  findGoogleUserByEmail,
  getGoogleOAuthRedirectUri,
  getGoogleUserInfo,
} from '@/lib/auth/google'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (searchParams.has('error')) {
    return NextResponse.redirect(new URL('/login?error=google_auth_failed', request.url))
  }
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url))
  }

  try {
    const redirectUri = getGoogleOAuthRedirectUri(request.url)
    if (!redirectUri) throw new Error('Google OAuth redirect URI is not configured')

    const tokenResponse = await exchangeGoogleCode(code, redirectUri)
    if (!tokenResponse.access_token) throw new Error('Google did not return an access token')

    const googleUser = await getGoogleUserInfo(tokenResponse.access_token)
    if (googleUser.email_verified !== true) {
      return NextResponse.redirect(new URL('/login?error=google_email_unverified', request.url))
    }

    const user = await findGoogleUserByEmail(googleUser.email || '')
    if (!user) {
      return NextResponse.redirect(new URL('/login?error=google_account_not_found', request.url))
    }
    if (user.status !== 'ACTIVE') {
      return NextResponse.redirect(new URL('/login?approval_pending=1', request.url))
    }

    const response = NextResponse.redirect(new URL('/login?success=google-authenticated', request.url))
    response.cookies.set('auth-token', generateToken(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: JWT_EXPIRY,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Google sign-in failed:', error)
    return NextResponse.redirect(new URL('/login?error=google_auth_failed', request.url))
  }
}
