'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentMission } from '@/lib/data/missions'
import MissionChat from '@/components/MissionChat'

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: '#60a5fa', Easy: '#34d399', Medium: '#fbbf24', Hard: '#f97316', Expert: '#f87171',
}

function MissionPageContent() {
  const [userId, setUserId] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const day = parseInt(searchParams.get('day') || '1', 10)
  const mission = getCurrentMission(day)
  const diffColor = DIFFICULTY_COLOR[mission.difficulty] || '#4ade80'

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
    }
    getUser()
  }, [])

  if (!userId) return (
    <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#4ade80', fontSize: '15px', fontFamily: 'monospace' }}>Loading mission...</div>
    </div>
  )

  if (!started) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.4)}60%{box-shadow:0 0 0 8px rgba(74,222,128,0)}}
        .fade-up{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) forwards}
        .btn-start{transition:all .18s ease;border:none;cursor:pointer;font-family:inherit}
        .btn-start:hover{transform:translateY(-2px);box-shadow:0 20px 48px rgba(74,222,128,.4)!important}
        .pulse{animation:pulseGlow 2.5s ease infinite}
      `}</style>
      <div className="fade-up" style={{ maxWidth: '560px', width: '100%' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#333', fontSize: '13px', cursor: 'pointer', marginBottom: '40px', padding: 0, fontFamily: 'monospace' }}>
          ← Back to dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{ background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: '20px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pulse" style={{ display: 'inline-block', width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', flexShrink: 0 }} />
            <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: '700', letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: 'monospace' }}>Day {mission.day} · Survival Mission</span>
          </div>
          <div style={{ background: `${diffColor}15`, border: `1px solid ${diffColor}40`, borderRadius: '20px', padding: '6px 16px' }}>
            <span style={{ color: diffColor, fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: 'monospace' }}>{mission.difficulty}</span>
          </div>
        </div>
        <h1 style={{ color: '#fff', fontSize: '52px', fontWeight: '900', letterSpacing: '-3px', lineHeight: 1.0, marginBottom: '24px' }}>{mission.title}</h1>
        <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px', marginBottom: '36px' }}>
          <p style={{ color: '#444', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: '12px' }}>Your objective</p>
          <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '16px', lineHeight: 1.7, margin: 0 }}>{mission.objective}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
          {['Stay in character — the simulation is real', 'Speak only in your target language', 'Complete the objective to pass'].map((rule, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '20px', height: '20px', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#4ade80', fontSize: '10px', fontWeight: '800' }}>{i + 1}</span>
              </div>
              <p style={{ color: '#444', fontSize: '13px', margin: 0, fontFamily: 'monospace' }}>{rule}</p>
            </div>
          ))}
        </div>
        <button className="btn-start" onClick={() => setStarted(true)} style={{ background: '#4ade80', color: '#050f06', borderRadius: '14px', padding: '16px 36px', fontSize: '16px', fontWeight: '900', letterSpacing: '-0.4px', width: '100%', boxShadow: '0 8px 32px rgba(74,222,128,.25)' }}>
          Enter the Simulation →
        </button>
        <p style={{ color: '#1a1a1a', fontSize: '11px', textAlign: 'center', marginTop: '16px', fontFamily: 'monospace' }}>~10 minutes · +50 XP on completion</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#333', fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: 'monospace' }}>← Exit mission</button>
          <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'monospace' }}>Day {mission.day} · {mission.title}</span>
        </div>
        <MissionChat userId={userId} mission={mission} />
      </div>
    </div>
  )
}

export default function MissionPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#4ade80', fontSize: '15px', fontFamily: 'monospace' }}>Loading...</div></div>}>
      <MissionPageContent />
    </Suspense>
  )
}