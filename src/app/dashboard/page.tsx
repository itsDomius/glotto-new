'use client'
import React from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import LanguageFitnessScore from '@/components/LanguageFitnessScore'
import ForgettingCurve from '@/components/ForgettingCurve'
import { getCurrentMission } from '@/lib/data/missions'

const Icons = {
  home: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  learn: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
  tutor: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  progress: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  rewards: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  settings: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  fire: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-7 7 7 7 0 01-7-7c0-1.507.332-2.585.5-3.5.573.687 1.5 1.5 2.5 1.5z"/></svg>,
  bolt: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  clock: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  book: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  target: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  trophy: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4v3a5 5 0 0010 0V4"/><line x1="1" y1="4" x2="23" y2="4"/></svg>,
  message: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  signout: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  lock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  arrow: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  heart: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
}

const TABS = [
  { id: 'home', label: 'Home', Icon: Icons.home },
  { id: 'learn', label: 'Learn', Icon: Icons.learn },
  { id: 'tutor', label: 'Tutor', Icon: Icons.tutor },
  { id: 'progress', label: 'Progress', Icon: Icons.progress },
  { id: 'rewards', label: 'Rewards', Icon: Icons.rewards },
]

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: '#60a5fa',
  Easy: '#34d399',
  Medium: '#fbbf24',
  Hard: '#f97316',
  Expert: '#f87171',
}

const langFlags: Record<string, string> = {
  english: '🇬🇧', spanish: '🇪🇸', french: '🇫🇷', german: '🇩🇪',
  italian: '🇮🇹', portuguese: '🇵🇹', japanese: '🇯🇵', mandarin: '🇨🇳',
}

