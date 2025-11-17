import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log error with timestamp
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: body.error,
      stack: body.stack,
      userAgent: body.userAgent,
      url: body.url,
      fid: body.fid,
      context: body.context,
    }

    // Log to console (for Vercel logs)
    console.error('🚨 CLIENT ERROR:', JSON.stringify(errorLog, null, 2))

    // In production, you might want to save to database or external service
    // For now, just log to console
    
    return NextResponse.json({ success: true, logged: true })
  } catch (error) {
    console.error('Error logging endpoint failed:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

