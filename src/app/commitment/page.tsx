'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const GREEN = '#4ade80'
const GREEN_DIM = '#0f2a1a'
const GREEN_BORDER = '#1a3a1f'

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
      <div style={{
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '64px', marginBottom: '24px' }}>🏆</p>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', margin: '0 0 12px' }}>Commitment made.</h1>
          <p style={{ color: '#555', fontSize: '15px', margin: 0 }}>We'll hold you to it. Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px', borderBottom: '1px solid #111',
      }}>
        <span style={{ color: GREEN, fontWeight: '800', fontSize: '20px' }}>Glotto</span>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', color: '#444', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ← Back to dashboard
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '520px' }}>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{ fontSize: '52px', marginBottom: '16px' }}>🤝</p>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', margin: '0 0 12px' }}>Make your commitment</h1>
            <p style={{ color: '#555', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
              Users who set a commitment are{' '}
              <span style={{ color: '#fff', fontWeight: '700' }}>40% more likely</span>{' '}
              to reach their goal. What will you commit to this month?
            </p>
          </div>

          {/* Goal selection */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ color: '#888', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
              How many sessions per week?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {GOALS.map(goal => {
                const selected = selectedGoal === goal.value
                return (
                  <button key={goal.value} onClick={() => setSelectedGoal(goal.value)} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '18px 20px', borderRadius: '14px',
                    background: selected ? GREEN_DIM : '#0e0e0e',
                    border: `1px solid ${selected ? GREEN_BORDER : '#1a1a1a'}`,
                    cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: '24px', flexShrink: 0 }}>{goal.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: selected ? GREEN : '#fff', fontWeight: '700', fontSize: '15px', margin: '0 0 2px' }}>{goal.label}</p>
                      <p style={{ color: selected ? '#4ade8088' : '#444', fontSize: '13px', margin: 0 }}>{goal.description}</p>
                    </div>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${selected ? GREEN : '#2a2a2a'}`,
                      background: selected ? GREEN : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#050f06' }} />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stake selection */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ color: '#888', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
              What's your stake if you miss?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {STAKES.map(stake => {
                const selected = selectedStake === stake.value
                return (
                  <button key={stake.value} onClick={() => setSelectedStake(stake.value)} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '18px 20px', borderRadius: '14px',
                    background: selected ? GREEN_DIM : '#0e0e0e',
                    border: `1px solid ${selected ? GREEN_BORDER : '#1a1a1a'}`,
                    cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: '24px', flexShrink: 0 }}>{stake.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: selected ? GREEN : '#fff', fontWeight: '700', fontSize: '15px', margin: '0 0 2px' }}>{stake.label}</p>
                      <p style={{ color: selected ? '#4ade8088' : '#444', fontSize: '13px', margin: 0 }}>{stake.description}</p>
                    </div>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${selected ? GREEN : '#2a2a2a'}`,
                      background: selected ? GREEN : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#050f06' }} />}
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedStake === 'friend' && (
              <div style={{ marginTop: '10px' }}>
                <input
                  type="email"
                  placeholder="Friend's email address"
                  value={friendEmail}
                  onChange={e => setFriendEmail(e.target.value)}
                  style={{
                    width: '100%', background: '#0e0e0e', border: '1px solid #1a1a1a',
                    borderRadius: '14px', padding: '14px 18px', color: '#fff',
                    fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = GREEN}
                  onBlur={e => e.target.style.borderColor = '#1a1a1a'}
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSave}
            disabled={!selectedGoal || !selectedStake || loading}
            style={{
              width: '100%', padding: '18px',
              background: selectedGoal && selectedStake ? GREEN : '#0e0e0e',
              color: selectedGoal && selectedStake ? '#050f06' : '#2a2a2a',
              border: `1px solid ${selectedGoal && selectedStake ? GREEN : '#1a1a1a'}`,
              borderRadius: '14px', fontSize: '16px', fontWeight: '800',
              cursor: !selectedGoal || !selectedStake || loading ? 'not-allowed' : 'pointer',
              opacity: !selectedGoal || !selectedStake ? 0.4 : 1,
              transition: 'all 0.2s', fontFamily: 'inherit',
              boxShadow: selectedGoal && selectedStake ? '0 4px 24px rgba(74,222,128,0.2)' : 'none',
            }}
          >
            {loading ? 'Saving your commitment...' : 'Make my commitment →'}
          </button>

          <p style={{ color: '#2a2a2a', fontSize: '13px', textAlign: 'center', marginTop: '16px' }}>
            You can update your commitment at any time from your dashboard
          </p>

        </div>
      </div>
    </div>
  )
}