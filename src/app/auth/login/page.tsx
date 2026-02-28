'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
    <main className="min-h-screen bg-[#1A1814] flex flex-col items-center justify-center px-6">
      <div className="mb-8 flex flex-col items-center gap-4">
        <img src="/logo.png" alt="Glotto" className="w-16 h-16 object-contain brightness-0 invert" />
        <h1 className="text-3xl font-bold text-white">Welcome back</h1>
        <p className="text-gray-400 text-sm">Continue your language journey</p>
      </div>
      <div className="w-full max-w-md flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#2A2825] text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-green-600"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#2A2825] text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-green-600"
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        {message && (
          <p className="text-center text-sm text-red-400">{message}</p>
        )}
        <p className="text-center text-gray-500 text-sm">
          Do not have an account?{' '}
          <Link href="/auth/signup" className="text-green-500 hover:text-green-400">
            Create one
          </Link>
        </p>
      </div>
    </main>
  )
}