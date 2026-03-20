// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/auth/signup/page.tsx  ← PASTE THIS ENTIRE FILE
//
// CHANGES:
//   - Added GDPR consent checkbox (required before account creation)
//   - Stores gdpr_consent: true in user metadata
//   - Keeps existing Stripe plan redirect logic untouched
//   - Consistent styling with new login page
// ════════════════════════════════════════════════════════════════════════════
'use client'
import { useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const GREEN        = '#4ade80'
const GREEN_DIM    = '#0f2a1a'
const GREEN_BORDER = '#1a3a1f'

function SignUpForm() {
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [name,        setName]        = useState('')
  const [gdprConsent, setGdprConsent] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  const router       = useRouter()
  const searchParams = useSearchParams()
  const plan         = searchParams.get('plan')
  const billing      = searchParams.get('billing') || 'monthly'

  const canSubmit = email && password && name && gdprConsent && !loading

  const handleSignUp = async () => {
    if (!gdprConsent) { setError('You must accept the Privacy Policy to continue.'); return }
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name:    name,
          gdpr_consent: true,
          gdpr_date:    new Date().toISOString(),
        },
      },
    })

    if (error) { setError(error.message); setLoading(false); return }

    // Stripe redirect if coming from pricing page
    if (plan && data.user) {
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, billing, userId: data.user.id, email: data.user.email }),
        })
        const result = await res.json()
        if (result.url) { window.location.href = result.url; return }
      } catch (err) {
        console.error('Stripe redirect failed:', err)
      }
    }

    router.push('/onboarding')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        .card { animation: fadeUp 0.35s cubic-bezier(.16,1,.3,1) both; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(74,222,128,0.25); }
        .btn-primary { transition: all 0.15s; }
        .input-field:focus { border-color: ${GREEN} !important; outline: none; }
        .input-field { transition: border-color 0.15s; }
        .gdpr-check { cursor: pointer; user-select: none; }
        .gdpr-check:hover .checkbox { border-color: ${GREEN} !important; }
      `}</style>

      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ width: '52px', height: '52px', background: GREEN_DIM, border: `1px solid ${GREEN_BORDER}`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '22px', color: GREEN }}>✦</div>
          <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Create your account</h1>
          <p style={{ color: '#555', fontSize: '15px', margin: 0 }}>
            {plan ? `Signing up for the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan` : 'Start your relocation journey today'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', color: '#555', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>Full name</label>
            <input className="input-field" type="text" placeholder="Your first name" value={name} onChange={e => setName(e.target.value)}
              style={{ width: '100%', background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '14px 18px', color: '#fff', fontSize: '15px', fontFamily: 'inherit' }} />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', color: '#555', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>Work email</label>
            <input className="input-field" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '14px 18px', color: '#fff', fontSize: '15px', fontFamily: 'inherit' }} />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', color: '#555', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>Password</label>
            <input className="input-field" type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && canSubmit && handleSignUp()}
              style={{ width: '100%', background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '14px 18px', color: '#fff', fontSize: '15px', fontFamily: 'inherit' }} />
          </div>

          {/* GDPR Consent — required */}
          <div
            className="gdpr-check"
            onClick={() => setGdprConsent(v => !v)}
            style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 16px', background: gdprConsent ? GREEN_DIM : '#0e0e0e', border: `1px solid ${gdprConsent ? GREEN_BORDER : '#1a1a1a'}`, borderRadius: '12px', transition: 'all 0.15s' }}
          >
            {/* Custom checkbox */}
            <div className="checkbox" style={{ width: 20, height: 20, borderRadius: '6px', background: gdprConsent ? GREEN : '#111', border: `2px solid ${gdprConsent ? GREEN : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' }}>
              {gdprConsent && <span style={{ color: '#050f06', fontSize: '12px', fontWeight: '900', lineHeight: 1 }}>✓</span>}
            </div>
            <p style={{ color: gdprConsent ? '#ccc' : '#555', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              I agree to Glotto&apos;s{' '}
              <a href="/privacy" onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer" style={{ color: GREEN, textDecoration: 'underline' }}>Privacy Policy</a>
              {' '}and consent to processing my personal data (name, email, nationality, language level) for the purpose of relocation support. I can withdraw consent at any time.
            </p>
          </div>

          {error && (
            <div style={{ background: '#1a0808', border: '1px solid #3a1010', borderRadius: '10px', padding: '12px 16px' }}>
              <p style={{ color: '#f87171', fontSize: '14px', margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleSignUp}
            disabled={!canSubmit}
            style={{ width: '100%', padding: '16px', background: canSubmit ? GREEN : '#111', color: canSubmit ? '#050f06' : '#333', border: `1px solid ${canSubmit ? GREEN : '#1a1a1a'}`, borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: 'inherit', marginTop: '2px' }}
          >
            {loading ? (plan ? 'Setting up...' : 'Creating account...') : (plan ? 'Create account & pay →' : 'Create account →')}
          </button>

          <p style={{ color: '#444', fontSize: '14px', textAlign: 'center', margin: '4px 0 0' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: GREEN, fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
          </p>

          <p style={{ color: '#222', fontSize: '12px', textAlign: 'center', margin: 0 }}>
            Your data is stored securely in the EU (Supabase Frankfurt) and never sold to third parties.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignUp() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#555', fontSize: '15px' }}>Loading...</div></div>}>
      <SignUpForm />
    </Suspense>
  )
}