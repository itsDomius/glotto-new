// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/mission/page.tsx
// ════════════════════════════════════════════════════════════════════════════
'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentMission, isPaywalled } from '@/lib/data/missions'
import MissionChat from '@/components/MissionChat'

const DIFF_COLOR: Record<string, string> = {
  Beginner: '#60a5fa',
  Easy: '#34d399',
  Medium: '#fbbf24',
  Hard: '#f97316',
  Expert: '#f87171',
}

function MissionPageContent() {
  const [userId, setUserId] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [isPaidUser, setIsPaidUser] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const day = parseInt(searchParams.get('day') || '1', 10)
  const mission = getCurrentMission(day)
  const diffColor = DIFF_COLOR[mission.difficulty] || '#4ade80'
  const locked = isPaywalled(mission.day) && !isPaidUser

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, staked_amount')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        const paid =
          profile.subscription_status === 'active' ||
          (profile.staked_amount != null && profile.staked_amount > 0)
        setIsPaidUser(paid)
      }
    }
    init()
  }, [router])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!userId) return (
    <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#4ade80', fontSize: '15px', fontFamily: 'monospace' }}>Loading mission...</div>
    </div>
  )

  // ── Briefing screen ──────────────────────────────────────────────────────
  if (!started) return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.4)}60%{box-shadow:0 0 0 8px rgba(74,222,128,0)} }
        .fade-up { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) forwards; }
        .btn-start { transition: all .18s ease; border: none; cursor: pointer; font-family: inherit; }
        .btn-start:hover { transform: translateY(-2px); box-shadow: 0 20px 48px rgba(74,222,128,.4) !important; }
        .pulse { animation: pulseGlow 2.5s ease infinite; }
      `}</style>

      <div className="fade-up" style={{ maxWidth: '580px', width: '100%' }}>

        {/* Back */}
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', color: '#333', fontSize: '13px', cursor: 'pointer', marginBottom: '36px', padding: 0, fontFamily: '"DM Mono", monospace' }}
        >
          ← Back to dashboard
        </button>

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: '20px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pulse" style={{ display: 'inline-block', width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', flexShrink: 0 }} />
            <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace' }}>
              Day {mission.day} · Survival Mission
            </span>
          </div>
          <div style={{ background: `${diffColor}15`, border: `1px solid ${diffColor}40`, borderRadius: '20px', padding: '6px 16px' }}>
            <span style={{ color: diffColor, fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace' }}>
              {mission.difficulty}
            </span>
          </div>
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '6px 14px' }}>
            <span style={{ color: '#555', fontSize: '11px', fontWeight: '600', fontFamily: '"DM Mono", monospace' }}>
              {mission.category}
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ color: '#fff', fontSize: '52px', fontWeight: '900', letterSpacing: '-2.5px', lineHeight: 1.0, marginBottom: '20px' }}>
          {mission.title}
        </h1>

        {/* Objective */}
        <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px', marginBottom: '14px' }}>
          <p style={{ color: '#444', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace', marginBottom: '10px' }}>
            Your objective
          </p>
          <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '16px', lineHeight: 1.7, margin: 0 }}>
            {mission.objective}
          </p>
        </div>

        {/* NPC Persona */}
        <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '16px 18px', marginBottom: '28px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#111', border: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
            🎭
          </div>
          <div>
            <p style={{ color: '#333', fontSize: '10px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace', marginBottom: '4px' }}>
              You are talking to
            </p>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
              {mission.npc_persona}
            </p>
          </div>
        </div>

        {/* Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          {[
            'Stay in character — the simulation is real',
            'Speak only in your target language',
            'Follow the correct process to pass — language alone is not enough',
          ].map((rule, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '20px', height: '20px', background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#4ade80', fontSize: '10px', fontWeight: '800' }}>{i + 1}</span>
              </div>
              <p style={{ color: '#444', fontSize: '13px', margin: 0, fontFamily: '"DM Mono", monospace' }}>{rule}</p>
            </div>
          ))}
        </div>

        {/* Locked or Start */}
        {locked ? (
          <div>
            <div style={{ background: '#1a0a00', border: '1px solid #3a1a00', borderRadius: '14px', padding: '20px', marginBottom: '14px', textAlign: 'center' }}>
              <p style={{ color: '#fb923c', fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>🔒 Mission {mission.day} requires a plan</p>
              <p style={{ color: '#555', fontSize: '13px', lineHeight: 1.6 }}>
                Missions 1 & 2 are free. From Day 3 you need Full Access or a Commitment Stake.
              </p>
            </div>
            <button
              className="btn-start"
              onClick={() => router.push('/pricing')}
              style={{ background: '#fb923c', color: '#0a0500', borderRadius: '14px', padding: '16px 36px', fontSize: '16px', fontWeight: '900', letterSpacing: '-0.4px', width: '100%', boxShadow: '0 8px 32px rgba(251,146,60,.2)' }}
            >
              Unlock All Missions →
            </button>
          </div>
        ) : (
          <>
            <button
              className="btn-start"
              onClick={() => setStarted(true)}
              style={{ background: '#4ade80', color: '#050f06', borderRadius: '14px', padding: '16px 36px', fontSize: '16px', fontWeight: '900', letterSpacing: '-0.4px', width: '100%', boxShadow: '0 8px 32px rgba(74,222,128,.2)' }}
            >
              Enter the Simulation →
            </button>
            <p style={{ color: '#1a1a1a', fontSize: '11px', textAlign: 'center', marginTop: '14px', fontFamily: '"DM Mono", monospace' }}>
              ~10 minutes · +50 XP on completion
            </p>
          </>
        )}
      </div>
    </div>
  )

  // ── Active mission (chat) ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }`}</style>
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#333', fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: '"DM Mono", monospace' }}
          >
            ← Exit mission
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace' }}>
              Day {mission.day} · {mission.title}
            </span>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s ease infinite' }} />
          </div>
        </div>

        {/* Chat */}
        <div style={{ background: '#0e0e0e', border: '1px solid #111', borderRadius: '20px', overflow: 'hidden', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          <MissionChat
            userId={userId}
            mission={mission}
            isPaidUser={isPaidUser}
          />
        </div>
      </div>
    </div>
  )
}

export default function MissionPage() {
  return (
    <Suspense fallback={
      <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#4ade80', fontSize: '15px', fontFamily: 'monospace' }}>Loading...</div>
      </div>
    }>
      <MissionPageContent />
    </Suspense>
  )
}