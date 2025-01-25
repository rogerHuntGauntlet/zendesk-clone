'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

function AuthCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  )
}

const AuthCallback = dynamic(
  () => import('@/components/auth/AuthCallback'),
  {
    loading: AuthCallbackLoading,
    ssr: false
  }
)

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallback />
    </Suspense>
  )
}
