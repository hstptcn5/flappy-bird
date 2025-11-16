'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import FlappyBirdGame from '@/components/FlappyBirdGame'

export default function Home() {
  useEffect(() => {
    // Notify Farcaster SDK that the app is ready to display
    sdk.actions.ready().catch((error) => {
      console.error('Failed to notify SDK ready:', error)
    })
  }, [])

  return (
    <main style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <FlappyBirdGame />
    </main>
  )
}


