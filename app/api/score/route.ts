import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type Body = {
  fid?: number
  score?: number
}

export async function POST(req: NextRequest) {
  try {
    const { fid, score } = (await req.json()) as Body

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    if (typeof fid !== 'number' || typeof score !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    if (score < 0 || !Number.isFinite(score)) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 })
    }

    // Upsert (insert if not exists, otherwise keep the higher score)
    // Assuming a table `scores` with columns: fid (int8, PK or unique), score (int4), updated_at (timestamptz default now())
    const { data, error } = await supabaseAdmin
      .from('scores')
      .upsert({ fid, score }, { onConflict: 'fid' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unexpected error' }, { status: 500 })
  }
}


