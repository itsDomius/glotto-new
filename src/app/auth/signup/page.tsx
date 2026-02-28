'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSignUp = async () => {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email to confirm your account!')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#1A1814] flex flex-col items-center justify-center px-6">
      <div className="mb-8 flex flex-col items-center gap-4">
        <img src="/logo.png" alt="Glotto" className="w-16 h-16 object-contain brightness-0 invert" />
        <h1 className="text-3xl font-bold text-white">Create your account</h1>
        <p className="text-gray-400 text-sm">Start your language journey today</p>
      </div>
      <div className="w-full max-w-md flex flex-col gap-4">
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#2A2825] text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-green-600"
        />
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
          onClick={handleSignUp}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        {message && (
          <p className="text-center text-sm text-green-400">{message}</p>
        )}
        <p className="text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-green-500 hover:text-green-400">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}