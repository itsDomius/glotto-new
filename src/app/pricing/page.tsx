// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/pricing/page.tsx
// CHANGE: All emojis replaced with lucide-react icons. Zero logic changes.
// ════════════════════════════════════════════════════════════════════════════
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  Zap,
  Brain,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const G  = '#4ade80'
const GD = '#0f2a1a'
const GB = '#1a3a1f'

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [stakeConfirm, setStakeConfirm] = useState(false)
  const router = useRouter()

  const handleSubscribe = async () => {
    setLoadingPlan('subscribe')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/signup?plan=pro'); return }
      const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: 'pro', billing: 'monthly', userId: user.id, email: user.email }) })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (e) { console.error(e) }
    finally { setLoadingPlan(null) }
  }

  const handleStake = async () => {
    setLoadingPlan('stake')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/signup?plan=stake'); return }
      const res = await fetch('/api/stripe/stake', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, action: 'create' }) })
      const { client_secret } = await res.json()
      window.location.href = `/stake?client_secret=${client_secret}`
    } catch (e) { console.error(e) }
    finally { setLoadingPlan(null) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: '"DM Sans", -apple-system, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes glow { 0%,100%{box-shadow:0 0 24px rgba(74,222,128,0.08)}50%{box-shadow:0 0 48px rgba(74,222,128,0.2)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid #111', position: 'sticky', top: 0, background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ color: G, fontWeight: '800', fontSize: '20px', fontFamily: '"DM Serif Display", serif' }}>Glotto</span>
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => router.push('/auth/login')} style={{ background: 'none', border: '1px solid #1f1f1f', borderRadius: '10px', color: '#888', fontSize: '14px', padding: '8px 18px', cursor: 'pointer' }}>Log in</button>
          <button onClick={() => router.push('/auth/signup')} style={{ background: G, border: 'none', borderRadius: '10px', color: '#050f06', fontSize: '14px', fontWeight: '700', padding: '8px 18px', cursor: 'pointer' }}>Try free</button>
        </div>
      </nav>

      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '80px 24px', animation: 'fadeUp 0.5s ease both' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: GD, border: `1px solid ${GB}`, borderRadius: '100px', padding: '6px 16px', fontSize: '12px', color: G, fontWeight: '700', marginBottom: '24px', letterSpacing: '0.08em' }}>
            <Zap size={13} />
            TWO WAYS TO COMMIT
          </div>
          <h1 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(38px, 6vw, 64px)', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Most apps take your money<br />and hope you don&apos;t quit.
          </h1>
          <p style={{ color: '#555', fontSize: '17px', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
            We built a system that puts <strong style={{ color: '#888' }}>skin in the game</strong> — yours and ours. Complete the missions, get your money back.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '56px' }}>

          {/* Standard */}
          <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'inline-block', background: '#60a5fa15', border: '1px solid #60a5fa30', borderRadius: '8px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', color: '#60a5fa', marginBottom: '16px', letterSpacing: '0.08em', width: 'fit-content' }}>STANDARD</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.02em' }}>Monthly Access</h2>
            <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px', flex: 1 }}>Unlimited missions, emergency button, and confidence tracker. No commitment.</p>
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '46px', fontWeight: '800', lineHeight: 1 }}>€29.99</span>
              <span style={{ color: '#444', fontSize: '14px' }}> /month</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {['All 7 Survival Missions', 'Emergency Panic Button', 'Confidence Tracker', 'Affiliate rewards', 'Cancel anytime'].map(f => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Check size={14} color="#60a5fa" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#888', fontSize: '14px' }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={handleSubscribe} disabled={loadingPlan === 'subscribe'} style={{ width: '100%', padding: '14px', background: 'transparent', border: '2px solid #60a5fa', color: '#60a5fa', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', opacity: loadingPlan === 'subscribe' ? 0.6 : 1 }}>
              {loadingPlan === 'subscribe' ? 'Redirecting...' : 'Subscribe →'}
            </button>
          </div>

          {/* Stake */}
          <div style={{ background: GD, border: `2px solid ${G}`, borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', position: 'relative', animation: 'glow 3s ease infinite' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: G, color: '#050f06', fontSize: '11px', fontWeight: '800', padding: '4px 16px', borderRadius: '100px', letterSpacing: '0.06em', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Zap size={11} />MOST RESULTS
            </div>
            <div style={{ display: 'inline-block', background: `${G}18`, border: `1px solid ${G}40`, borderRadius: '8px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', color: G, marginBottom: '16px', letterSpacing: '0.08em', width: 'fit-content' }}>LEARNING ESCROW</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.02em' }}>Stake & Get Back</h2>
            <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
              <strong style={{ color: '#fff' }}>Put €30 in escrow.</strong> Complete 5 Survival Missions in 7 days — we return your €30. Fail, we keep it.
            </p>

            {/* Escrow box */}
            <div style={{ background: '#0a1a0a', border: `1px solid ${GB}`, borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ color: G, fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'DM Mono, monospace' }}>How escrow works</p>
              {[
                { step: '1', text: 'Stake €30 — held, not charged yet', ok: true },
                { step: '2', text: 'Complete 5 missions in 7 days', ok: true },
                { step: '3', text: 'Done? Your €30 is released back', ok: true },
                { step: '✕', text: "Miss it? We keep €30. No exceptions.", ok: false },
              ].map(({ step, text, ok }) => (
                <div key={step} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ background: ok ? '#0f2a1a' : '#2a0a0a', border: `1px solid ${ok ? G : '#f87171'}40`, borderRadius: '6px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: ok ? G : '#f87171', flexShrink: 0 }}>
                    {step === '✕' ? <X size={10} color="#f87171" /> : step}
                  </span>
                  <span style={{ color: ok ? '#888' : '#f87171', fontSize: '13px', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Brain note */}
            <div style={{ background: '#0e0e0e', border: '1px solid #111', borderRadius: '10px', padding: '12px 14px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <Brain size={16} color="#555" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ color: '#444', fontSize: '12px', lineHeight: 1.6 }}>
                <strong style={{ color: '#555' }}>Loss aversion:</strong> People work 3× harder to avoid losing €30 than to gain it. Stakers complete 90% of missions. Standard: 23%.
              </p>
            </div>

            {!stakeConfirm ? (
              <button onClick={() => setStakeConfirm(true)} style={{ width: '100%', padding: '16px', background: G, color: '#050f06', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit' }}>
                Stake €30 &amp; Unlock All Missions →
              </button>
            ) : (
              <div>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', textAlign: 'center', marginBottom: '12px', lineHeight: 1.5 }}>
                  Confirm: €30 held in escrow until you complete 5 missions in 7 days.
                </p>
                <button onClick={handleStake} disabled={loadingPlan === 'stake'} style={{ width: '100%', padding: '14px', background: G, color: '#050f06', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '8px', opacity: loadingPlan === 'stake' ? 0.7 : 1 }}>
                  {loadingPlan === 'stake' ? 'Setting up escrow...' : 'Yes, I commit — Stake €30 →'}
                </button>
                <button onClick={() => setStakeConfirm(false)} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#444', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  ← Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', marginBottom: '48px' }}>
          {[
            { v: '90%', l: 'completion rate — stakers', c: G },
            { v: '23%', l: 'completion rate — standard', c: '#f87171' },
            { v: '€0',  l: 'effective cost if you finish', c: G },
          ].map(({ v, l, c }) => (
            <div key={l} style={{ textAlign: 'center', padding: '28px 16px', background: '#0e0e0e', border: '1px solid #111', borderRadius: '14px' }}>
              <p style={{ color: c, fontFamily: '"DM Serif Display", serif', fontSize: '40px', fontWeight: '800', marginBottom: '6px' }}>{v}</p>
              <p style={{ color: '#444', fontSize: '13px', lineHeight: 1.5 }}>{l}</p>
            </div>
          ))}
        </div>

        {/* B2B teaser */}
        <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '32px' }}>
          <div>
            <p style={{ color: '#fbbf24', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>FOR COMPANIES</p>
            <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '4px' }}>Relocating employees?</h3>
            <p style={{ color: '#555', fontSize: '14px' }}>HR Shield dashboard — track team confidence, prevent €15k churn costs. From €99.99/user/month.</p>
          </div>
          <button onClick={() => router.push('/b2b-dashboard')} style={{ background: '#fbbf2415', border: '1px solid #fbbf2440', color: '#fbbf24', borderRadius: '12px', padding: '12px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            View Demo →
          </button>
        </div>

        {/* Free missions note */}
        <div style={{ background: GD, border: `1px solid ${GB}`, borderRadius: '14px', padding: '20px 24px', display: 'flex', gap: '14px', alignItems: 'center' }}>
          <ShieldCheck size={28} color={G} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ color: G, fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>Missions 1 &amp; 2 are free</p>
            <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.6 }}>No card required. Try the simulation before you commit to anything.</p>
          </div>
        </div>
      </div>
    </div>
  )
}