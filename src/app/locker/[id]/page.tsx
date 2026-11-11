import type { Metadata } from 'next'
import IncentiveWidget from '@/components/incentive/IncentiveWidget'
import { seedIncentiveOffersForWidget } from '@/lib/incentive-seed'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Affmine - Content Locker ${id}` }
}

export default async function LockerPage({ params }: PageProps) {
  const { id } = await params
  return <IncentiveWidget kind="locker" toolId={id} seedOffers={seedIncentiveOffersForWidget} />
}
