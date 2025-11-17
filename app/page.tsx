'use client'

import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import FlappyBirdGame from '@/components/FlappyBirdGame'
import { ErrorBoundary } from './error-boundary'

export default function Home() {
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    // Check if SDK is available before calling ready()
    if (typeof window === 'undefined') return

    // Wait a bit for everything to initialize
    const timer = setTimeout(async () => {
      try {
        // Only call ready if SDK is available
        if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
          await sdk.actions.ready()
          setSdkReady(true)
        } else {
          console.warn('Farcaster SDK not available, continuing anyway')
          setSdkReady(true)
        }
      } catch (error) {
        console.error('Failed to notify SDK ready:', error)
        // Continue anyway - don't crash the app
        setSdkReady(true)
      }
    }, 100) // Small delay to ensure everything is loaded

    return () => clearTimeout(timer)
  }, [])

  return (
    <ErrorBoundary>
      <main style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {sdkReady && <FlappyBirdGame />}
      </main>
    </ErrorBoundary>
  )
}


