import type { UserRole } from '@/types'

export function getDashboardPath(role: UserRole | string | null | undefined): string {
  return role === 'MANAGER' ? '/account/publishers' : '/dashboard'
}
