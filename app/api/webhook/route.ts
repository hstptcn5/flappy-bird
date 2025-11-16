import { NextRequest, NextResponse } from 'next/server'

// Webhook endpoint for Mini App notifications
// This is called by Farcaster/Base App when certain events occur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle different webhook events
    // See: https://docs.farcaster.xyz/reference/miniapps/webhooks
    console.log('Webhook received:', body)

    // Example: Handle user added the Mini App
    if (body.type === 'user_added') {
      // You can track analytics, send welcome messages, etc.
      console.log('User added Mini App:', body.user)
    }

    // Example: Handle user removed the Mini App
    if (body.type === 'user_removed') {
      console.log('User removed Mini App:', body.user)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}


