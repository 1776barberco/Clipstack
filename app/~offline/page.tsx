'use client'

import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">You&apos;re Offline</h1>
        <p className="mb-8 text-muted-foreground">
          Don&apos;t worry! Your changes are saved and will sync when you&apos;re back online.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          Try Again
        </Link>
      </div>
    </div>
  )
}
