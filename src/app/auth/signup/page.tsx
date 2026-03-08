// v3 - with Stripe redirect
'use client'

import { useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const GREEN = '#4ade80'
const GREEN_DIM = '#0f2a1a'
const GREEN_BORDER = '#1a3a1f'

function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const plan = searchParams.get('plan')
  const billing = searchParams.get('billing') || 'monthly'

  const handleSignUp = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (plan && data.user) {
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan,
            billing,
            userId: data.user.id,
            email: data.user.email,
          }),
        })
        const result = await res.json()
        if (result.url) {
          window.location.href = result.url
          return
        }
      } catch (err) {
        console.error('Stripe redirect failed:', err)
      }
    }

    router.push('/onboarding')
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: GREEN_DIM, border: `1px solid ${GREEN_BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '22px',
        }}>✦</div>
        <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '800', margin: '0 0 8px' }}>
          Create your account
        </h1>
        <p style={{ color: '#555', fontSize: '15px', margin: 0 }}>
          {plan
            ? `You're signing up for the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`
            : 'Start speaking your language in 7 days'}
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ color: '#555', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>Full name</label>
          <input type="text" placeholder="Your first name" value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '14px 18px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = GREEN} onBlur={e => e.target.style.borderColor = '#1a1a1a'} />
        </div>
        <div>
          <label style={{ color: '#555', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '14px 18px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = GREEN} onBlur={e => e.target.style.borderColor = '#1a1a1a'} />
        </div>
        <div>
          <label style={{ color: '#555', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>Password</label>
          <input type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignUp()}
            style={{ width: '100%', background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '14px 18px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = GREEN} onBlur={e => e.target.style.borderColor = '#1a1a1a'} />
        </div>

        {error && (
          <div style={{ background: '#1a0a0a', border: '1px solid #3a1010', borderRadius: '10px', padding: '12px 16px' }}>
            <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0 }}>{error}</p>
          </div>
        )}

        <button onClick={handleSignUp} disabled={loading || !email || !password || !name}
          style={{
            width: '100%', padding: '16px',
            background: loading || !email || !password || !name ? '#0e0e0e' : GREEN,
            color: loading || !email || !password || !name ? '#333' : '#050f06',
            border: `1px solid ${loading || !email || !password || !name ? '#1a1a1a' : GREEN}`,
            borderRadius: '12px', fontSize: '16px', fontWeight: '800',
            cursor: loading || !email || !password || !name ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', fontFamily: 'inherit', marginTop: '4px',
            boxShadow: !loading && email && password && name ? '0 4px 24px rgba(74,222,128,0.2)' : 'none',
          }}>
          {loading
            ? (plan ? 'Setting up your account...' : 'Creating account...')
            : (plan ? 'Create account & pay →' : 'Create account →')}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#111' }} />
          <span style={{ color: '#333', fontSize: '12px' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#111' }} />
        </div>

        <p style={{ color: '#444', fontSize: '14px', textAlign: 'center', margin: 0 }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: GREEN, fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
        </p>
        <p style={{ color: '#222', fontSize: '12px', textAlign: 'center', margin: '4px 0 0' }}>
          No credit card required · 7-day guarantee · Cancel anytime
        </p>
      </div>
    </div>
  )
}

export default function SignUp() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#555', fontSize: '15px' }}>Loading...</div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}