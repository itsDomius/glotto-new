'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const GREEN = '#4ade80'
const GREEN_DIM = '#0f2a1a'
const GREEN_BORDER = '#1a3a1f'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) {
      setMessage(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Logo & Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: GREEN_DIM,
          border: `1px solid ${GREEN_BORDER}`,
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <span style={{ fontSize: '24px' }}>✦</span>
        </div>
        <h1 style={{
          color: '#fff',
          fontSize: '28px',
          fontWeight: '700',
          margin: '0 0 8px',
        }}>
          Welcome back
        </h1>
        <p style={{ color: '#555', fontSize: '15px', margin: 0 }}>
          Continue your language journey
        </p>
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#666',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}>
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#111',
              border: '1px solid #222',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => e.target.style.borderColor = GREEN}
            onBlur={(e) => e.target.style.borderColor = '#222'}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            color: '#666',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}>
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#111',
              border: '1px solid #222',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => e.target.style.borderColor = GREEN}
            onBlur={(e) => e.target.style.borderColor = '#222'}
          />
        </div>

        {message && (
          <div style={{
            background: '#1a0a0a',
            border: '1px solid #2a1010',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
          }}>
            <p style={{ color: '#ff6b6b', fontSize: '14px', margin: 0 }}>{message}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            background: GREEN,
            color: '#050f06',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            marginBottom: '20px',
          }}
        >
          {loading ? 'Signing in...' : 'Sign in →'}
        </button>

        <p style={{
          textAlign: 'center',
          color: '#444',
          fontSize: '14px',
          margin: 0,
        }}>
          Don't have an account?{' '}
          <button
            onClick={() => router.push('/auth/signup')}
            style={{
              background: 'none',
              border: 'none',
              color: GREEN,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Sign up
          </button>
        </p>
      </div>

      {/* Footer */}
      <p style={{
        position: 'absolute',
        bottom: '24px',
        color: '#222',
        fontSize: '13px',
      }}>
        © 2026 Glotto
      </p>
    </div>
  )
}