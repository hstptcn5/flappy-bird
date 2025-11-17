'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import FlappyBirdGame from '@/components/FlappyBirdGame'
import { ErrorBoundary } from './error-boundary'

export default function Home() {
  useEffect(() => {
    // Call ready() as soon as possible - don't check if it exists
    // The SDK will handle it gracefully if called outside of Farcaster environment
    sdk.actions.ready().catch((error) => {
      // Silently fail - app should work even if SDK is not available
      if (process.env.NODE_ENV === 'development') {
        console.warn('SDK ready() failed (normal outside Farcaster):', error)
      }
    })
  }, [])

  return (
    <ErrorBoundary>
      <main style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FlappyBirdGame />
      </main>
    </ErrorBoundary>
  )
}


