import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'
import {
  ensureManagerDbUser,
  getManagerEnvCredentials,
  isManagerEnvUsername,
} from '@/lib/manager-auth'
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
  publisherNumber?: number | null
  createdAt?: Date
  lastLogin?: Date | null
  googleProfilePicture?: string | null
  googleEmailVerified?: boolean
  googleEmailVerifiedAt?: Date | null
}

export function normalizeEffectiveUserRole(
  user: { role?: UserRole; username?: string | null; email?: string | null } | null | undefined,
): UserRole | undefined {
  if (!user) return undefined
  // Env manager account must never render as publisher in the UI.
  if (isManagerEnvUsername(user.username) || isManagerEnvUsername(user.email)) {
    return 'MANAGER'
  }
  return user.role
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
    const { username: managerUsername } = getManagerEnvCredentials()
    if (!username || !managerUsername || username.toLowerCase() !== managerUsername.toLowerCase()) {
      return null
    }

    try {
      const existing = await ensureManagerDbUser()
      if (existing) {
        return { ...existing, role: 'MANAGER' } as AuthUser
      }
    } catch (error) {
      console.error('Unable to restore the local manager session:', error)
    }

    return {
      id: decoded.userId,
      username: managerUsername,
      role: 'MANAGER',
      status: 'ACTIVE',
      publisherNumber: null,
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
      publisherNumber: true,
      createdAt: true,
      lastLogin: true,
      googleProfilePicture: true,
      googleEmailVerified: true,
      googleEmailVerifiedAt: true,
    },
  })

  if (!user || user.status === 'DISABLED') return null

  if (isManagerEnvUsername(user.username) || isManagerEnvUsername(user.email)) {
    if (user.role !== 'MANAGER') {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'MANAGER', status: 'ACTIVE' },
        })
      } catch (error) {
        console.error('Unable to repair manager role for', user.username, error)
      }
    }
    return { ...user, role: 'MANAGER' } as AuthUser
  }

  return user as AuthUser
}
