'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/95 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
        <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          We encountered an unexpected problem while loading this page. You can try again or return home.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Go home
          </Link>
        </div>
        <pre className="mt-6 overflow-x-auto rounded-2xl bg-slate-950/80 p-4 text-[11px] text-slate-400">
          {error.message}
        </pre>
      </div>
    </div>
  )
}
