import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

/** Runtime manager bootstrap credentials (read per-request, not build-time frozen). */
export function getManagerEnvCredentials() {
  const username = (process.env.MANAGER_USERNAME || '').trim()
  const password = (process.env.MANAGER_PASSWORD || '').trim()
  return { username, password }
}

/**
 * Ensure the env manager exists as a real DB row.
 * Needed after empty-DB boots that issued `local-{username}` session tokens.
 */
export async function ensureManagerDbUser() {
  const { username, password } = getManagerEnvCredentials()
  if (!username || !password) return null

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: username, mode: 'insensitive' } },
        { email: { equals: username, mode: 'insensitive' } },
        { email: { equals: `${username}@example.com`, mode: 'insensitive' } },
      ],
    },
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

  if (existing) {
    if (existing.role !== 'MANAGER' || existing.status !== 'ACTIVE') {
      return prisma.user.update({
        where: { id: existing.id },
        data: { role: 'MANAGER', status: 'ACTIVE' },
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
    }
    return existing
  }

  const hashed = await bcrypt.hash(password, 10)
  return prisma.user.create({
    data: {
      username,
      email: `${username}@example.com`,
      password: hashed,
      role: 'MANAGER',
      status: 'ACTIVE',
    },
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
}

export function isManagerEnvLoginAttempt(usernameOrEmail: string, password: string): boolean {
  const { username: managerUsername, password: managerPassword } = getManagerEnvCredentials()
  if (!managerUsername || !managerPassword) return false
  if (password !== managerPassword) return false

  const entered = usernameOrEmail.trim().toLowerCase()
  const expected = managerUsername.toLowerCase()
  if (!entered || !expected) return false

  return (
    entered === expected
    || entered === `${expected}@example.com`
    || entered.startsWith(`${expected}@`)
  )
}

export function isManagerEnvUsername(usernameOrEmail: string | null | undefined): boolean {
  const { username: managerUsername } = getManagerEnvCredentials()
  if (!managerUsername || !usernameOrEmail) return false
  const entered = usernameOrEmail.trim().toLowerCase()
  const expected = managerUsername.toLowerCase()
  return (
    entered === expected
    || entered === `${expected}@example.com`
    || entered.startsWith(`${expected}@`)
  )
}
