import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num === 0) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) {
    const decimals = num < 1100 ? 3 : 1
    return Number((num / 1000).toFixed(decimals)) + 'K'
  }
  return num.toString()
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getCookieValue(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null

  const cookie = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith(`${name}=`))

  if (!cookie) return null

  return cookie.split('=')[1] || null
}