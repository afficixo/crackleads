import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { MANAGER_USERNAME } from '@/lib/constants'
import { prisma } from '@/lib/db/prisma'
import type { UserRole } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || ''
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required for security')

export const JWT_EXPIRY = Number.parseInt(process.env.JWT_EXPIRY || String(60 * 60 * 24 * 30), 10)

export type AccountStatus = 'PENDING' | 'ACTIVE' | 'DISABLED' | 'REJECTED'

export type AuthUser = {
  id: string
  username: string
  role: UserRole
  email?: string | null
  fullName?: string | null
  status?: AccountStatus | null
  createdAt?: Date
  lastLogin?: Date | null
  googleProfilePicture?: string | null
  googleEmailVerified?: boolean
  googleEmailVerifiedAt?: Date | null
}

export function normalizeEffectiveUserRole(user: { role?: UserRole } | null | undefined): UserRole | undefined {
  return user?.role
}

export async function verifyCredentials(username: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: username, mode: 'insensitive' } },
        { email: { equals: username, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      username: true,
      password: true,
      role: true,
      status: true,
    },
  })

  if (!user || !(await bcrypt.compare(password, user.password))) return null

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  return user
}

export function generateToken(userId: string, expiresIn: number | undefined = JWT_EXPIRY): string {
  return jwt.sign({ userId, iat: Math.floor(Date.now() / 1000) }, JWT_SECRET, {
    expiresIn,
    algorithm: 'HS256',
  })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as { userId: string }
  } catch {
    return null
  }
}

export function getTokenFromCookie(cookieHeader: string): string | null {
  for (const cookie of cookieHeader.split(';')) {
    const separatorIndex = cookie.indexOf('=')
    if (separatorIndex === -1) continue
    if (cookie.slice(0, separatorIndex).trim() !== 'auth-token') continue
    return decodeURIComponent(cookie.slice(separatorIndex + 1).trim())
  }
  return null
}

export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  const decoded = verifyToken(token)
  if (!decoded) return null

  if (decoded.userId.startsWith('local-')) {
    const username = decoded.userId.slice('local-'.length)
    if (!username || username !== MANAGER_USERNAME) return null

    try {
      const existing = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          fullName: true,
          createdAt: true,
          lastLogin: true,
          googleProfilePicture: true,
          googleEmailVerified: true,
          googleEmailVerifiedAt: true,
        },
      })
      if (existing) return existing as AuthUser
    } catch (error) {
      console.error('Unable to restore the local manager session:', error)
    }

    return {
      id: decoded.userId,
      username,
      role: username === MANAGER_USERNAME ? 'MANAGER' : 'PUBLISHER',
      status: 'ACTIVE',
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      fullName: true,
      createdAt: true,
      lastLogin: true,
      googleProfilePicture: true,
      googleEmailVerified: true,
      googleEmailVerifiedAt: true,
    },
  })

  return user?.status === 'DISABLED' ? null : user as AuthUser | null
}
