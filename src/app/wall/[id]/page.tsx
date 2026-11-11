import type { Metadata } from 'next'
import IncentiveWidget from '@/components/incentive/IncentiveWidget'
import { seedIncentiveOffersForWidget } from '@/lib/incentive-seed'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Affmine - OfferWall ${id}` }
}

export default async function OfferWallPage({ params }: PageProps) {
  const { id } = await params
  return <IncentiveWidget kind="offerwall" toolId={id} seedOffers={seedIncentiveOffersForWidget} />
}
