import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PageTransition from '@/components/ui/PageTransition'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  applicationName: 'Affmine',
  metadataBase: new URL('https://network.affmine.com'),
  title: 'Affmine | Affiliate Network for Publishers & Advertisers',
  description:
    'Discover high-converting campaigns, track your performance, and manage your affiliate account with Affmine.',
  authors: [{ name: 'Affmine', url: 'https://network.affmine.com' }],
  creator: 'Affmine',
  publisher: 'Affmine',
  category: 'Business',
  referrer: 'strict-origin-when-cross-origin',
  formatDetection: {
    email: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Affmine',
  },
  alternates: {
    canonical: 'https://network.affmine.com',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/afficix_favicon.png', type: 'image/png' },
    ],
    apple: [{ url: '/afficix_favicon.png', type: 'image/png' }],
    shortcut: '/afficix_favicon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Affmine | Affiliate Network for Publishers & Advertisers',
    description:
      'Discover high-converting campaigns, monitor performance, and manage your affiliate account with Affmine.',
    type: 'website',
    url: 'https://network.affmine.com',
    siteName: 'Affmine',
    locale: 'en_US',
    images: [
      {
        url: '/affmine-preview.png',
        secureUrl: 'https://network.affmine.com/affmine-preview.png',
        width: 768,
        height: 768,
        alt: 'Affmine affiliate network dashboard',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Affmine | Affiliate Network for Publishers & Advertisers',
    description:
      'Discover high-converting campaigns, monitor performance, and manage your affiliate account with Affmine.',
    images: ['/affmine-preview.png'],
    site: '@affmine',
    creator: '@affmine',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#eef2f7',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-dvh">
          <PageTransition>{children}</PageTransition>
        </div>
      </body>
    </html>
  )
}