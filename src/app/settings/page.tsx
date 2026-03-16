'use client'
import React from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getCurrentMission, survivalMissions, isPaywalled } from '@/lib/data/missions'

const I = {
  home: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  mission: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  progress: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  rewards: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  settings: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  arrow: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  signout: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  lock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
}

const DIFF_COLOR: Record<string, string> = {
  Beginner: '#60a5fa', Easy: '#34d399', Medium: '#fbbf24', Hard: '#f97316', Expert: '#f87171',
}
const CITY_FLAG: Record<string, string> = {
  athens: '🇬🇷', berlin: '🇩🇪', lisbon: '🇵🇹', amsterdam: '🇳🇱', madrid: '🇪🇸',
  paris: '🇫🇷', milan: '🇮🇹', barcelona: '🇪🇸', prague: '🇨🇿', warsaw: '🇵🇱',
  stockholm: '🇸🇪', other: '🌍',
}
const AFFILIATE_REWARDS = [
  { day: 4, partner: 'N26', icon: '🏦', accent: '#4ade80', title: 'N26 Bank Account', desc: 'Open a European bank account in minutes, no branch visit needed.', url: 'https://n26.com', cta: 'Open N26 →', unlockedAt: 'Complete Day 4 mission' },
  { day: 6, partner: 'SafetyWing', icon: '🛡', accent: '#fb923c', title: 'SafetyWing Health Insurance', desc: 'Worldwide expat health cover from $45/month.', url: 'https://safetywing.com', cta: 'Get covered →', unlockedAt: 'Complete Day 6 mission' },
  { day: 7, partner: 'Airalo', icon: '📱', accent: '#60a5fa', title: 'Airalo eSIM', desc: 'Local data in 200+ countries. No SIM swap needed.', url: 'https://airalo.com', cta: 'Get eSIM →', unlockedAt: 'Complete Day 7 mission' },
]
const TABS = [
  { id: 'home', label: 'Home', Icon: I.home },
  { id: 'missions', label: 'Missions', Icon: I.mission },
  { id: 'progress', label: 'Progress', Icon: I.progress },
  { id: 'rewards', label: 'Rewards', Icon: I.rewards },
]

