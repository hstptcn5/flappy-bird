'use client'

import { OnchainKitProvider } from '@coinbase/onchainkit'
import { ReactNode } from 'react'
import { base } from 'viem/chains'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || 'demo'}
      chain={base}
    >
      {children}
    </OnchainKitProvider>
  )
}


