import type { Metadata } from 'next'
import DashboardOverview from '@/components/dashboard/DashboardOverview'

export const metadata: Metadata = {
  title: 'Affmine - Dashboard',
}

export default function DashboardPage() {
  return <DashboardOverview />
}
