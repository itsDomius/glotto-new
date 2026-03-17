// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/hr/page.tsx
// CHANGES:
//   1. "Integration Progress" → "Flight Risk Index" column header
//   2. Emoji status replaced with SVG icons (Heroicons/Lucide style)
//   3. Conditional row bg: red tint (critical), amber tint (medium/high), clean (low)
//   4. "Intervene" button: solid red + pulsing animation on critical
//   5. Status text: "High Risk – Action Required" / "Monitor Progress" / "On Track"
// ════════════════════════════════════════════════════════════════════════════
'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const G = '#4ade80'

// ── SVG Icons — all inline, no external deps ─────────────────────────────────
const IconAlert = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconCheckCircle = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IconEye = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconMail = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IconTarget = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
)
const IconUsers = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const IconSettings = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
)
const IconBarChart = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const IconClock = ({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconZap = ({ size = 11, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

type Employee = {
  id: string; name: string; email: string; city: string; flag: string
  role: string; mission_day: number; target_language: string
  subscription_status: string; onboarding_complete: boolean
  sessions_completed: number; last_active: string | null
  staked_amount: number; days_since_active: number
  critical_deadline_days: number | null
}

// ── Flight Risk calculation ───────────────────────────────────────────────────
function calcFlightRisk(e: Employee): { level: 'critical' | 'high' | 'medium' | 'low'; score: number; reason: string; label: string; statusText: string } {
  const pct = ((e.mission_day - 1) / 7) * 100

  if (!e.onboarding_complete) return { level: 'critical', score: 95, reason: 'Never completed onboarding', label: 'Critical Risk', statusText: 'High Risk — Action Required' }
  if (e.days_since_active >= 7 && pct < 50) return { level: 'critical', score: 90, reason: `Inactive ${e.days_since_active}d — integration stalled`, label: 'Critical Risk', statusText: 'High Risk — Action Required' }
  if (e.critical_deadline_days !== null && e.critical_deadline_days <= 3) return { level: 'critical', score: 88, reason: `Tax ID deadline in ${e.critical_deadline_days}d`, label: 'Critical Risk', statusText: 'High Risk — Action Required' }

  if (pct < 30 && e.days_since_active >= 3) return { level: 'high', score: 72, reason: `Only ${Math.round(pct)}% integrated, ${e.days_since_active}d inactive`, label: 'High Risk', statusText: 'High Risk — Action Required' }
  if (e.mission_day <= 2 && e.days_since_active >= 4) return { level: 'high', score: 65, reason: 'Stuck on first 2 missions', label: 'High Risk', statusText: 'High Risk — Action Required' }

  if (pct < 60 && e.days_since_active >= 2) return { level: 'medium', score: 40, reason: 'Below integration velocity', label: 'Monitor', statusText: 'Monitor Progress' }

  const velocity = e.sessions_completed >= 4 || e.staked_amount > 0
  if (velocity) return { level: 'low', score: 8, reason: 'High integration velocity', label: 'On Track', statusText: 'On Track' }
  return { level: 'low', score: 20, reason: `${Math.round(pct)}% integrated`, label: 'Progressing', statusText: 'On Track' }
}

// ── Row/badge styles keyed by risk level ─────────────────────────────────────
const RISK_STYLE = {
  critical: { rowBg: 'rgba(248,113,113,.06)', border: '#3a0f0f', badge: '#f87171', badgeBg: '#2a0505', icon: '#f87171' },
  high:     { rowBg: 'rgba(251,146,60,.05)',  border: '#3a2000', badge: '#fb923c', badgeBg: '#2a1000', icon: '#fb923c' },
  medium:   { rowBg: 'rgba(251,191,36,.04)',  border: '#2a2000', badge: '#fbbf24', badgeBg: '#1a1200', icon: '#fbbf24' },
  low:      { rowBg: 'transparent',           border: '#0d0d0d', badge: '#4ade80', badgeBg: '#0a1a0a', icon: '#4ade80' },
}

const DEMO_EMPLOYEES: Employee[] = [
  { id:'1', name:'Sarah Mitchell',  email:'sarah.m@teleperformance.com',   city:'athens',     flag:'🇬🇷', role:'Customer Success Mgr',  mission_day:6, target_language:'greek',  subscription_status:'active', onboarding_complete:true,  sessions_completed:5, last_active:'2h ago',  staked_amount:30, days_since_active:0, critical_deadline_days:null },
  { id:'2', name:'James Kowalski',  email:'j.kowalski@teleperformance.com', city:'athens',     flag:'🇬🇷', role:'Operations Analyst',    mission_day:3, target_language:'greek',  subscription_status:'active', onboarding_complete:true,  sessions_completed:2, last_active:'1d ago',  staked_amount:0,  days_since_active:1, critical_deadline_days:2 },
  { id:'3', name:'Priya Sharma',    email:'p.sharma@teleperformance.com',   city:'athens',     flag:'🇬🇷', role:'Data Engineer',         mission_day:7, target_language:'greek',  subscription_status:'active', onboarding_complete:true,  sessions_completed:6, last_active:'30m ago', staked_amount:30, days_since_active:0, critical_deadline_days:null },
  { id:'4', name:'Marco Delgado',   email:'m.delgado@teleperformance.com',  city:'berlin',     flag:'🇩🇪', role:'Product Designer',      mission_day:1, target_language:'german', subscription_status:'free',   onboarding_complete:false, sessions_completed:0, last_active:'5d ago',  staked_amount:0,  days_since_active:5, critical_deadline_days:null },
  { id:'5', name:'Aisha Okonkwo',   email:'a.okonkwo@teleperformance.com',  city:'amsterdam',  flag:'🇳🇱', role:'Marketing Lead',        mission_day:4, target_language:'dutch',  subscription_status:'active', onboarding_complete:true,  sessions_completed:3, last_active:'3h ago',  staked_amount:0,  days_since_active:0, critical_deadline_days:null },
  { id:'6', name:'Tom Eriksson',    email:'t.eriksson@teleperformance.com', city:'athens',     flag:'🇬🇷', role:'Engineering Manager',   mission_day:2, target_language:'greek',  subscription_status:'free',   onboarding_complete:true,  sessions_completed:1, last_active:'8d ago',  staked_amount:0,  days_since_active:8, critical_deadline_days:5 },
]

type Tab = 'risk' | 'overview' | 'employees' | 'settings'

export default function HRPage() {
  const router = useRouter()
  const [employees] = useState<Employee[]>(DEMO_EMPLOYEES)
  const [activeTab, setActiveTab] = useState<Tab>('risk')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookType, setWebhookType] = useState<'slack' | 'teams'>('slack')
  const [webhookMsg, setWebhookMsg] = useState('')
  const [loadingHook, setLoadingHook] = useState(false)
  const [sortBy, setSortBy] = useState<'risk' | 'name' | 'progress'>('risk')

  const risks = employees.map(e => ({ ...e, risk: calcFlightRisk(e) }))
  const sorted = [...risks].sort((a, b) => {
    if (sortBy === 'risk')     return b.risk.score - a.risk.score
    if (sortBy === 'name')     return a.name.localeCompare(b.name)
    if (sortBy === 'progress') return b.mission_day - a.mission_day
    return 0
  })

  const criticalCount  = risks.filter(r => r.risk.level === 'critical').length
  const highCount      = risks.filter(r => r.risk.level === 'high').length
  const onTrack        = risks.filter(r => r.risk.level === 'low').length
  const avgIntegration = Math.round(risks.reduce((s, r) => s + ((r.mission_day - 1) / 7) * 100, 0) / risks.length)

  const testWebhook = async () => {
    if (!webhookUrl.trim()) return
    setLoadingHook(true)
    try {
      await fetch('/api/webhook/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ webhookUrl, webhookType }) })
      setWebhookMsg('✓ Test message sent!')
    } catch { setWebhookMsg('Failed to send') }
    finally { setLoadingHook(false); setTimeout(() => setWebhookMsg(''), 4000) }
  }

  const TABS = [
    { id: 'risk'      as Tab, label: 'Flight Risk',   Icon: IconTarget, badge: criticalCount + highCount },
    { id: 'overview'  as Tab, label: 'Overview',      Icon: IconBarChart },
    { id: 'employees' as Tab, label: 'All Employees', Icon: IconUsers },
    { id: 'settings'  as Tab, label: 'Integrations',  Icon: IconSettings },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#070707', fontFamily: '"DM Sans", -apple-system, sans-serif', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseSlow{0%,100%{opacity:1}50%{opacity:.55}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}
        .nav-btn{transition:all .15s;border:none;cursor:pointer;width:100%;text-align:left;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:9px;font-size:15px}
        .nav-btn:hover{background:#141414!important}
        .emp-row{transition:filter .1s}
        .emp-row:hover{filter:brightness(1.07)}
        .pulse-critical{animation:pulseSlow 1.2s ease infinite}
        .content{animation:fadeUp .2s ease both}
        .sb::-webkit-scrollbar{width:4px}.sb::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:4px}
        input:focus{outline:none;border-color:#4ade80!important}
        .sort-btn{transition:all .1s;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;padding:5px 12px;border-radius:8px}
        .sort-btn:hover{opacity:.8}
        .intervene-critical{animation:pulseSlow 1.2s ease infinite}
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width: 230, background: '#050505', borderRight: '1px solid #0d0d0d', display: 'flex', flexDirection: 'column', padding: '24px 13px', flexShrink: 0 }}>
        <div style={{ marginBottom: 28, padding: '4px 10px' }}>
          <div style={{ color: G, fontWeight: 800, fontSize: 21 }}>Glotto</div>
          <div style={{ color: '#2a2a2a', fontSize: 11, fontFamily: '"DM Mono", monospace', marginTop: 2 }}>HR Command Center</div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {TABS.map(({ id, label, Icon, badge }) => {
            const on = activeTab === id
            return (
              <button key={id} className="nav-btn" onClick={() => setActiveTab(id)} style={{ background: on ? '#111' : 'transparent', color: on ? '#fff' : '#2a2a2a', fontWeight: on ? 700 : 400, position: 'relative' }}>
                {on && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: G, borderRadius: '0 3px 3px 0' }} />}
                <Icon size={16} color={on ? G : '#2a2a2a'} />
                {label}
                {badge != null && badge > 0 && (
                  <span className="pulse-critical" style={{ marginLeft: 'auto', background: '#f87171', color: '#fff', borderRadius: 10, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, padding: '0 5px' }}>{badge}</span>
                )}
              </button>
            )
          })}
        </nav>
        <div style={{ borderTop: '1px solid #0d0d0d', paddingTop: 14 }}>
          <button className="nav-btn" onClick={() => router.push('/dashboard')} style={{ background: 'transparent', color: '#2a2a2a', fontWeight: 400, fontSize: 14 }}>← Back to App</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="sb" style={{ flex: 1, overflowY: 'auto', background: '#0a0a0a' }}>
        {/* Top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(10,10,10,.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #0d0d0d', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#2a2a2a', fontSize: 11, fontFamily: '"DM Mono", monospace', letterSpacing: 2, textTransform: 'uppercase' }}>Teleperformance · HR</p>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              {{ risk: 'Flight Risk Radar', overview: 'Overview', employees: 'All Employees', settings: 'Integrations' }[activeTab]}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {criticalCount > 0 && (
              <div className="pulse-critical" style={{ background: '#1a0505', border: '1px solid #3a0f0f', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconAlert size={12} color="#f87171" />
                <span style={{ color: '#f87171', fontSize: 12, fontWeight: 700 }}>{criticalCount} Critical</span>
              </div>
            )}
            <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconCheckCircle size={12} color={G} />
              <span style={{ color: G, fontSize: 12, fontWeight: 700 }}>{avgIntegration}% avg integrated</span>
            </div>
          </div>
        </div>

        <div className="content" style={{ padding: '32px 40px', maxWidth: 1000 }}>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* FLIGHT RISK TAB                                           */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'risk' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Sort */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#333', fontSize: 12, fontFamily: '"DM Mono", monospace' }}>SORT:</span>
                {([['risk', 'By Risk'], ['name', 'By Name'], ['progress', 'By Progress']] as const).map(([key, label]) => (
                  <button key={key} className="sort-btn" onClick={() => setSortBy(key)} style={{ background: sortBy === key ? '#111' : 'transparent', border: `1px solid ${sortBy === key ? '#1a1a1a' : '#0d0d0d'}`, color: sortBy === key ? '#fff' : '#333', fontWeight: sortBy === key ? 700 : 400 }}>{label}</button>
                ))}
              </div>

              {sorted.map((emp, idx) => {
                const risk = emp.risk
                const rs = RISK_STYLE[risk.level]
                const pct = Math.round(((emp.mission_day - 1) / 7) * 100)
                const isCritical = risk.level === 'critical'
                const isHigh = risk.level === 'high'
                const isMedium = risk.level === 'medium'
                const isLow = risk.level === 'low'

                return (
                  <div key={emp.id} className="emp-row" style={{
                    background: rs.rowBg,
                    border: `1px solid ${rs.border}`,
                    borderLeft: (isCritical || isHigh) ? `4px solid ${rs.badge}` : `1px solid ${rs.border}`,
                    borderRadius: 16, padding: '20px 24px',
                    animation: `slideIn .25s ease ${idx * 0.04}s both`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>

                      {/* Employee info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#111', border: `1px solid ${rs.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{emp.flag}</div>
                        <div>
                          <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{emp.name}</p>
                          <p style={{ color: '#444', fontSize: 12, fontFamily: '"DM Mono", monospace' }}>{emp.role}</p>
                          <p style={{ color: '#222', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>{emp.city} · {emp.target_language}</p>
                        </div>
                      </div>

                      {/* Risk score badge */}
                      <div style={{ flexShrink: 0 }}>
                        <div style={{ background: rs.badgeBg, border: `1px solid ${rs.badge}30`, borderRadius: 10, padding: '6px 14px', textAlign: 'center', minWidth: 100 }}>
                          <p style={{ color: rs.badge, fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>{risk.label}</p>
                          <p style={{ color: rs.badge, fontWeight: 900, fontSize: 22, fontFamily: '"DM Mono", monospace', lineHeight: 1 }}>{risk.score}</p>
                          <p style={{ color: `${rs.badge}80`, fontSize: 10, fontFamily: '"DM Mono", monospace' }}>RISK SCORE</p>
                        </div>
                      </div>

                      {/* Status + bar */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Status text with SVG icon */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                          {(isCritical || isHigh) && <IconAlert size={14} color={rs.badge} />}
                          {isMedium && <IconEye size={14} color={rs.badge} />}
                          {isLow && <IconCheckCircle size={14} color={rs.badge} />}
                          <p style={{ color: rs.badge, fontSize: 13, fontWeight: 700 }}>{risk.statusText}</p>
                        </div>
                        <p style={{ color: isCritical ? '#f87171' : isHigh ? '#fb923c' : '#666', fontSize: 12, marginBottom: 10, fontFamily: '"DM Mono", monospace' }}>{risk.reason}</p>

                        {/* Flight Risk Index bar (renamed from Integration Progress) */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ color: '#333', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>Flight Risk Index · Mission {emp.mission_day}/7</span>
                            <span style={{ color: pct >= 70 ? G : pct >= 40 ? '#fbbf24' : '#f87171', fontWeight: 700, fontSize: 11, fontFamily: '"DM Mono", monospace' }}>{pct}% integrated</span>
                          </div>
                          <div style={{ height: 5, background: '#111', borderRadius: 4 }}>
                            <div style={{ height: '100%', background: pct >= 70 ? G : pct >= 40 ? '#fbbf24' : '#f87171', borderRadius: 4, width: `${pct}%`, transition: 'width .5s ease' }} />
                          </div>
                        </div>

                        {/* Tags */}
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                          <span style={{ background: '#111', color: '#444', fontSize: 11, padding: '3px 9px', borderRadius: 7, fontFamily: '"DM Mono", monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IconClock size={11} color="#444" />Last active: {emp.last_active || 'Never'}
                          </span>
                          {emp.staked_amount > 0 && (
                            <span style={{ background: '#1a0a3a', color: '#a78bfa', fontSize: 11, padding: '3px 9px', borderRadius: 7, fontFamily: '"DM Mono", monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <IconZap size={11} color="#a78bfa" />Staked
                            </span>
                          )}
                          {emp.critical_deadline_days !== null && (
                            <span style={{ background: '#1a0505', color: '#f87171', fontSize: 11, padding: '3px 9px', borderRadius: 7, fontFamily: '"DM Mono", monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <IconAlert size={11} color="#f87171" />Deadline in {emp.critical_deadline_days}d
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action button */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                        {(isCritical || isHigh) && (
                          <button
                            className={isCritical ? 'intervene-critical' : ''}
                            onClick={() => alert(`Check-in email would be sent to ${emp.name}`)}
                            style={{
                              background: isCritical ? '#f87171' : '#180e05',
                              border: `1px solid ${isCritical ? '#f87171' : '#3a2000'}`,
                              borderRadius: 9,
                              padding: '9px 16px',
                              color: isCritical ? '#1a0000' : '#fb923c',
                              fontWeight: 800,
                              fontSize: 12,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <IconMail size={13} color={isCritical ? '#1a0000' : '#fb923c'} />
                            Intervene Now
                          </button>
                        )}
                        {isLow && (
                          <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 9, padding: '7px 13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <IconCheckCircle size={13} color={G} />
                            <span style={{ color: G, fontSize: 11, fontWeight: 700 }}>On Track</span>
                          </div>
                        )}
                        {isMedium && (
                          <div style={{ background: '#1a1200', border: '1px solid #2a2000', borderRadius: 9, padding: '7px 13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <IconEye size={13} color="#fbbf24" />
                            <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>Monitoring</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* OVERVIEW TAB                                              */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  { Icon: IconAlert,       value: `${criticalCount}`, label: 'Critical Risk',  color: '#f87171', bg: '#1a0505', border: '#3a0f0f' },
                  { Icon: IconAlert,       value: `${highCount}`,     label: 'High Risk',      color: '#fb923c', bg: '#180e05', border: '#3a2000' },
                  { Icon: IconCheckCircle, value: `${onTrack}`,       label: 'On Track',       color: G,         bg: '#0a1a0a', border: '#1a3a1f' },
                  { Icon: IconBarChart,    value: `${avgIntegration}%`, label: 'Avg Integrated',color: '#60a5fa', bg: '#0a0f1a', border: '#1a2a3f' },
                ].map(({ Icon, value, label, color, bg, border }) => (
                  <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: 22 }}>
                    <Icon size={22} color={color} />
                    <p style={{ color, fontSize: 30, fontWeight: 900, letterSpacing: '-1px', marginBottom: 5, fontFamily: '"DM Mono", monospace', marginTop: 10 }}>{value}</p>
                    <p style={{ color: color + '80', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace' }}>{label}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: '#0a140a', border: '1px solid #1a3a1f', borderRadius: 18, padding: 28 }}>
                <p style={{ color: G, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: 20 }}>
                  Flight Risk ROI — What It Costs To Do Nothing
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {[
                    { label: 'Cost to rehire + relocate', value: '€15,000', sub: 'per failed expat hire', color: '#f87171' },
                    { label: `At-risk employees (${criticalCount + highCount} people)`, value: `€${(criticalCount + highCount) * 15000 / 1000}k`, sub: 'potential exposure', color: '#fbbf24' },
                    { label: 'Glotto prevents this for', value: `€${(employees.length * 99.99).toFixed(0)}/mo`, sub: 'entire team · 90% retention rate', color: G },
                  ].map(r => (
                    <div key={r.label} style={{ background: '#060e06', border: '1px solid #1a3a1f', borderRadius: 12, padding: 18 }}>
                      <p style={{ color: '#555', fontSize: 12, marginBottom: 8, lineHeight: 1.4 }}>{r.label}</p>
                      <p style={{ color: r.color, fontWeight: 900, fontSize: 26, letterSpacing: '-0.5px', marginBottom: 4, fontFamily: '"DM Mono", monospace' }}>{r.value}</p>
                      <p style={{ color: '#333', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>{r.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* EMPLOYEES TAB — "Flight Risk Index" column renamed         */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'employees' && (
            <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr', padding: '12px 22px', borderBottom: '1px solid #111' }}>
                {['Employee', 'Flight Risk', 'Flight Risk Index', 'Last Active'].map(h => (
                  <p key={h} style={{ color: '#333', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"DM Mono", monospace' }}>{h}</p>
                ))}
              </div>
              {sorted.map(emp => {
                const risk = emp.risk
                const rs = RISK_STYLE[risk.level]
                const pct = Math.round(((emp.mission_day - 1) / 7) * 100)
                const isCritical = risk.level === 'critical'
                const isHigh = risk.level === 'high'
                return (
                  <div key={emp.id} className="emp-row" style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr',
                    padding: '16px 22px', borderBottom: '1px solid #0d0d0d',
                    background: rs.rowBg,
                    borderLeft: (isCritical || isHigh) ? `3px solid ${rs.badge}` : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: `1px solid ${rs.border}` }}>{emp.flag}</div>
                      <div>
                        <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{emp.name}</p>
                        <p style={{ color: '#333', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>{emp.role}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {(isCritical || isHigh) && <IconAlert size={13} color={rs.badge} />}
                      {risk.level === 'medium' && <IconEye size={13} color={rs.badge} />}
                      {risk.level === 'low' && <IconCheckCircle size={13} color={rs.badge} />}
                      <span style={{ background: rs.badgeBg, color: rs.badge, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 7, border: `1px solid ${rs.badge}30` }}>{risk.statusText}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', paddingRight: 20 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 5, background: '#111', borderRadius: 4, marginBottom: 4 }}>
                          <div style={{ height: '100%', background: pct >= 70 ? G : pct >= 40 ? '#fbbf24' : '#f87171', borderRadius: 4, width: `${pct}%` }} />
                        </div>
                        <p style={{ color: '#444', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>Mission {emp.mission_day}/7 · {pct}%</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: (isCritical || isHigh) ? rs.badge : '#444', fontSize: 12, fontFamily: '"DM Mono", monospace' }}>{emp.last_active || 'Never'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SETTINGS / INTEGRATIONS TAB                               */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 18, padding: 28 }}>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Milestone Notifications</p>
                <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, marginBottom: 22 }}>Get automatic pings when employees complete missions, become at-risk, or achieve full integration.</p>

                <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                  {(['slack', 'teams'] as const).map(t => (
                    <button key={t} onClick={() => setWebhookType(t)} style={{ flex: 1, background: webhookType === t ? '#0f2a1a' : '#111', border: `2px solid ${webhookType === t ? '#1a3a1f' : '#1a1a1a'}`, borderRadius: 12, padding: '12px 16px', color: webhookType === t ? G : '#444', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {t === 'slack' ? 'Slack' : 'Microsoft Teams'}
                    </button>
                  ))}
                </div>

                <label style={{ color: '#555', fontSize: 12, fontWeight: 700, fontFamily: '"DM Mono", monospace', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {webhookType === 'slack' ? 'Slack Incoming Webhook URL' : 'Teams Webhook URL'}
                </label>
                <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder={webhookType === 'slack' ? 'https://hooks.slack.com/services/...' : 'https://outlook.office.com/webhook/...'} style={{ width: '100%', background: '#111', border: '1.5px solid #1a1a1a', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 14, fontFamily: '"DM Mono", monospace', marginBottom: 14, transition: 'border-color .15s' }} />

                {webhookMsg && (
                  <div style={{ background: webhookMsg.startsWith('✓') ? '#0f2a1a' : '#1a0505', border: `1px solid ${webhookMsg.startsWith('✓') ? '#1a3a1f' : '#3a0f0f'}`, borderRadius: 10, padding: '10px 16px', marginBottom: 14 }}>
                    <p style={{ color: webhookMsg.startsWith('✓') ? G : '#f87171', fontSize: 13, fontWeight: 700 }}>{webhookMsg}</p>
                  </div>
                )}

                <button onClick={testWebhook} disabled={loadingHook || !webhookUrl.trim()} style={{ width: '100%', background: !webhookUrl.trim() ? '#111' : G, color: !webhookUrl.trim() ? '#333' : '#050f06', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {loadingHook ? 'Sending...' : 'Test Webhook'}
                </button>
              </div>

              <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 18, padding: 24 }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>What triggers a notification?</p>
                {[
                  { t: 'Mission Complete',   e: '*Sarah Mitchell* completed *Get Your Tax ID*. Now *43% integrated*.', c: G },
                  { t: 'Flight Risk Alert',  e: '*Tom Eriksson* has been inactive 8 days. Only 14% integrated. Intervention recommended.', c: '#f87171' },
                  { t: 'Fully Integrated',   e: '*Priya Sharma* completed all 7 missions! 100% integrated in Athens.', c: '#a78bfa' },
                ].map(n => (
                  <div key={n.t} style={{ marginBottom: 12, padding: '14px 16px', background: '#111', borderRadius: 12, borderLeft: `3px solid ${n.c}` }}>
                    <p style={{ color: n.c, fontWeight: 700, fontSize: 12, fontFamily: '"DM Mono", monospace', marginBottom: 6 }}>{n.t}</p>
                    <p style={{ color: '#555', fontSize: 13, fontFamily: '"DM Mono", monospace', lineHeight: 1.5 }}>{n.e}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}