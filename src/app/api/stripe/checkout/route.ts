import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: 1000, // €10.00 in cents
            product_data: {
              name: 'Fluency Stake',
              description: 'Commit €10 to your fluency goal. Earn it back when you prove your progress.',
              images: [],
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?stake=success`,
      cancel_url: `${baseUrl}/dashboard?stake=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Checkout failed' },
      { status: 500 }
    )
  }
}
