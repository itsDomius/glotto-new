'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const GOALS = [
  { value: '3', label: '3 sessions per week', description: 'Casual — perfect for busy schedules', emoji: '🌱' },
  { value: '5', label: '5 sessions per week', description: 'Recommended — steady progress', emoji: '🔥' },
  { value: '7', label: 'Every single day', description: 'Intensive — fastest results', emoji: '⚡' },
]

const STAKES = [
  { value: 'personal', label: 'Personal commitment', description: 'Just between you and Glotto', emoji: '🤝' },
  { value: 'charity', label: 'Donate to charity', description: '€5 goes to a good cause if you miss your goal', emoji: '❤️' },
  { value: 'friend', label: 'Friend accountability', description: 'A friend gets notified if you miss', emoji: '👥' },
]

export default function CommitmentPage() {
  const [selectedGoal, setSelectedGoal] = useState('')
  const [selectedStake, setSelectedStake] = useState('')
  const [friendEmail, setFriendEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!selectedGoal || !selectedStake) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const monthYear = `${now.getMonth() + 1}-${now.getFullYear()}`

    await supabase.from('commitments').upsert({
      user_id: user.id,
      goal_type: 'sessions_per_week',
      goal_value: parseInt(selectedGoal),
      stake_type: selectedStake,
      stake_value: selectedStake === 'friend' ? friendEmail : '',
      month_year: monthYear,
      achieved: false,
    })

    setLoading(false)
    setSaved(true)

    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (saved) {
    return (
      <main className="min-h-screen bg-[#f5f4f0] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-6xl mb-6">🏆</p>
          <h1 className="text-3xl font-bold text-[#111111] mb-3">Commitment made.</h1>
          <p className="text-gray-500">We'll hold you to it. Redirecting to your dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f4f0] flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Glotto" className="w-7 h-7 object-contain" />
          <span className="font-bold text-[#111111] text-lg">Glotto</span>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
        >
          ← Back to dashboard
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl">

          {/* Title */}
          <div className="text-center mb-10">
            <p className="text-5xl mb-4">🤝</p>
            <h1 className="text-3xl font-bold text-[#111111] mb-3">Make your commitment</h1>
            <p className="text-gray-500 leading-relaxed">
              Users who set a commitment are <span className="font-semibold text-[#111111]">40% more likely</span> to reach their goal. What will you commit to this month?
            </p>
          </div>

          {/* Goal Selection */}
          <div className="mb-8">
            <h2 className="text-[#111111] font-bold mb-4">How many sessions per week?</h2>
            <div className="flex flex-col gap-3">
              {GOALS.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => setSelectedGoal(goal.value)}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    selectedGoal === goal.value
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-gray-200 bg-white text-[#111111] hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{goal.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{goal.label}</p>
                    <p className={`text-sm mt-0.5 ${selectedGoal === goal.value ? 'text-gray-300' : 'text-gray-500'}`}>
                      {goal.description}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedGoal === goal.value ? 'border-white bg-white' : 'border-gray-300'
                  }`}>
                    {selectedGoal === goal.value && <div className="w-2.5 h-2.5 rounded-full bg-[#111111]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stake Selection */}
          <div className="mb-8">
            <h2 className="text-[#111111] font-bold mb-4">What's your stake if you miss?</h2>
            <div className="flex flex-col gap-3">
              {STAKES.map((stake) => (
                <button
                  key={stake.value}
                  onClick={() => setSelectedStake(stake.value)}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    selectedStake === stake.value
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-gray-200 bg-white text-[#111111] hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{stake.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{stake.label}</p>
                    <p className={`text-sm mt-0.5 ${selectedStake === stake.value ? 'text-gray-300' : 'text-gray-500'}`}>
                      {stake.description}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedStake === stake.value ? 'border-white bg-white' : 'border-gray-300'
                  }`}>
                    {selectedStake === stake.value && <div className="w-2.5 h-2.5 rounded-full bg-[#111111]" />}
                  </div>
                </button>
              ))}
            </div>

            {/* Friend email input */}
            {selectedStake === 'friend' && (
              <div className="mt-3">
                <input
                  type="email"
                  placeholder="Friend's email address"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSave}
            disabled={!selectedGoal || !selectedStake || loading}
            className="w-full py-4 rounded-2xl bg-[#111111] text-white font-bold text-base hover:bg-[#222222] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving your commitment...' : 'Make my commitment →'}
          </button>

          <p className="text-gray-400 text-xs text-center mt-4">
            You can update your commitment at any time from your dashboard
          </p>

        </div>
      </div>
    </main>
  )
}
