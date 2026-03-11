// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/api/stripe/stake/route.ts   ← CREATE THIS (new file in existing folder)
// ════════════════════════════════════════════════════════════════════════════
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export async function POST(req: Request) {
  try {
    const { userId, action, paymentIntentId } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── CREATE: Hold €30 (manual capture = money reserved, not charged yet) ──
    if (action === 'create') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 3000, // €30.00 in cents
        currency: 'eur',
        capture_method: 'manual', // Key: authorise only, don't charge yet
        description: 'Glotto Commitment Stake — released on mission completion',
        metadata: { userId, type: 'stake' },
      })

      await supabase.from('profiles').update({
        staked_amount: 30,
        stake_payment_intent_id: paymentIntent.id,
        stake_started_at: new Date().toISOString(),
      }).eq('user_id', userId)

      return NextResponse.json({ client_secret: paymentIntent.client_secret })
    }

    // ── RELEASE: Cancel the hold — money goes back (user completed missions) ──
    if (action === 'release') {
      await stripe.paymentIntents.cancel(paymentIntentId)

      await supabase.from('profiles').update({
        staked_amount: 0,
        stake_released_at: new Date().toISOString(),
      }).eq('user_id', userId)

      return NextResponse.json({ ok: true })
    }

    // ── CAPTURE: Charge the hold — user failed their missions ──
    if (action === 'capture') {
      await stripe.paymentIntents.capture(paymentIntentId)

      await supabase.from('profiles').update({
        stake_captured_at: new Date().toISOString(),
      }).eq('user_id', userId)

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Stake API error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}