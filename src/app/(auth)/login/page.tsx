import type { Metadata } from "next";
import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  metadataBase: new URL('https://network.affmine.com'),
  title: 'Manager Login — Affmine',
  description:
    'Log in to your Affmine account to manage campaigns, performance, and payouts.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://network.affmine.com/login',
  },
  openGraph: {
    title: 'Manager Login — Affmine',
    description:
      'Log in to your Affmine account to manage campaigns, performance, and payouts.',
    type: 'website',
    url: 'https://network.affmine.com/login',
    siteName: 'Affmine',
    images: [
      {
        url: 'https://network.affmine.com/affmine-preview.png',
        secureUrl: 'https://network.affmine.com/affmine-preview.png',
        width: 768,
        height: 768,
        alt: 'Affmine affiliate dashboard preview',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manager Login — Affmine',
    description:
      'Log in to your Affmine account to manage campaigns, performance, and payouts.',
    images: ['https://network.affmine.com/affmine-preview.png'],
    creator: 'Affmine',
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" aria-hidden="true" />}>
      <LoginClient />
    </Suspense>
  );
}
