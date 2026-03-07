'use client'

import { useState } from 'react'

export default function StakeButton() {
  const [loading, setLoading] = useState(false)

  const handleStake = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      console.error('Stake checkout error:', err)
      alert(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleStake}
      disabled={loading}
      className="px-6 py-3 rounded-full font-bold bg-white text-black hover:bg-gray-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? 'Redirecting…' : 'Stake €10'}
    </button>
  )
}
