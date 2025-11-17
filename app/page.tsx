'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import FlappyBirdGame from '@/components/FlappyBirdGame'
import { ErrorBoundary } from './error-boundary'
import { setupErrorHandlers, logError } from '../lib/error-logger'

export default function Home() {
  useEffect(() => {
    // Setup error logging first
    setupErrorHandlers()
    
    // Log that app is starting
    console.log('🚀 Flappy Mini App starting...')
    console.log('Environment:', {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    })

    // Try to get Farcaster context
    // sdk.context is already a Promise<MiniAppContext>
    Promise.resolve(sdk.context).then((ctx: any) => {
      const fid = ctx?.user?.fid
      if (typeof fid === 'number') {
        console.log('✅ Farcaster FID detected:', fid)
      } else {
        console.log('ℹ️ No FID in context (normal outside Farcaster)')
      }
    }).catch(() => {
      console.log('ℹ️ Not in Farcaster environment (normal for dev)')
    })

    // Call ready() with error logging
    const initSdk = async () => {
      try {
        console.log('📡 Calling sdk.actions.ready()...')
        await sdk.actions.ready()
        console.log('✅ SDK ready() completed successfully')
      } catch (error: any) {
        console.error('❌ SDK ready() failed:', error)
        logError({
          error: error?.message || 'SDK ready() failed',
          stack: error?.stack,
          context: {
            type: 'sdk_ready_error',
            sdkAvailable: !!sdk,
            actionsAvailable: !!sdk?.actions,
            readyAvailable: typeof sdk?.actions?.ready,
          },
        })
        // Continue anyway - app should work
      }
    }

    // Small delay to ensure everything is initialized
    const timer = setTimeout(initSdk, 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <ErrorBoundary>
      <main style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FlappyBirdGame />
      </main>
    </ErrorBoundary>
  )
}


