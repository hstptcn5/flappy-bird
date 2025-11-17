'use client'

import { ReactNode } from 'react'
// Temporarily disable OnchainKitProvider to test if it's causing crashes in Farcaster
// Re-enable when wallet features are needed

export function Providers({ children }: { children: ReactNode }) {
  // For now, just return children directly without OnchainKitProvider
  // This will help identify if OnchainKitProvider is causing the crash
  return <>{children}</>
  
  // Uncomment below when wallet features are needed:
  // import { OnchainKitProvider } from '@coinbase/onchainkit'
  // import { base } from 'viem/chains'
  // return (
  //   <OnchainKitProvider
  //     apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || 'demo'}
  //     chain={base}
  //   >
  //     {children}
  //   </OnchainKitProvider>
  // )
}


