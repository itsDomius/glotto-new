'use client'
import React from 'react'
import { supabase } from '@/lib/supabase'

export default function StreakCalendar({ userId }: { userId: string }) {
  const [activeDays, setActiveDays] = React.useState<Set<string>>(new Set())
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const load = async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

      const { data } = await supabase
        .from('sessions')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo)

      const days = new Set<string>(
        (data || []).map(s => s.created_at.split('T')[0])
      )
      setActiveDays(days)
      setLoading(false)
    }
    load()
  }, [userId])

  // Build last 30 days
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000)
    const key = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en', { weekday: 'short' }).charAt(0)
    const isToday = key === new Date().toISOString().split('T')[0]
    return { key, label, isToday }
  })

  if (loading) return (
    <div style={{ height: '80px', background: '#111', borderRadius: '12px' }} />
  )

  return (
    <div style={{ background: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1a1a1a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>Practice streak</span>
        <span style={{ color: '#555', fontSize: '13px' }}>Last 30 days</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: '3px' }}>
        {days.map(day => (
          <div key={day.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '100%', aspectRatio: '1',
              borderRadius: '4px',
              background: activeDays.has(day.key) ? '#4ade80' : '#1a1a1a',
              border: day.isToday ? '1px solid #4ade80' : '1px solid transparent',
              transition: 'all 0.2s'
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <span style={{ color: '#333', fontSize: '11px' }}>30 days ago</span>
        <span style={{ color: '#333', fontSize: '11px' }}>Today</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#1a1a1a' }} />
        <span style={{ color: '#333', fontSize: '12px' }}>No practice</span>
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#4ade80', marginLeft: '8px' }} />
        <span style={{ color: '#333', fontSize: '12px' }}>Practiced</span>
      </div>
    </div>
  )
}