'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LexChat from '@/components/LexChat'

export default function TutorPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionMinutes, setSessionMinutes] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
    }
    getUser()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setSessionMinutes(prev => prev + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  if (!userId) return (
    <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#4ade80', fontSize: '15px' }}>Loading Lex...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#111111' }}>

      {/* Sidebar */}
      <div style={{ width: '240px', background: '#0a0a0a', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px', marginBottom: '32px' }}>
          <img src="/logo.png" alt="Glotto" style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <span style={{ color: '#fff', fontWeight: '800', fontSize: '18px' }}>Glotto</span>
        </div>

        <div style={{ background: '#141414', borderRadius: '16px', padding: '16px', marginBottom: '16px', border: '1px solid #1f1f1f' }}>
          <p style={{ color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Session</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#555', fontSize: '13px' }}>Duration</span>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>{sessionMinutes} min</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#555', fontSize: '13px' }}>XP earned</span>
            <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '600' }}>+{sessionMinutes * 5} XP</span>
          </div>
        </div>

        <div style={{ background: '#0f1f14', borderRadius: '16px', padding: '16px', marginBottom: '16px', border: '1px solid #1a3a1f' }}>
          <p style={{ color: '#4ade80', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Today's Mission</p>
          <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', lineHeight: 1.4 }}>Have a real conversation with Lex</p>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => router.push('/dashboard')}
          style={{ color: '#444', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '8px' }}
        >
          ← Back to dashboard
        </button>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#141414', border: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✦</div>
          <div>
            <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '18px', margin: 0 }}>Lex</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
              <span style={{ color: '#555', fontSize: '12px' }}>Online · Adapting to your level</span>
            </div>
          </div>
        </div>

        <LexChat userId={userId} />
      </div>
    </div>
  )
}