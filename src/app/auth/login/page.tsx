// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/auth/login/page.tsx  ← PASTE THIS ENTIRE FILE
//
// FIX: Replaced password auth with magic link (OTP).
//      Expats on day 1 in a foreign country cannot remember passwords.
//      Magic link = zero-friction: enter email, check phone, done.
//      Falls back gracefully if email doesn't arrive (resend button).
// ════════════════════════════════════════════════════════════════════════════
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const GREEN        = '#4ade80'
const GREEN_DIM    = '#0f2a1a'
const GREEN_BORDER = '#1a3a1f'

type Stage = 'enter_email' | 'check_email'

export default function Login() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [stage,   setStage]   = useState<Stage>('enter_email')

  const handleSendLink = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        shouldCreateUser: false,   // login only — signup is separate
      },
    })

    setLoading(false)

    if (err) {
      // "User not found" surfaces as a generic error — give a helpful message
      if (err.message.toLowerCase().includes('not found') || err.status === 422) {
        setError("No account found with that email. Please sign up first.")
      } else {
        setError(err.message)
      }
    } else {
      setStage('check_email')
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')
    await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, shouldCreateUser: false },
    })
    setLoading(false)
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
      `}</style>

      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '56px', height: '56px', background: GREEN_DIM, border: `1px solid ${GREEN_BORDER}`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '22px', color: GREEN }}>✦</div>
          <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            {stage === 'enter_email' ? 'Welcome back' : 'Check your email'}
          </h1>
          <p style={{ color: '#555', fontSize: '15px', margin: 0 }}>
            {stage === 'enter_email'
              ? 'Enter your email — we\'ll send a one-click sign-in link.'
              : `We sent a magic link to ${email}`}
          </p>
        </div>

        {/* ── STAGE 1: Enter email ── */}
        {stage === 'enter_email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', color: '#555', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Email address
              </label>
              <input
                className="input-field"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendLink()}
                autoFocus
                style={{ width: '100%', padding: '14px 16px', background: '#111', border: '1px solid #222', borderRadius: '12px', color: '#fff', fontSize: '15px', fontFamily: 'inherit' }}
              />
            </div>

            {error && (
              <div style={{ background: '#1a0808', border: '1px solid #3a1010', borderRadius: '10px', padding: '12px 16px' }}>
                <p style={{ color: '#f87171', fontSize: '14px', margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleSendLink}
              disabled={loading || !email.trim()}
              style={{ width: '100%', padding: '16px', background: !email.trim() ? '#111' : GREEN, color: !email.trim() ? '#333' : '#050f06', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: !email.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >
              {loading ? 'Sending link...' : 'Send magic link →'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#111' }} />
              <span style={{ color: '#333', fontSize: '12px' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#111' }} />
            </div>

            <p style={{ color: '#444', fontSize: '14px', textAlign: 'center', margin: 0 }}>
              Don&apos;t have an account?{' '}
              <a href="/auth/signup" style={{ color: GREEN, fontWeight: '600', textDecoration: 'none' }}>Sign up</a>
            </p>
          </div>
        )}

        {/* ── STAGE 2: Check email ── */}
        {stage === 'check_email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email icon */}
            <div style={{ background: GREEN_DIM, border: `1px solid ${GREEN_BORDER}`, borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
              <p style={{ color: GREEN, fontWeight: '700', fontSize: '15px', marginBottom: '6px' }}>Magic link sent!</p>
              <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.6 }}>
                Click the link in your email to sign in instantly. No password needed.
              </p>
            </div>

            {/* Tips */}
            <div style={{ background: '#0e0e0e', border: '1px solid #111', borderRadius: '12px', padding: '16px' }}>
              <p style={{ color: '#333', fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'DM Mono, monospace' }}>Didn&apos;t get it?</p>
              {['Check your spam/junk folder', 'The link expires in 1 hour', 'Make sure you used your work email'].map(tip => (
                <div key={tip} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color: '#2a2a2a', fontSize: '14px' }}>·</span>
                  <span style={{ color: '#444', fontSize: '13px' }}>{tip}</span>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ background: '#1a0808', border: '1px solid #3a1010', borderRadius: '10px', padding: '12px 16px' }}>
                <p style={{ color: '#f87171', fontSize: '14px', margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={loading}
              style={{ width: '100%', padding: '14px', background: 'transparent', border: `1px solid ${GREEN_BORDER}`, color: GREEN, borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Resending...' : 'Resend magic link'}
            </button>

            <button
              onClick={() => { setStage('enter_email'); setError('') }}
              style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: '#444', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              ← Use a different email
            </button>
          </div>
        )}
      </div>

      <p style={{ marginTop: '40px', color: '#1a1a1a', fontSize: '13px' }}>© 2026 Glotto</p>
    </div>
  )
}