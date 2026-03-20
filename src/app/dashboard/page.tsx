// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/dashboard/page.tsx  ← PASTE THIS ENTIRE FILE
//
// CHANGE: Full mobile responsiveness added.
//   - Sidebar hidden on screens < 768px (mobile/tablet)
//   - Bottom tab bar appears on mobile (fixed, iOS-safe with padding)
//   - All padding adapts: 48px desktop → 16px mobile
//   - Mission title font: 48px → 28px on mobile
//   - Stats grid: 3-col → 1-col on mobile
//   - Quick links: 2-col → 1-col on mobile
//   - Top bar simplified on mobile (no Day/Active pills, just greeting)
//   - Content max-width removed on mobile (full bleed)
//   - All logic, state, and data fetching unchanged
// ════════════════════════════════════════════════════════════════════════════
'use client'
import React from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getCurrentMission, survivalMissions, isPaywalled } from '@/lib/data/missions'
import {
  Home, Zap, TrendingUp, Gift, Settings,
  ArrowRight, LogOut, Lock, Check,
  Calendar, CheckSquare,
  Globe, MapPin, BarChart3, Siren, Building2,
  Landmark, Smartphone, FileText, FileSignature,
  Train, IdCard,
} from 'lucide-react'

// ── City flag map ──────────────────────────────────────────────────────────
const CITY_FLAG: Record<string, string> = {
  athens: '🇬🇷', berlin: '🇩🇪', lisbon: '🇵🇹', amsterdam: '🇳🇱', madrid: '🇪🇸',
  paris: '🇫🇷', milan: '🇮🇹', barcelona: '🇪🇸', prague: '🇨🇿', warsaw: '🇵🇱',
  stockholm: '🇸🇪', other: '🌍',
}

const DIFF_COLOR: Record<string, string> = {
  Beginner: '#60a5fa', Easy: '#34d399', Medium: '#fbbf24', Hard: '#f97316', Expert: '#f87171',
}

const MISSION_ICON: Record<number, React.ReactNode> = {
  1: <Train    size={16} color="#60a5fa" />,
  2: <Home     size={16} color="#a78bfa" />,
  3: <IdCard   size={16} color="#fbbf24" />,
  4: <Landmark size={16} color="#4ade80" />,
  5: <FileSignature size={16} color="#a78bfa" />,
  6: <Building2 size={16} color="#f87171" />,
  7: <Smartphone size={16} color="#fb923c" />,
}

const AFFILIATE_REWARDS = [
  { day: 4, partner: 'N26',        Icon: Landmark,   accent: '#4ade80', title: 'N26 Bank Account',           desc: 'Open a European bank account in minutes, no branch visit needed.', url: 'https://n26.com',        cta: 'Open N26 →',     unlockedAt: 'Complete Day 4 mission' },
  { day: 6, partner: 'SafetyWing', Icon: Building2,  accent: '#fb923c', title: 'SafetyWing Health Insurance', desc: 'Worldwide expat health cover from $45/month.',                       url: 'https://safetywing.com', cta: 'Get covered →', unlockedAt: 'Complete Day 6 mission' },
  { day: 7, partner: 'Airalo',     Icon: Smartphone, accent: '#60a5fa', title: 'Airalo eSIM',                 desc: 'Local data in 200+ countries. No SIM swap needed.',                  url: 'https://airalo.com',    cta: 'Get eSIM →',    unlockedAt: 'Complete Day 7 mission' },
]

const TABS = [
  { id: 'home',     label: 'Home',     Icon: Home      },
  { id: 'missions', label: 'Missions', Icon: Zap       },
  { id: 'progress', label: 'Progress', Icon: TrendingUp },
  { id: 'rewards',  label: 'Rewards',  Icon: Gift      },
]

