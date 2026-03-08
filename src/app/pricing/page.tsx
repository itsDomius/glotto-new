'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const GREEN = '#4ade80'
const GREEN_DIM = '#0f2a1a'
const GREEN_BORDER = '#1a3a1f'

const PLANS = [
  {
    id: 'explorer',
    name: 'Explorer',
    tagline: 'Start speaking. No excuses.',
    monthlyPrice: 29.99,
    annualPrice: 23.99,
    color: '#60a5fa',
    dimColor: '#0a1a2a',
    borderColor: '#1a2a3a',
    cta: 'Start Explorer',
    popular: false,
    features: [
      { text: 'Lex AI Tutor — unlimited conversations', included: true },
      { text: 'Curriculum A1 → B1 (60+ missions)', included: true },
      { text: 'Daily Mission system', included: true },
      { text: 'Streak calendar & XP', included: true },
      { text: 'Safe Mode (first 30 sessions)', included: true },
      { text: 'Progress dashboard', included: true },
      { text: 'Full A1 → C2 curriculum', included: false },
      { text: '7-day money back guarantee', included: false },
      { text: 'The Proof recordings', included: false },
      { text: 'Monthly human session', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'The full path to fluency.',
    monthlyPrice: 54.99,
    annualPrice: 43.99,
    color: GREEN,
    dimColor: GREEN_DIM,
    borderColor: GREEN_BORDER,
    cta: 'Start Pro',
    popular: true,
    features: [
      { text: 'Lex AI Tutor — unlimited conversations', included: true },
      { text: 'Full curriculum A1 → C2 (200+ missions)', included: true },
      { text: 'Daily Mission system', included: true },
      { text: 'Streak calendar & XP', included: true },
      { text: 'Safe Mode (first 30 sessions)', included: true },
      { text: 'Progress dashboard', included: true },
      { text: 'Full A1 → C2 curriculum', included: true },
      { text: '7-day money back guarantee', included: true },
      { text: 'The Proof recordings', included: true },
      { text: 'Monthly human session', included: false },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    tagline: 'Fluency, accelerated.',
    monthlyPrice: 99.99,
    annualPrice: 79.99,
    color: '#fbbf24',
    dimColor: '#1a1200',
    borderColor: '#2a2000',
    cta: 'Start Elite',
    popular: false,
    features: [
      { text: 'Lex AI Tutor — unlimited conversations', included: true },
      { text: 'Full curriculum A1 → C2 (200+ missions)', included: true },
      { text: 'Daily Mission system', included: true },
      { text: 'Streak calendar & XP', included: true },
      { text: 'Safe Mode (first 30 sessions)', included: true },
      { text: 'Progress dashboard', included: true },
      { text: 'Full A1 → C2 curriculum', included: true },
      { text: '7-day money back guarantee', included: true },
      { text: 'The Proof recordings', included: true },
      { text: '1 live human session / month', included: true },
    ],
  },
]

const FAQS = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes, upgrade or downgrade anytime. Changes take effect at the next billing cycle.',
  },
  {
    q: 'What is the 7-day guarantee?',
    a: "If you don't have a real conversation in your target language within 7 days, we refund you in full. No questions asked.",
  },
  {
    q: 'What is Safe Mode?',
    a: "For your first 30 sessions, Lex never corrects you directly. It models correct usage naturally in its responses. This removes the fear of making mistakes — the #1 reason people stop learning.",
  },
  {
    q: 'What are The Proof recordings?',
    a: "Every month, Lex records a short conversation with you. You can listen back to how you spoke 3 months ago vs. today. Progress you can hear — not just believe.",
  },
  {
    q: 'How does the monthly human session work? (Elite)',
    a: 'Once a month you get a 45-minute video call with a verified native speaker from our network. Lex prepares you for it. The human pushes you further.',
  },
  {
    q: 'What happens if I miss a day?',
    a: "Your streak resets, but nothing else does. Your missions, XP, and progress are always saved. Lex picks up exactly where you left off.",
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const router = useRouter()

  const handlePlan = async (planId: string) => {
    setLoadingPlan(planId)

    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()

      // If not logged in, send to signup with plan pre-selected
      if (!user) {
        router.push(`/auth/signup?plan=${planId}&billing=${annual ? 'annual' : 'monthly'}`)
        return
      }

      // User is logged in — create Stripe checkout session
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          billing: annual ? 'annual' : 'monthly',
          userId: user.id,
          email: user.email,
        }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned', data)
        alert('Something went wrong. Please try again.')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* Nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid #111',
        position: 'sticky',
        top: 0,
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
      }}>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ color: GREEN, fontWeight: '800', fontSize: '20px' }}>Glotto</span>
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              background: 'none', border: '1px solid #1f1f1f', borderRadius: '10px',
              color: '#888', fontSize: '14px', padding: '8px 18px', cursor: 'pointer',
            }}
          >
            Log in
          </button>
          <button
            onClick={() => router.push('/auth/signup')}
            style={{
              background: GREEN, border: 'none', borderRadius: '10px',
              color: '#050f06', fontSize: '14px', fontWeight: '700',
              padding: '8px 18px', cursor: 'pointer',
            }}
          >
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '80px 24px 48px' }}>
        <div style={{
          display: 'inline-block',
          background: GREEN_DIM,
          border: `1px solid ${GREEN_BORDER}`,
          borderRadius: '100px',
          padding: '6px 16px',
          fontSize: '13px',
          color: GREEN,
          fontWeight: '600',
          marginBottom: '24px',
        }}>
          Simple pricing. Real outcomes.
        </div>
        <h1 style={{ fontSize: '56px', fontWeight: '800', margin: '0 0 16px', lineHeight: 1.1 }}>
          Speak the life<br />
          <span style={{ color: GREEN }}>you want.</span>
        </h1>
        <p style={{ color: '#555', fontSize: '18px', maxWidth: '480px', margin: '0 auto 48px' }}>
          Language schools cost €6,500 and take 6 years.
          Glotto costs €30/month and gets you talking in 7 days.
        </p>

        {/* Billing toggle */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          background: '#111',
          border: '1px solid #1f1f1f',
          borderRadius: '100px',
          padding: '6px 6px 6px 16px',
        }}>
          <span style={{ fontSize: '14px', color: !annual ? '#fff' : '#444', fontWeight: !annual ? '600' : '400' }}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            style={{
              width: '44px', height: '24px',
              background: annual ? GREEN : '#222',
              border: 'none', borderRadius: '100px',
              cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute',
              top: '3px',
              left: annual ? '23px' : '3px',
              width: '18px', height: '18px',
              background: '#fff',
              borderRadius: '50%',
              transition: 'left 0.2s',
            }} />
          </button>
          <span style={{ fontSize: '14px', color: annual ? '#fff' : '#444', fontWeight: annual ? '600' : '400' }}>
            Annual
          </span>
          {annual && (
            <span style={{
              background: GREEN_DIM, border: `1px solid ${GREEN_BORDER}`,
              borderRadius: '100px', padding: '3px 10px',
              fontSize: '12px', color: GREEN, fontWeight: '700',
            }}>
              Save 20%
            </span>
          )}
        </div>
      </div>

      {/* Plans */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        maxWidth: '1040px',
        margin: '0 auto',
        padding: '0 24px 80px',
      }}>
        {PLANS.map((plan) => {
          const price = annual ? plan.annualPrice : plan.monthlyPrice
          const isLoading = loadingPlan === plan.id

          return (
            <div
              key={plan.id}
              style={{
                background: plan.popular ? plan.dimColor : '#0e0e0e',
                border: `2px solid ${plan.popular ? plan.color : '#1a1a1a'}`,
                borderRadius: '20px',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transform: plan.popular ? 'scale(1.03)' : 'none',
                boxShadow: plan.popular ? `0 0 40px ${plan.color}22` : 'none',
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: GREEN,
                  color: '#050f06',
                  fontSize: '12px',
                  fontWeight: '800',
                  padding: '4px 16px',
                  borderRadius: '100px',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}>
                  MOST POPULAR
                </div>
              )}

              {/* Plan header */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'inline-block',
                  background: `${plan.color}18`,
                  border: `1px solid ${plan.color}40`,
                  borderRadius: '8px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: plan.color,
                  marginBottom: '12px',
                  letterSpacing: '0.06em',
                }}>
                  {plan.name.toUpperCase()}
                </div>
                <p style={{ color: '#555', fontSize: '14px', margin: '0 0 20px' }}>{plan.tagline}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>
                    €{price.toFixed(2).replace('.', ',')}
                  </span>
                  <span style={{ color: '#444', fontSize: '14px' }}>/month</span>
                </div>
                {annual && (
                  <p style={{ color: '#444', fontSize: '13px', margin: '6px 0 0' }}>
                    Billed annually · Save €{((plan.monthlyPrice - plan.annualPrice) * 12).toFixed(0)}/yr
                  </p>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => handlePlan(plan.id)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: plan.popular ? GREEN : 'transparent',
                  color: plan.popular ? '#050f06' : plan.color,
                  border: `2px solid ${plan.popular ? GREEN : plan.color}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  marginBottom: '28px',
                  transition: 'all 0.15s',
                  opacity: isLoading ? 0.7 : 1,
                }}
                onMouseEnter={e => {
                  if (!plan.popular && !isLoading) {
                    (e.target as HTMLButtonElement).style.background = `${plan.color}18`
                  }
                }}
                onMouseLeave={e => {
                  if (!plan.popular) {
                    (e.target as HTMLButtonElement).style.background = 'transparent'
                  }
                }}
              >
                {isLoading ? 'Redirecting...' : `${plan.cta} →`}
              </button>

              {/* Divider */}
              <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '24px' }} />

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {plan.features.map((feature, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{
                      fontSize: '14px',
                      flexShrink: 0,
                      marginTop: '1px',
                      color: feature.included ? plan.color : '#2a2a2a',
                    }}>
                      {feature.included ? '✓' : '✕'}
                    </span>
                    <span style={{
                      fontSize: '14px',
                      color: feature.included ? '#ccc' : '#333',
                      lineHeight: 1.4,
                    }}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Guarantee strip */}
      <div style={{ maxWidth: '840px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{
          background: GREEN_DIM,
          border: `1px solid ${GREEN_BORDER}`,
          borderRadius: '16px',
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
        }}>
          <span style={{ fontSize: '36px', flexShrink: 0 }}>🛡</span>
          <div>
            <p style={{ color: GREEN, fontWeight: '800', fontSize: '16px', margin: '0 0 6px' }}>
              7-Day First Conversation Guarantee
            </p>
            <p style={{ color: '#888', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
              Have a real conversation in your target language within 7 days — or we refund you in full.
              No forms. No questions. Not a gamble — a guarantee backed by how the product actually works.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison vs language school */}
      <div style={{ maxWidth: '840px', margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>
          The math speaks for itself.
        </h2>
        <p style={{ textAlign: 'center', color: '#555', fontSize: '16px', marginBottom: '40px' }}>
          Compare what you spend vs. what you actually get.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            {
              label: 'Language School',
              price: '€6,500',
              period: 'over 6 years',
              outcome: "Maybe B2 if you don't quit",
              color: '#ff4444',
              bg: '#1a0a0a',
              border: '#2a1010',
            },
            {
              label: 'Glotto Pro',
              price: '€660',
              period: 'for 12 months',
              outcome: 'Real conversations in 7 days, guaranteed',
              color: GREEN,
              bg: GREEN_DIM,
              border: GREEN_BORDER,
            },
          ].map(({ label, price, period, outcome, color, bg, border }) => (
            <div key={label} style={{
              background: bg, border: `2px solid ${border}`,
              borderRadius: '16px', padding: '28px',
            }}>
              <p style={{ color: '#555', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>{label}</p>
              <p style={{ color, fontSize: '48px', fontWeight: '800', margin: '0 0 4px', lineHeight: 1 }}>{price}</p>
              <p style={{ color: '#444', fontSize: '14px', margin: '0 0 20px' }}>{period}</p>
              <div style={{ height: '1px', background: '#1f1f1f', margin: '0 0 16px' }} />
              <p style={{ color: color === GREEN ? '#ccc' : '#666', fontSize: '15px', lineHeight: 1.5, margin: 0 }}>{outcome}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: '680px', margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '800', marginBottom: '40px' }}>
          Common questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              style={{
                background: openFaq === i ? '#111' : '#0e0e0e',
                border: `1px solid ${openFaq === i ? '#1f1f1f' : '#141414'}`,
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.15s',
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', background: 'none', border: 'none',
                  padding: '20px 24px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: '16px',
                }}
              >
                <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600', textAlign: 'left' }}>
                  {faq.q}
                </span>
                <span style={{
                  color: openFaq === i ? GREEN : '#444',
                  fontSize: '20px', flexShrink: 0,
                  transform: openFaq === i ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.2s, color 0.2s',
                }}>
                  +
                </span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 24px 20px' }}>
                  <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div style={{
        textAlign: 'center',
        padding: '80px 24px',
        borderTop: '1px solid #111',
      }}>
        <h2 style={{ fontSize: '40px', fontWeight: '800', margin: '0 0 16px' }}>
          Ready to actually speak?
        </h2>
        <p style={{ color: '#555', fontSize: '17px', margin: '0 0 36px' }}>
          Start free. First conversation guaranteed in 7 days.
        </p>
        <button
          onClick={() => router.push('/auth/signup')}
          style={{
            background: GREEN,
            color: '#050f06',
            border: 'none',
            borderRadius: '14px',
            padding: '18px 40px',
            fontSize: '17px',
            fontWeight: '800',
            cursor: 'pointer',
          }}
        >
          Start speaking today →
        </button>
        <p style={{ color: '#333', fontSize: '13px', marginTop: '16px' }}>
          No credit card required for trial · Cancel anytime
        </p>
      </div>

    </div>
  )
}