export default function Dashboard() {
  const [profile, setProfile] = React.useState<Record<string, string | number | boolean | null>>({})
  const [user, setUser] = React.useState<{ id: string; email?: string; user_metadata?: Record<string, string> } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState('home')
  const [tabKey, setTabKey] = React.useState(0)
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
      const { count } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      setTotalSessions(count || 0)
      setLoading(false)
    }
    load()
  }, [router])

  const go = (tab: string) => { setActiveTab(tab); setTabKey(k => k + 1) }
  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#4ade80', animation: 'spin .8s linear infinite' }} />
    </main>
  )

  const name = profile?.full_name?.toString().split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const city = (profile?.city as string) || 'other'
  const lang = (profile?.target_language as string) || 'greek'
  const level = (profile?.current_level as string) || 'A1'
  const missionDay = Math.max(1, (profile?.mission_day as number) || 1)
  const mission = getCurrentMission(missionDay)
  const diffColor = DIFF_COLOR[mission.difficulty] || '#4ade80'
  const isPaid = profile?.subscription_status === 'active' || ((profile?.staked_amount as number) || 0) > 0
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{font-family:'DM Sans',sans-serif;font-size:16px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .tab-in{animation:fadeUp .2s cubic-bezier(.16,1,.3,1) both}
        .nav-item{transition:all .15s;border:none;cursor:pointer;width:100%;text-align:left;font-family:'DM Sans',sans-serif;display:flex;align-items:center}
        .nav-item:hover{background:#141414!important;color:#ccc!important}
        .card:hover{transform:translateY(-2px);border-color:#222!important}
        .card{transition:all .18s}
        .btn{transition:all .15s;border:none;cursor:pointer;font-family:'DM Sans',sans-serif}
        .btn:hover{transform:translateY(-1px)}
        .sb::-webkit-scrollbar{width:4px}
        .sb::-webkit-scrollbar-track{background:transparent}
        .sb::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:4px}
        .sb{scrollbar-width:thin;scrollbar-color:#1a1a1a transparent}
        .pulse{animation:pulse 2.5s ease infinite}
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#070707', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: '240px', background: '#050505', borderRight: '1px solid #0d0d0d', display: 'flex', flexDirection: 'column', padding: '28px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', marginBottom: '36px' }}>
            <span style={{ color: '#4ade80', fontWeight: '800', fontSize: '22px', letterSpacing: '-0.5px' }}>Glotto</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
            {TABS.map(({ id, label, Icon }) => {
              const on = activeTab === id
              return (
                <button key={id} className="nav-item" onClick={() => go(id)} style={{ gap: '11px', padding: '11px 13px', borderRadius: '9px', background: on ? '#111' : 'transparent', color: on ? '#fff' : '#2a2a2a', fontSize: '15px', fontWeight: on ? '700' : '400', border: 'none', position: 'relative' }}>
                  {on && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: '#4ade80', borderRadius: '0 3px 3px 0' }} />}
                  <span style={{ color: on ? '#4ade80' : '#2a2a2a', opacity: on ? 1 : 0.7 }}><Icon /></span>
                  {label}
                  {id === 'missions' && missionDay <= 7 && <span className="pulse" style={{ marginLeft: 'auto', width: '7px', height: '7px', background: '#4ade80', borderRadius: '50%' }} />}
                </button>
              )
            })}
            <button className="nav-item" onClick={() => router.push('/settings')} style={{ gap: '11px', padding: '11px 13px', borderRadius: '9px', background: 'transparent', color: '#2a2a2a', fontSize: '15px', fontWeight: '400', border: 'none', marginTop: '4px' }}>
              <span style={{ opacity: 0.5 }}><I.settings /></span>Settings
            </button>
          </nav>

          {/* City pill */}
          <div style={{ background: '#0e0e0e', border: '1px solid #111', borderRadius: '11px', padding: '13px 15px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '11px' }}>
            <span style={{ fontSize: '20px' }}>{CITY_FLAG[city] || '🌍'}</span>
            <div>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: '700', textTransform: 'capitalize' }}>{city}</p>
              <p style={{ color: '#2a2a2a', fontSize: '11px', fontFamily: '"DM Mono", monospace', textTransform: 'capitalize' }}>{lang} · {level}</p>
            </div>
          </div>

          {/* User row */}
          <div style={{ borderTop: '1px solid #0d0d0d', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '11px' }}>
            <div style={{ width: '34px', height: '34px', background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '13px', fontWeight: '800', flexShrink: 0 }}>{name[0]?.toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
              <p style={{ color: '#1a1a1a', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"DM Mono", monospace' }}>{user?.email}</p>
            </div>
            <button onClick={signOut} className="btn" style={{ background: 'none', border: 'none', color: '#1a1a1a', padding: '4px', display: 'flex' }}><I.signout /></button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="sb" style={{ flex: 1, overflowY: 'auto', background: '#0a0a0a' }}>

          {/* Top bar */}
          <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(10,10,10,.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #0d0d0d', padding: '18px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#2a2a2a', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace' }}>{greeting}, {name}</p>
              <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>{TABS.find(t => t.id === activeTab)?.label}</h1>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '15px' }}>📍</span>
                <span style={{ color: '#888', fontSize: '13px', fontWeight: '600' }}>Day {missionDay} of 7</span>
              </div>
              {isPaid && <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '20px', padding: '7px 16px' }}><span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '700' }}>✓ Active</span></div>}
            </div>
          </div>

          {/* Content */}
          <div key={tabKey} className="tab-in" style={{ padding: '40px 48px', maxWidth: '960px' }}>

            {/* ── HOME ── */}
            {activeTab === 'home' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Mission hero */}
                <div style={{ background: 'linear-gradient(160deg, #060f07, #091a0c, #050c06)', border: '1px solid rgba(74,222,128,.12)', borderRadius: '22px', padding: '44px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(74,222,128,.07), transparent 65%)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: '20px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="pulse" style={{ display: 'inline-block', width: '7px', height: '7px', background: '#4ade80', borderRadius: '50%' }} />
                      <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace' }}>Day {mission.day} · Today</span>
                    </div>
                    <div style={{ background: `${diffColor}15`, border: `1px solid ${diffColor}40`, borderRadius: '20px', padding: '6px 16px' }}>
                      <span style={{ color: diffColor, fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace' }}>{mission.difficulty}</span>
                    </div>
                    <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '6px 14px' }}>
                      <span style={{ color: '#444', fontSize: '12px', fontWeight: '600', fontFamily: '"DM Mono", monospace' }}>{mission.category}</span>
                    </div>
                  </div>
                  <h2 style={{ color: '#fff', fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', lineHeight: 1.0, marginBottom: '18px' }}>{mission.title}</h2>
                  <p style={{ color: 'rgba(255,255,255,.35)', fontSize: '16px', lineHeight: 1.7, maxWidth: '520px', marginBottom: '26px' }}>{mission.objective}</p>
                  <div style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.06)', borderRadius: '13px', padding: '14px 18px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '520px' }}>
                    <span style={{ fontSize: '18px' }}>🎭</span>
                    <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '14px', lineHeight: 1.5 }}>{mission.npc_persona}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    {isPaywalled(mission.day) && !isPaid ? (
                      <button className="btn" onClick={() => router.push('/pricing')} style={{ background: '#fb923c', color: '#050f06', borderRadius: '13px', padding: '15px 30px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '9px' }}>
                        🔒 Unlock Mission {mission.day} <I.arrow />
                      </button>
                    ) : (
                      <button className="btn" onClick={() => router.push(`/mission?day=${mission.day}`)} style={{ background: '#4ade80', color: '#050f06', borderRadius: '13px', padding: '15px 30px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '9px', boxShadow: '0 8px 32px rgba(74,222,128,.25)' }}>
                        Enter Simulation <I.arrow />
                      </button>
                    )}
                    <span style={{ color: '#2a2a2a', fontSize: '13px', fontFamily: '"DM Mono", monospace' }}>~10 min · +50 XP</span>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { icon: '🗓', n: `Day ${missionDay}/7`, label: 'Integration Day', color: '#4ade80' },
                    { icon: '✅', n: `${totalSessions}`, label: 'Missions Done', color: '#60a5fa' },
                    { icon: isPaid ? '⚡' : '🔓', n: isPaid ? 'Active' : 'Free', label: isPaid ? 'Full Access' : '2 Free Missions', color: isPaid ? '#4ade80' : '#fbbf24' },
                  ].map(({ icon, n, label, color }) => (
                    <div key={label} className="card" style={{ background: '#0e0e0e', border: '1px solid #111', borderRadius: '16px', padding: '24px' }}>
                      <span style={{ fontSize: '22px', marginBottom: '12px', display: 'block' }}>{icon}</span>
                      <p style={{ color, fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '5px' }}>{n}</p>
                      <p style={{ color: '#333', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: '"DM Mono", monospace' }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Quick links */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="card" style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px', cursor: 'pointer' }} onClick={() => router.push('/pricing')}>
                    <span style={{ fontSize: '22px', marginBottom: '10px', display: 'block' }}>⚡</span>
                    <p style={{ color: '#fff', fontWeight: '700', fontSize: '16px', marginBottom: '5px' }}>Commitment Mode</p>
                    <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.5 }}>Stake €30 — complete missions — get it back.</p>
                  </div>
                  <div className="card" style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px', cursor: 'pointer' }} onClick={() => router.push('/b2b-dashboard')}>
                    <span style={{ fontSize: '22px', marginBottom: '10px', display: 'block' }}>🏢</span>
                    <p style={{ color: '#fff', fontWeight: '700', fontSize: '16px', marginBottom: '5px' }}>HR Shield</p>
                    <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.5 }}>Company relocated you? Show this to your HR.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── MISSIONS ── */}
            {activeTab === 'missions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '7px', letterSpacing: '-0.5px' }}>7-Day Survival Bootcamp</h2>
                  <p style={{ color: '#444', fontSize: '15px' }}>Complete all 7 missions to finish your integration. Each one is a real scenario.</p>
                </div>
                {survivalMissions.map((m) => {
                  const done = m.day < missionDay
                  const current = m.day === missionDay
                  const locked = isPaywalled(m.day) && !isPaid
                  const dc = DIFF_COLOR[m.difficulty] || '#fff'
                  return (
                    <div key={m.id} className="card" onClick={() => locked ? router.push('/pricing') : router.push(`/mission?day=${m.day}`)} style={{ background: current ? '#0a160a' : '#0e0e0e', border: `1px solid ${current ? 'rgba(74,222,128,.2)' : '#111'}`, borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '18px', cursor: 'pointer', opacity: done ? 0.5 : 1 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '11px', flexShrink: 0, background: done ? '#0f2a1a' : current ? '#4ade80' : '#111', border: `1px solid ${done ? '#1a3a1f' : current ? '#4ade80' : '#1a1a1a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', fontFamily: '"DM Mono", monospace', color: done ? '#4ade80' : current ? '#050f06' : '#333' }}>
                        {done ? <I.check /> : m.day}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '4px' }}>
                          <p style={{ color: current ? '#4ade80' : '#fff', fontWeight: '700', fontSize: '16px' }}>{m.title}</p>
                          <span style={{ background: `${dc}15`, color: dc, fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '7px' }}>{m.difficulty}</span>
                          {m.affiliate_reward && <span style={{ background: '#fbbf2415', color: '#fbbf24', fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '7px' }}>+ Reward</span>}
                        </div>
                        <p style={{ color: '#444', fontSize: '13px', fontFamily: '"DM Mono", monospace' }}>{m.category}</p>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {locked ? <span style={{ color: '#555' }}><I.lock /></span> : current ? <span style={{ color: '#4ade80' }}><I.arrow /></span> : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── PROGRESS ── */}
            {activeTab === 'progress' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '18px', padding: '32px' }}>
                  <p style={{ color: '#333', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: '18px' }}>Integration Progress</p>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '22px' }}>
                    {survivalMissions.map(m => {
                      const done = m.day < missionDay
                      const curr = m.day === missionDay
                      return (
                        <div key={m.day} style={{ flex: 1 }}>
                          <div style={{ width: '100%', height: '40px', borderRadius: '9px', background: done ? '#4ade80' : curr ? '#0f2a1a' : '#111', border: `1px solid ${done ? '#4ade80' : curr ? '#1a3a1f' : '#1a1a1a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: done ? '#050f06' : curr ? '#4ade80' : '#2a2a2a', fontFamily: '"DM Mono", monospace' }}>
                            {done ? '✓' : m.day}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#555', fontSize: '14px' }}>{totalSessions} of 7 missions complete</p>
                    <p style={{ color: '#4ade80', fontSize: '14px', fontWeight: '700' }}>{Math.round((Math.max(0, missionDay - 1) / 7) * 100)}% integrated</p>
                  </div>
                </div>

                <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '18px', padding: '32px' }}>
                  <p style={{ color: '#333', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: '18px' }}>Your Setup</p>
                  {[
                    { k: 'City', v: city, icon: CITY_FLAG[city] || '🌍' },
                    { k: 'Language', v: lang, icon: '🗣' },
                    { k: 'Level', v: level, icon: '📊' },
                    { k: 'Access', v: isPaid ? 'Full Access' : 'Free (2 missions)', icon: isPaid ? '⚡' : '🔓' },
                  ].map(({ k, v, icon }) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #111' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '18px' }}>{icon}</span>
                        <span style={{ color: '#555', fontSize: '15px' }}>{k}</span>
                      </div>
                      <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600', textTransform: 'capitalize' }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div className="card" onClick={() => router.push('/proof')} style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: '#fff', fontWeight: '700', fontSize: '16px', marginBottom: '5px' }}>Session History</p>
                    <p style={{ color: '#444', fontSize: '14px' }}>{totalSessions} sessions completed</p>
                  </div>
                  <span style={{ color: '#4ade80' }}><I.arrow /></span>
                </div>
              </div>
            )}

            {/* ── REWARDS ── */}
            {activeTab === 'rewards' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '7px', letterSpacing: '-0.5px' }}>Affiliate Rewards</h2>
                  <p style={{ color: '#444', fontSize: '15px' }}>Pass missions, unlock real offers from our partners.</p>
                </div>
                {AFFILIATE_REWARDS.map((r) => {
                  const unlocked = missionDay > r.day
                  return (
                    <div key={r.partner} className="card" style={{ background: unlocked ? '#0e0e0e' : '#0a0a0a', border: `1px solid ${unlocked ? `${r.accent}30` : '#111'}`, borderRadius: '18px', padding: '28px', display: 'flex', gap: '20px', alignItems: 'flex-start', opacity: unlocked ? 1 : 0.5 }}>
                      <div style={{ width: 54, height: 54, borderRadius: '15px', background: unlocked ? `${r.accent}15` : '#111', border: `1px solid ${unlocked ? `${r.accent}30` : '#1a1a1a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>{r.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '5px' }}>
                          <p style={{ color: '#fff', fontWeight: '700', fontSize: '17px' }}>{r.title}</p>
                          {unlocked && <span style={{ background: `${r.accent}15`, color: r.accent, fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '7px' }}>UNLOCKED</span>}
                        </div>
                        <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.6, marginBottom: unlocked ? '16px' : '10px' }}>{r.desc}</p>
                        {unlocked ? (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: r.accent, color: '#050f06', borderRadius: '11px', padding: '10px 18px', fontSize: '14px', fontWeight: '800', textDecoration: 'none' }}>{r.cta}</a>
                        ) : (
                          <p style={{ color: '#2a2a2a', fontSize: '13px', fontFamily: '"DM Mono", monospace' }}>🔒 {r.unlockedAt}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {!isPaid && (
                  <div style={{ background: '#0a140a', border: '1px solid #1a3a1f', borderRadius: '18px', padding: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ color: '#4ade80', fontWeight: '800', fontSize: '16px', marginBottom: '5px' }}>Unlock all 7 missions to earn all 3 rewards</p>
                      <p style={{ color: '#555', fontSize: '14px' }}>€29.99/month or stake €30 and get it back when you finish.</p>
                    </div>
                    <button className="btn" onClick={() => router.push('/pricing')} style={{ background: '#4ade80', color: '#050f06', borderRadius: '13px', padding: '13px 24px', fontSize: '15px', fontWeight: '800', whiteSpace: 'nowrap' }}>See Plans →</button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}