export default function Dashboard() {
  const [profile,       setProfile]       = React.useState<Record<string, string | number | boolean | null>>({})
  const [user,          setUser]          = React.useState<{ id: string; email?: string; user_metadata?: Record<string, string> } | null>(null)
  const [loading,       setLoading]       = React.useState(true)
  const [activeTab,     setActiveTab]     = React.useState('home')
  const [tabKey,        setTabKey]        = React.useState(0)
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

  const name       = profile?.full_name?.toString().split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const city       = (profile?.city as string) || 'other'
  const lang       = (profile?.target_language as string) || 'greek'
  const level      = (profile?.current_level as string) || 'A1'
  const missionDay = Math.max(1, (profile?.mission_day as number) || 1)
  const mission    = getCurrentMission(missionDay)
  const diffColor  = DIFF_COLOR[mission.difficulty] || '#4ade80'
  const isPaid     = profile?.subscription_status === 'active' || ((profile?.staked_amount as number) || 0) > 0
  const h          = new Date().getHours()
  const greeting   = h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening'

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

        /* ── DESKTOP sidebar visible, mobile nav hidden ── */
        .sidebar        { display: flex; }
        .mobile-nav     { display: none; }
        .top-pills      { display: flex; }
        .content-pad    { padding: 40px 48px; }
        .topbar-pad     { padding: 18px 48px; }
        .mission-title  { font-size: 48px; }
        .stats-grid     { grid-template-columns: repeat(3,1fr); }
        .links-grid     { grid-template-columns: 1fr 1fr; }
        .missions-grid  { grid-template-columns: 1fr; }

        /* ── MOBILE: < 768px ── */
        @media (max-width: 768px) {
          .sidebar       { display: none !important; }
          .mobile-nav    { display: flex !important; }
          .top-pills     { display: none !important; }
          .content-pad   { padding: 16px 16px 90px !important; }
          .topbar-pad    { padding: 14px 16px !important; }
          .mission-title { font-size: 28px !important; letter-spacing: -1px !important; }
          .stats-grid    { grid-template-columns: 1fr !important; }
          .links-grid    { grid-template-columns: 1fr !important; }
          .mission-hero  { padding: 24px !important; }
          .mission-desc  { display: none !important; }
          .topbar-title  { font-size: 18px !important; }
          .progress-bar-row { gap: 4px !important; }
          .progress-bar-cell { height: 32px !important; }
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#070707', overflow: 'hidden' }}>

        {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
        <aside className="sidebar" style={{ width: '240px', background: '#050505', borderRight: '1px solid #0d0d0d', flexDirection: 'column', padding: '28px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', marginBottom: '36px' }}>
            <span style={{ color: '#4ade80', fontWeight: '800', fontSize: '22px', letterSpacing: '-0.5px' }}>Glotto</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
            {TABS.map(({ id, label, Icon }) => {
              const on = activeTab === id
              return (
                <button key={id} className="nav-item" onClick={() => go(id)}
                  style={{ gap: '11px', padding: '11px 13px', borderRadius: '9px', background: on ? '#111' : 'transparent', color: on ? '#fff' : '#2a2a2a', fontSize: '15px', fontWeight: on ? '700' : '400', border: 'none', position: 'relative' }}>
                  {on && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: '#4ade80', borderRadius: '0 3px 3px 0' }} />}
                  <Icon size={16} color={on ? '#4ade80' : '#2a2a2a'} />
                  {label}
                  {id === 'missions' && missionDay <= 7 && <span className="pulse" style={{ marginLeft: 'auto', width: '7px', height: '7px', background: '#4ade80', borderRadius: '50%' }} />}
                </button>
              )
            })}
            <button className="nav-item" onClick={() => router.push('/settings')}
              style={{ gap: '11px', padding: '11px 13px', borderRadius: '9px', background: 'transparent', color: '#2a2a2a', fontSize: '15px', fontWeight: '400', border: 'none', marginTop: '4px' }}>
              <Settings size={16} color="#2a2a2a" />Settings
            </button>
          </nav>

          {/* City pill */}
          <div style={{ background: '#0e0e0e', border: '1px solid #111', borderRadius: '11px', padding: '13px 15px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '11px' }}>
            <span style={{ fontSize: '20px' }}>{CITY_FLAG[city] || '🌍'}</span>
            <div>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: '700', textTransform: 'capitalize' }}>{city}</p>
              <p style={{ color: '#2a2a2a', fontSize: '11px', fontFamily: '"DM Mono", monospace', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Globe size={10} color="#2a2a2a" />{lang} · {level}
              </p>
            </div>
          </div>

          {/* User row */}
          <div style={{ borderTop: '1px solid #0d0d0d', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '11px' }}>
            <div style={{ width: '34px', height: '34px', background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '13px', fontWeight: '800', flexShrink: 0 }}>{name[0]?.toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
              <p style={{ color: '#1a1a1a', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"DM Mono", monospace' }}>{user?.email}</p>
            </div>
            <button onClick={signOut} className="btn" style={{ background: 'none', border: 'none', color: '#1a1a1a', padding: '4px', display: 'flex' }}>
              <LogOut size={14} color="#1a1a1a" />
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="sb" style={{ flex: 1, overflowY: 'auto', background: '#0a0a0a' }}>

          {/* Top bar */}
          <div className="topbar-pad" style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(10,10,10,.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#2a2a2a', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace' }}>{greeting}, {name}</p>
              <h1 className="topbar-title" style={{ color: '#fff', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>{TABS.find(t => t.id === activeTab)?.label}</h1>
            </div>
            {/* Pills — hidden on mobile via .top-pills */}
            <div className="top-pills" style={{ gap: '10px', alignItems: 'center' }}>
              <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <MapPin size={13} color="#888" />
                <span style={{ color: '#888', fontSize: '13px', fontWeight: '600' }}>Day {missionDay} of 7</span>
              </div>
              {isPaid && (
                <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '20px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={13} color="#4ade80" />
                  <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '700' }}>Active</span>
                </div>
              )}
            </div>
          </div>

          {/* Tab content */}
          <div key={tabKey} className="tab-in content-pad" style={{ maxWidth: '960px' }}>

            {/* ── HOME ── */}
            {activeTab === 'home' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Mission hero */}
                <div className="mission-hero" style={{ background: 'linear-gradient(160deg, #060f07, #091a0c, #050c06)', border: '1px solid rgba(74,222,128,.12)', borderRadius: '22px', padding: '44px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(74,222,128,.07), transparent 65%)', pointerEvents: 'none' }} />

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: '20px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="pulse" style={{ display: 'inline-block', width: '7px', height: '7px', background: '#4ade80', borderRadius: '50%' }} />
                      <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace' }}>Day {mission.day} · Today</span>
                    </div>
                    <div style={{ background: `${diffColor}15`, border: `1px solid ${diffColor}40`, borderRadius: '20px', padding: '6px 16px' }}>
                      <span style={{ color: diffColor, fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace' }}>{mission.difficulty}</span>
                    </div>
                  </div>

                  <h2 className="mission-title" style={{ color: '#fff', fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', lineHeight: 1.0, marginBottom: '14px' }}>{mission.title}</h2>
                  <p className="mission-desc" style={{ color: 'rgba(255,255,255,.35)', fontSize: '16px', lineHeight: 1.7, maxWidth: '520px', marginBottom: '22px' }}>{mission.objective}</p>

                  <div className="mission-desc" style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.06)', borderRadius: '13px', padding: '14px 18px', marginBottom: '26px', display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '520px' }}>
                    <FileText size={16} color="rgba(255,255,255,.3)" style={{ flexShrink: 0 }} />
                    <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '14px', lineHeight: 1.5 }}>{mission.npc_persona}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    {isPaywalled(mission.day) && !isPaid ? (
                      <button className="btn" onClick={() => router.push('/pricing')}
                        style={{ background: '#fb923c', color: '#050f06', borderRadius: '13px', padding: '15px 24px', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <Lock size={16} color="#050f06" />Unlock Mission {mission.day} <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button className="btn" onClick={() => router.push(`/mission?day=${mission.day}`)}
                        style={{ background: '#4ade80', color: '#050f06', borderRadius: '13px', padding: '15px 24px', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '9px', boxShadow: '0 8px 32px rgba(74,222,128,.25)' }}>
                        Enter Simulation <ArrowRight size={16} />
                      </button>
                    )}
                    <span style={{ color: '#2a2a2a', fontSize: '13px', fontFamily: '"DM Mono", monospace' }}>~10 min · +50 XP</span>
                  </div>
                </div>

                {/* Stats — 3-col desktop, 1-col mobile */}
                <div className="stats-grid" style={{ display: 'grid', gap: '12px' }}>
                  {[
                    { Icon: Calendar,    n: `Day ${missionDay}/7`,                label: 'Integration Day',                color: '#4ade80' },
                    { Icon: CheckSquare, n: `${totalSessions}`,                   label: 'Missions Done',                  color: '#60a5fa' },
                    { Icon: isPaid ? Zap : Lock, n: isPaid ? 'Active' : 'Free',   label: isPaid ? 'Full Access' : '2 Free Missions', color: isPaid ? '#4ade80' : '#fbbf24' },
                  ].map(({ Icon, n, label, color }) => (
                    <div key={label} className="card" style={{ background: '#0e0e0e', border: '1px solid #111', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <Icon size={22} color={color} />
                      <div>
                        <p style={{ color, fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px' }}>{n}</p>
                        <p style={{ color: '#333', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: '"DM Mono", monospace' }}>{label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick links — 2-col desktop, 1-col mobile */}
                <div className="links-grid" style={{ display: 'grid', gap: '12px' }}>
                  <div className="card" style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }} onClick={() => router.push('/pricing')}>
                    <Zap size={22} color="#4ade80" />
                    <div>
                      <p style={{ color: '#fff', fontWeight: '700', fontSize: '15px', marginBottom: '3px' }}>Commitment Mode</p>
                      <p style={{ color: '#444', fontSize: '13px' }}>Stake €30 — complete — get it back.</p>
                    </div>
                  </div>
                  <div className="card" style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }} onClick={() => router.push('/b2b-dashboard')}>
                    <Building2 size={22} color="#fbbf24" />
                    <div>
                      <p style={{ color: '#fff', fontWeight: '700', fontSize: '15px', marginBottom: '3px' }}>HR Shield</p>
                      <p style={{ color: '#444', fontSize: '13px' }}>Company relocated you? Show HR.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── MISSIONS ── */}
            {activeTab === 'missions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', marginBottom: '7px', letterSpacing: '-0.5px' }}>7-Day Survival Bootcamp</h2>
                  <p style={{ color: '#444', fontSize: '14px' }}>Complete all 7 missions to finish your integration.</p>
                </div>
                {survivalMissions.map((m) => {
                  const done    = m.day < missionDay
                  const current = m.day === missionDay
                  const locked  = isPaywalled(m.day) && !isPaid
                  const dc      = DIFF_COLOR[m.difficulty] || '#fff'
                  return (
                    <div key={m.id} className="card"
                      onClick={() => locked ? router.push('/pricing') : router.push(`/mission?day=${m.day}`)}
                      style={{ background: current ? '#0a160a' : '#0e0e0e', border: `1px solid ${current ? 'rgba(74,222,128,.2)' : '#111'}`, borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', opacity: done ? 0.5 : 1 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '11px', flexShrink: 0, background: done ? '#0f2a1a' : current ? '#4ade80' : '#111', border: `1px solid ${done ? '#1a3a1f' : current ? '#4ade80' : '#1a1a1a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {done
                          ? <Check size={16} color="#4ade80" />
                          : (MISSION_ICON[m.day] || <span style={{ fontSize: '14px', fontWeight: '800', fontFamily: '"DM Mono", monospace', color: current ? '#050f06' : '#333' }}>{m.day}</span>)
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <p style={{ color: current ? '#4ade80' : '#fff', fontWeight: '700', fontSize: '15px' }}>{m.title}</p>
                          <span style={{ background: `${dc}15`, color: dc, fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '7px' }}>{m.difficulty}</span>
                          {m.affiliate_reward && <span style={{ background: '#fbbf2415', color: '#fbbf24', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: 3 }}><Gift size={10} /> Reward</span>}
                        </div>
                        <p style={{ color: '#444', fontSize: '12px', fontFamily: '"DM Mono", monospace' }}>{m.category}</p>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {locked ? <Lock size={14} color="#555" /> : current ? <ArrowRight size={14} color="#4ade80" /> : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── PROGRESS ── */}
            {activeTab === 'progress' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '18px', padding: '24px' }}>
                  <p style={{ color: '#333', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: '16px' }}>Integration Progress</p>
                  <div className="progress-bar-row" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {survivalMissions.map(m => {
                      const done = m.day < missionDay
                      const curr = m.day === missionDay
                      return (
                        <div key={m.day} style={{ flex: 1 }}>
                          <div className="progress-bar-cell" style={{ width: '100%', height: '40px', borderRadius: '9px', background: done ? '#4ade80' : curr ? '#0f2a1a' : '#111', border: `1px solid ${done ? '#4ade80' : curr ? '#1a3a1f' : '#1a1a1a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {done
                              ? <Check size={14} color="#050f06" />
                              : <span style={{ fontSize: '11px', fontWeight: '800', color: curr ? '#4ade80' : '#2a2a2a', fontFamily: '"DM Mono", monospace' }}>{m.day}</span>
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#555', fontSize: '14px' }}>{totalSessions} of 7 complete</p>
                    <p style={{ color: '#4ade80', fontSize: '14px', fontWeight: '700' }}>{Math.round((Math.max(0, missionDay - 1) / 7) * 100)}% integrated</p>
                  </div>
                </div>

                <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '18px', padding: '24px' }}>
                  <p style={{ color: '#333', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: '16px' }}>Your Setup</p>
                  {[
                    { k: 'City',     v: city,   Icon: MapPin,    iconColor: '#888' },
                    { k: 'Language', v: lang,   Icon: Globe,     iconColor: '#888' },
                    { k: 'Level',    v: level,  Icon: BarChart3, iconColor: '#888' },
                    { k: 'Access',   v: isPaid ? 'Full Access' : 'Free (2 missions)', Icon: isPaid ? Zap : Lock, iconColor: isPaid ? '#4ade80' : '#fbbf24' },
                  ].map(({ k, v, Icon, iconColor }) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #111' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Icon size={18} color={iconColor} />
                        <span style={{ color: '#555', fontSize: '15px' }}>{k}</span>
                      </div>
                      <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600', textTransform: 'capitalize' }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div className="card" onClick={() => router.push('/proof')} style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: '#fff', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>Session History</p>
                    <p style={{ color: '#444', fontSize: '14px' }}>{totalSessions} sessions completed</p>
                  </div>
                  <ArrowRight size={18} color="#4ade80" />
                </div>
              </div>
            )}

            {/* ── REWARDS ── */}
            {activeTab === 'rewards' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ marginBottom: '6px' }}>
                  <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.5px' }}>Affiliate Rewards</h2>
                  <p style={{ color: '#444', fontSize: '14px' }}>Pass missions, unlock real offers from our partners.</p>
                </div>
                {AFFILIATE_REWARDS.map((r) => {
                  const unlocked = missionDay > r.day
                  return (
                    <div key={r.partner} className="card" style={{ background: unlocked ? '#0e0e0e' : '#0a0a0a', border: `1px solid ${unlocked ? `${r.accent}30` : '#111'}`, borderRadius: '18px', padding: '24px', display: 'flex', gap: '18px', alignItems: 'flex-start', opacity: unlocked ? 1 : 0.5 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '13px', background: unlocked ? `${r.accent}15` : '#111', border: `1px solid ${unlocked ? `${r.accent}30` : '#1a1a1a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <r.Icon size={22} color={unlocked ? r.accent : '#333'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <p style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{r.title}</p>
                          {unlocked && <span style={{ background: `${r.accent}15`, color: r.accent, fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '7px' }}>UNLOCKED</span>}
                        </div>
                        <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.6, marginBottom: unlocked ? '14px' : '8px' }}>{r.desc}</p>
                        {unlocked ? (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: r.accent, color: '#050f06', borderRadius: '11px', padding: '10px 18px', fontSize: '14px', fontWeight: '800', textDecoration: 'none' }}>
                            {r.cta} <ArrowRight size={14} />
                          </a>
                        ) : (
                          <p style={{ color: '#2a2a2a', fontSize: '13px', fontFamily: '"DM Mono", monospace', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Lock size={12} color="#2a2a2a" /> {r.unlockedAt}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {!isPaid && (
                  <div style={{ background: '#0a140a', border: '1px solid #1a3a1f', borderRadius: '18px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ color: '#4ade80', fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>Unlock all 7 missions to earn all 3 rewards</p>
                      <p style={{ color: '#555', fontSize: '14px' }}>€29.99/month or stake €30 and get it back.</p>
                    </div>
                    <button className="btn" onClick={() => router.push('/pricing')} style={{ background: '#4ade80', color: '#050f06', borderRadius: '13px', padding: '12px 22px', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 7 }}>
                      See Plans <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>{/* end content-pad */}
        </div>{/* end main */}

        {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
        <nav className="mobile-nav" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(5,5,5,0.96)', backdropFilter: 'blur(20px)',
          borderTop: '1px solid #111',
          // iOS safe area support
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          paddingTop: '8px',
          zIndex: 50,
          justifyContent: 'space-around', alignItems: 'center',
          gap: 0,
        }}>
          {TABS.map(({ id, label, Icon }) => {
            const on = activeTab === id
            return (
              <button key={id} onClick={() => go(id)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                padding: '6px 4px', position: 'relative',
              }}>
                {/* Active indicator dot above icon */}
                {on && <span style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', background: '#4ade80', borderRadius: '50%' }} />}
                <Icon size={22} color={on ? '#4ade80' : '#2a2a2a'} />
                <span style={{ fontSize: '10px', fontWeight: on ? '700' : '500', color: on ? '#4ade80' : '#2a2a2a', letterSpacing: '0.02em' }}>{label}</span>
                {/* Missions badge */}
                {id === 'missions' && missionDay <= 7 && !on && (
                  <span className="pulse" style={{ position: 'absolute', top: 4, right: '24%', width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%' }} />
                )}
              </button>
            )
          })}
          {/* Settings button on mobile nav */}
          <button onClick={() => router.push('/settings')} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '6px 4px',
          }}>
            <Settings size={22} color="#2a2a2a" />
            <span style={{ fontSize: '10px', fontWeight: '500', color: '#2a2a2a' }}>Settings</span>
          </button>
        </nav>

      </div>
    </>
  )
}