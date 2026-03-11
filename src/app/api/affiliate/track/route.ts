import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { partner, cta_url, userId } = await req.json()

    // Non-critical — never fail the user over affiliate tracking
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase.from('affiliate_clicks').insert({
      user_id: userId || null,
      partner,
      cta_url,
      clicked_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Silently succeed — never block the user
    return NextResponse.json({ ok: true })
  }
}






