export default function Dashboard() {
  const [user, setUser] = React.useState<any>(null)
  const [profile, setProfile] = React.useState<any>(null)
  const [streak, setStreak] = React.useState<any>(null)
  const [personalBests, setPersonalBests] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState('home')
  const [tabKey, setTabKey] = React.useState(0)
  const [minutesToday, setMinutesToday] = React.useState(0)
  const [totalSessions, setTotalSessions] = React.useState(0)
  const router = useRouter()

  React.useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (!p || !p.onboarding_complete) { router.push('/onboarding'); return }
      setProfile(p)

      const { data: s } = await supabase.from('streaks').select('*').eq('user_id', user.id).single()
      setStreak(s)

      const { data: pb } = await supabase.from('personal_bests').select('*').eq('user_id', user.id).single()
      setPersonalBests(pb)

      const today = new Date().toISOString().split('T')[0]
      const { data: todaySessions } = await supabase
        .from('sessions').select('duration_seconds').eq('user_id', user.id).gte('created_at', today)
      const mins = Math.floor((todaySessions || []).reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / 60)

      const { count: sessCount } = await supabase
        .from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

      setMinutesToday(mins)
      setTotalSessions(sessCount || 0)
      setLoading(false)
    }
    load()
  }, [router])

  const go = (tab: string) => { setActiveTab(tab); setTabKey(k => k + 1) }
  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#4ade80', animation: 'spin .8s linear infinite' }} />
    </main>
  )

  const name = user?.user_metadata?.full_name?.split(' ')[0] || profile?.full_name?.split(' ')[0] || 'there'
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  const curStreak = streak?.current_streak || 0
  const bestStreak = streak?.longest_streak || 0
  const lang = profile?.target_language || 'spanish'
  const level = profile?.current_level || 'A1'
  const levelName: Record<string, string> = { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper Intermediate', C1: 'Advanced', C2: 'Mastery' }

  const userDay = Math.max(1, totalSessions + 1)
  const mission = getCurrentMission(userDay)
  const diffColor = DIFFICULTY_COLOR[mission.difficulty] || '#4ade80'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{font-family:'DM Sans',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.4)}60%{box-shadow:0 0 0 8px rgba(74,222,128,0)}}
        @keyframes shimmerBg{0%,100%{opacity:.07}50%{opacity:.13}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .tab-in{animation:fadeUp .2s cubic-bezier(.16,1,.3,1) forwards}
        .nav-item{transition:all .15s ease;border:none;cursor:pointer;text-align:left;font-family:'DM Sans',sans-serif;width:100%;display:flex;align-items:center}
        .nav-item:hover{background:#141414!important;color:#ccc!important}
        .btn-green{transition:all .18s ease;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
        .btn-green:hover{transform:translateY(-2px);box-shadow:0 20px 48px rgba(74,222,128,.4)!important}
        .btn-green:active{transform:scale(.98)}
        .btn-purple{transition:all .18s ease;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
        .btn-purple:hover{transform:translateY(-2px);box-shadow:0 16px 44px rgba(139,92,246,.5)!important}
        .btn-secondary{transition:all .15s ease;cursor:pointer;font-family:'DM Sans',sans-serif}
        .btn-secondary:hover{background:#1c1c1c!important;border-color:#2a2a2a!important}
        .stat-card{transition:all .2s ease}
        .stat-card:hover{transform:translateY(-3px)}
        .chain-node{transition:all .2s cubic-bezier(.34,1.56,.64,1)}
        .chain-node:hover{transform:scale(1.25)}
        .quick-card{transition:all .2s ease;cursor:pointer}
        .quick-card:hover{transform:translateY(-3px);border-color:#222!important}
        .glow-card{transition:all .22s ease}
        .glow-card:hover{transform:translateY(-2px)}
        .reward-row{transition:all .15s ease}
        .reward-row:hover{background:#141414!important;border-color:#1e1e1e!important}
        .pulse{animation:pulseGlow 2.5s ease infinite}
        .orb{animation:shimmerBg 5s ease infinite}
        .sb::-webkit-scrollbar{display:none}
        .sb{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      <div className="sb" style={{ display: 'flex', height: '100vh', background: '#070707', overflow: 'hidden' }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: '224px', background: '#070707', borderRight: '1px solid rgba(255,255,255,.04)', display: 'flex', flexDirection: 'column', padding: '24px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 8px', marginBottom: '36px' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#4ade80,#22d3ee)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
            </div>
            <span style={{ color: '#fff', fontWeight: '800', fontSize: '19px', letterSpacing: '-0.6px' }}>Glotto</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
            {TABS.map(({ id, label, Icon }) => {
              const on = activeTab === id
              return (
                <button key={id} className="nav-item" onClick={() => go(id)} style={{ gap: '11px', padding: '10px 12px', borderRadius: '8px', background: on ? '#141414' : 'transparent', color: on ? '#fff' : '#363636', fontSize: '14px', fontWeight: on ? '600' : '400', position: 'relative', border: 'none' }}>
                  {on && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: '#4ade80', borderRadius: '0 3px 3px 0', boxShadow: '0 0 10px rgba(74,222,128,.6)' }} />}
                  <span style={{ opacity: on ? 1 : 0.45, color: on ? '#4ade80' : 'inherit' }}><Icon /></span>
                  {label}
                  {id === 'tutor' && <span className="pulse" style={{ marginLeft: 'auto', width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', flexShrink: 0 }} />}
                </button>
              )
            })}
            <button className="nav-item" onClick={() => router.push('/settings')} style={{ gap: '11px', padding: '10px 12px', borderRadius: '8px', background: 'transparent', color: '#363636', fontSize: '14px', fontWeight: '400', border: 'none', marginTop: '4px' }}>
              <span style={{ opacity: 0.45 }}><Icons.settings /></span> Settings
            </button>
          </nav>

          <div style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,.05)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{langFlags[lang] || '🌍'}</span>
            <div>
              <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>{lang}</p>
              <p style={{ color: '#2a2a2a', fontSize: '10px', fontFamily: 'DM Mono,monospace', letterSpacing: '.5px' }}>Level {level}</p>
            </div>
          </div>

          <div onClick={() => router.push('/settings')} style={{ borderTop: '1px solid rgba(255,255,255,.04)', paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#0f2a1a,#1a4a2e)', border: '1px solid #1f4a2e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '12px', fontWeight: '800', flexShrink: 0 }}>
              {name[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
              <p style={{ color: '#1f1f1f', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'DM Mono,monospace' }}>{user?.email}</p>
            </div>
            <button onClick={e => { e.stopPropagation(); handleSignOut() }} style={{ background: 'none', border: 'none', color: '#1f1f1f', cursor: 'pointer', padding: '4px', display: 'flex', flexShrink: 0 }}>
              <Icons.signout />
            </button>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div className="sb" style={{ flex: 1, overflowY: 'auto', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>

          {/* Topbar */}
          <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(10,10,10,.8)', backdropFilter: 'blur(32px)', borderBottom: '1px solid rgba(255,255,255,.04)', padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#252525', fontSize: '11px', letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: 'DM Mono,monospace' }}>{greeting}</p>
              <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.7px', lineHeight: 1.2 }}>{TABS.find(t => t.id === activeTab)?.label}</h1>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#0e0e0e', border: '1px solid rgba(251,146,60,.15)', borderRadius: '24px', padding: '7px 16px' }}>
                <span style={{ color: '#fb923c' }}><Icons.fire /></span>
                <span style={{ color: '#fb923c', fontSize: '13px', fontWeight: '700' }}>{curStreak}d streak</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#0e0e0e', border: '1px solid rgba(251,191,36,.15)', borderRadius: '24px', padding: '7px 16px' }}>
                <span style={{ color: '#fbbf24' }}><Icons.bolt /></span>
                <span style={{ color: '#fbbf24', fontSize: '13px', fontWeight: '700' }}>0 XP</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div key={tabKey} className="tab-in sb" style={{ flex: 1, padding: '36px 48px' }}>

            {/* ════ HOME ════ */}
            {activeTab === 'home' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '720px' }}>

                {/* ── MISSION CARD — Single CTA ── */}
                <div style={{
                  borderRadius: '24px',
                  background: 'linear-gradient(160deg, #060f07 0%, #091a0c 50%, #050c06 100%)',
                  border: '1px solid rgba(74,222,128,.15)',
                  padding: '48px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 0 80px rgba(74,222,128,.05)',
                }}>
                  <div className="orb" style={{ position: 'absolute', top: '-120px', right: '-120px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(74,222,128,.12), transparent 60%)', borderRadius: '50%', pointerEvents: 'none' }} />

                  {/* Day + difficulty badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', position: 'relative' }}>
                    <div style={{ background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: '20px', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span className="pulse" style={{ display: 'inline-block', width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', flexShrink: 0 }} />
                      <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: '700', letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: 'DM Mono,monospace' }}>
                        Day {mission.day} · Today's Mission
                      </span>
                    </div>
                    <div style={{ background: `${diffColor}15`, border: `1px solid ${diffColor}40`, borderRadius: '20px', padding: '5px 14px' }}>
                      <span style={{ color: diffColor, fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: 'DM Mono,monospace' }}>
                        {mission.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 style={{ color: '#fff', fontSize: '48px', fontWeight: '900', letterSpacing: '-2.5px', lineHeight: 1.0, marginBottom: '20px', position: 'relative' }}>
                    {mission.title}
                  </h2>

                  {/* Objective */}
                  <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '16px', lineHeight: 1.7, maxWidth: '480px', marginBottom: '40px', position: 'relative' }}>
                    {mission.objective}
                  </p>

                  {/* THE ONE CTA */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                      className="btn-green"
                      onClick={() => router.push(`/mission?day=${mission.day}`)}
                      style={{
                        background: '#4ade80',
                        color: '#050f06',
                        borderRadius: '14px',
                        padding: '16px 32px',
                        fontSize: '16px',
                        fontWeight: '900',
                        letterSpacing: '-0.4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 8px 32px rgba(74,222,128,.3)',
                      }}
                    >
                      Start Survival Simulation
                      <Icons.arrow />
                    </button>
                    <span style={{ color: 'rgba(255,255,255,.15)', fontSize: '13px', fontFamily: 'DM Mono,monospace' }}>~10 min · +50 XP</span>
                  </div>
                </div>

                {/* ── STREAK WIDGET ── */}
                <div style={{
                  background: '#0e0e0e',
                  border: '1px solid rgba(251,146,60,.1)',
                  borderRadius: '16px',
                  padding: '20px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(251,146,60,.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '20px' }}>🔥</span>
                    </div>
                    <div>
                      <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700', letterSpacing: '-0.3px' }}>
                        {curStreak > 0 ? `${curStreak} Day${curStreak !== 1 ? 's' : ''} Streak` : 'Start your streak'}
                      </p>
                      <p style={{ color: '#252525', fontSize: '11px', fontFamily: 'DM Mono,monospace', marginTop: '2px' }}>
                        {curStreak > 0 ? `Best: ${bestStreak} days — don't break it` : "Complete today's mission to begin"}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {Array.from({ length: 7 }, (_, i) => {
                      const active = i < Math.min(curStreak, 7)
                      return (
                        <div key={i} className="chain-node" style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: active ? 'linear-gradient(135deg,#fbbf24,#f97316)' : '#111',
                          border: active ? 'none' : '1px solid #1a1a1a',
                          boxShadow: active ? '0 0 16px rgba(251,191,36,.4)' : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {!active && <span style={{ color: '#1e1e1e', fontSize: '18px', lineHeight: 1 }}>·</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ── STATS ROW ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { Icon: Icons.book, n: totalSessions, label: 'Sessions', accent: '#60a5fa', glow: 'rgba(96,165,250,.08)' },
                    { Icon: Icons.clock, n: minutesToday, label: 'Min today', accent: '#c084fc', glow: 'rgba(192,132,252,.08)' },
                    { Icon: Icons.bolt, n: 0, label: 'XP earned', accent: '#fbbf24', glow: 'rgba(251,191,36,.08)' },
                  ].map(({ Icon, n, label, accent, glow }) => (
                    <div key={label} className="stat-card" style={{ background: '#0e0e0e', border: `1px solid ${glow}`, borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '36px', height: '36px', background: glow, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}><Icon /></div>
                      <div>
                        <p style={{ color: '#fff', fontSize: '26px', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1 }}>{n}</p>
                        <p style={{ color: accent, fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'DM Mono,monospace', marginTop: '4px' }}>{label}</p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* ════ LEARN ════ */}
            {activeTab === 'learn' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="glow-card" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,.05)', borderRadius: '16px', padding: '32px' }}>
                  <LanguageFitnessScore />
                </div>
                <div className="glow-card" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,.05)', borderRadius: '16px', padding: '32px' }}>
                  <ForgettingCurve />
                </div>
              </div>
            )}

            {/* ════ TUTOR ════ */}
            {activeTab === 'tutor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'linear-gradient(145deg,#080614,#0d0820,#090614)', border: '1px solid rgba(139,92,246,.15)', borderRadius: '20px', padding: '60px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', background: 'radial-gradient(circle,rgba(139,92,246,.15),transparent 65%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg,#4c1d95,#7c3aed)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 48px rgba(124,58,237,.55)', color: '#fff' }}>
                      <Icons.message />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                      <span className="pulse" style={{ display: 'inline-block', width: '7px', height: '7px', background: '#4ade80', borderRadius: '50%' }} />
                      <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'DM Mono,monospace' }}>Online now</span>
                    </div>
                    <h2 style={{ color: '#fff', fontSize: '38px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '16px' }}>Lex — Your AI Tutor</h2>
                    <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '16px', lineHeight: 1.7, maxWidth: '420px', margin: '0 auto 36px' }}>
                      Every session adapts to your level, your goals, and your mood. No two conversations are ever the same.
                    </p>
                    <button className="btn-purple" onClick={() => router.push('/tutor')} style={{ background: 'linear-gradient(135deg,#6d28d9,#8b5cf6)', color: '#fff', borderRadius: '14px', padding: '15px 36px', fontSize: '16px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 28px rgba(109,40,217,.45)', letterSpacing: '-0.4px' }}>
                      Start Conversation <Icons.arrow />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                  {[
                    { Icon: Icons.bolt, title: '5-Min Lesson', desc: 'Quick focused practice', accent: '#fbbf24', glow: 'rgba(251,191,36,.08)', action: () => router.push('/emergency') },
                    { Icon: Icons.heart, title: 'Commitment', desc: 'Set your monthly goal', accent: '#4ade80', glow: 'rgba(74,222,128,.08)', action: () => router.push('/commitment') },
                    { Icon: Icons.trophy, title: '7-Day Guarantee', desc: 'Real conversation in a week', accent: '#c084fc', glow: 'rgba(192,132,252,.08)', action: () => {} },
                  ].map(({ Icon, title, desc, accent, glow, action }) => (
                    <div key={title} className="quick-card" onClick={action} style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,.05)', borderRadius: '16px', padding: '28px', boxShadow: `0 0 24px ${glow}` }}>
                      <div style={{ width: '40px', height: '40px', background: glow, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, marginBottom: '16px' }}><Icon /></div>
                      <p style={{ color: '#fff', fontSize: '17px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.4px' }}>{title}</p>
                      <p style={{ color: '#282828', fontSize: '12px', fontFamily: 'DM Mono,monospace' }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════ PROGRESS ════ */}
            {activeTab === 'progress' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="glow-card" style={{ background: '#0e0e0e', border: '1px solid rgba(74,222,128,.1)', borderRadius: '16px', padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', letterSpacing: '-0.6px' }}>Level Progress</h3>
                    <span style={{ color: '#252525', fontSize: '12px', fontFamily: 'DM Mono,monospace' }}>{level} → next</span>
                  </div>
                  <div style={{ background: '#111', borderRadius: '4px', height: '3px', marginBottom: '22px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '5%', background: 'linear-gradient(90deg,#4ade80,#22d3ee)', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'linear-gradient(135deg,#0f2a1a,#1a4a2e)', border: '1px solid rgba(74,222,128,.2)', borderRadius: '12px', padding: '12px 20px' }}>
                      <span style={{ color: '#4ade80', fontWeight: '900', fontSize: '20px', fontFamily: 'DM Mono,monospace' }}>{level}</span>
                    </div>
                    <div>
                      <p style={{ color: '#fff', fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>{levelName[level] || 'Beginner'}</p>
                      <p style={{ color: '#252525', fontSize: '12px', fontFamily: 'DM Mono,monospace' }}>5 / 100 XP to next level</p>
                    </div>
                  </div>
                </div>
                <div style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,.05)', borderRadius: '16px', padding: '32px' }}>
                  <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', letterSpacing: '-0.6px', marginBottom: '22px' }}>Personal Bests</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
                    {[
                      { Icon: Icons.clock, label: 'Longest session', val: `${personalBests?.longest_session || 0}m`, accent: '#c084fc', glow: 'rgba(192,132,252,.1)' },
                      { Icon: Icons.message, label: 'Most words', val: String(personalBests?.most_words_produced || 0), accent: '#60a5fa', glow: 'rgba(96,165,250,.1)' },
                      { Icon: Icons.target, label: 'Best accuracy', val: `${personalBests?.highest_accuracy || 0}%`, accent: '#4ade80', glow: 'rgba(74,222,128,.1)' },
                      { Icon: Icons.bolt, label: 'Most XP', val: String(personalBests?.most_xp_single_session || 0), accent: '#fbbf24', glow: 'rgba(251,191,36,.1)' },
                    ].map(({ Icon, label, val, accent, glow }) => (
                      <div key={label} style={{ background: '#111', border: `1px solid ${glow}`, borderRadius: '14px', padding: '22px', textAlign: 'center' }}>
                        <div style={{ width: '36px', height: '36px', background: glow, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, margin: '0 auto 14px' }}><Icon /></div>
                        <p style={{ color: '#fff', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', margin: '0 0 6px' }}>{val}</p>
                        <p style={{ color: accent, fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'DM Mono,monospace' }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ════ REWARDS ════ */}
            {activeTab === 'rewards' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'linear-gradient(145deg,#0a0a0a,#0e0e0e)', border: '1px solid rgba(74,222,128,.1)', borderRadius: '18px', padding: '30px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '54px', height: '54px', background: 'linear-gradient(135deg,#0f2a1a,#1a4a2e)', border: '1px solid rgba(74,222,128,.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '20px', fontWeight: '900' }}>
                      {name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', letterSpacing: '-0.6px', marginBottom: '4px' }}>{name}'s Passport</h3>
                      <p style={{ color: '#252525', fontSize: '12px', textTransform: 'capitalize', fontFamily: 'DM Mono,monospace' }}>{lang} · Level {level}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '40px' }}>
                    {[{ l: 'Level', v: level }, { l: 'Sessions', v: String(totalSessions) }, { l: 'Streak', v: `${curStreak}d` }, { l: 'XP', v: '0' }].map(({ l, v }) => (
                      <div key={l} style={{ textAlign: 'center' }}>
                        <p style={{ color: '#fff', fontSize: '22px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '4px' }}>{v}</p>
                        <p style={{ color: '#222', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'DM Mono,monospace' }}>{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,.05)', borderRadius: '16px', padding: '28px 32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', letterSpacing: '-0.6px' }}>Rewards</h3>
                    <span style={{ color: '#4ade80', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Mono,monospace' }}>View all →</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { icon: '☕', name: 'Μπρίκι Café', discount: '20% off', progress: '0 / 5 missions' },
                      { icon: '✈️', name: 'Aegean Airlines', discount: '10% off', progress: 'Reach B1' },
                    ].map(r => (
                      <div key={r.name} className="reward-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px', background: '#111', border: '1px solid rgba(255,255,255,.04)', borderRadius: '12px', opacity: .45 }}>
                        <div style={{ width: '46px', height: '46px', background: '#161616', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{r.icon}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{r.name} — {r.discount}</p>
                          <p style={{ color: '#252525', fontSize: '12px', fontFamily: 'DM Mono,monospace' }}>{r.progress}</p>
                        </div>
                        <span style={{ color: '#252525' }}><Icons.lock /></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}