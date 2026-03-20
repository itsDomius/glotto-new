// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/api/hr/invite/route.ts  ← CREATE NEW FILE (new folder /hr/)
//
// PURPOSE: Called by HR dashboard bulk invite. Sends a Supabase magic link
//          invite to each employee email. Employees click the link →
//          account created → onboarding starts automatically.
//          Uses service role key (server-side only, never exposed to client).
// ════════════════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, companyId } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Use service role key — this can create/invite users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Invite the user — creates account if doesn't exist, sends magic link
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        company_id:   companyId || null,
        invited_by:   'hr_dashboard',
        gdpr_consent: true,
        gdpr_date:    new Date().toISOString(),
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://glotto-new.vercel.app'}/onboarding`,
    })

    if (error) {
      console.error('Invite error for', email, ':', error.message)
      // Don't expose internal errors — return a safe message
      return NextResponse.json({ error: 'Could not send invite', detail: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, userId: data.user?.id })

  } catch (err) {
    console.error('HR invite route error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}