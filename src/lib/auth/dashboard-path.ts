import type { UserRole } from '@/types'

export function getDashboardPath(role: UserRole | string | null | undefined): string {
  void role
  return '/dashboard'
}
