import type { Metadata } from 'next'
import DashboardOverview from '@/components/dashboard/DashboardOverview'

type RouteProps = {
  params: Promise<{ slug: string[] }>
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params
  const title = slug
    .map((part) => part.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()))
    .join(' - ')

  return { title: `Affmine - ${title}` }
}

export default function AppPage() {
  return <DashboardOverview />
}
