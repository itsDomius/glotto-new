// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/hr/page.tsx — FULL REPLACEMENT
// REFRAME: "Flight Risk" dashboard — urgency-first, not progress bars
// ════════════════════════════════════════════════════════════════════════════
'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const G = '#4ade80'

type Employee = {
  id: string; name: string; email: string; city: string; flag: string
  role: string; mission_day: number; target_language: string
  subscription_status: string; onboarding_complete: boolean
  sessions_completed: number; last_active: string | null
  staked_amount: number; days_since_active: number
  critical_deadline_days: number | null // days until critical mission deadline
}

// ── Flight Risk calculation ──────────────────────────────────────────────────
function calcFlightRisk(e: Employee): { level: 'critical' | 'high' | 'medium' | 'low'; score: number; reason: string; label: string } {
  const pct = ((e.mission_day - 1) / 7) * 100

  // Critical: has not started OR critical deadline missed OR stalled >7 days
  if (!e.onboarding_complete) return { level: 'critical', score: 95, reason: 'Never completed onboarding', label: '🔴 Critical Risk' }
  if (e.days_since_active >= 7 && pct < 50) return { level: 'critical', score: 90, reason: `Inactive ${e.days_since_active}d — integration stalled`, label: '🔴 Critical Risk' }
  if (e.critical_deadline_days !== null && e.critical_deadline_days <= 3) return { level: 'critical', score: 88, reason: `Tax ID deadline in ${e.critical_deadline_days}d`, label: '🔴 Critical Risk' }

  // High: low integration, recently inactive
  if (pct < 30 && e.days_since_active >= 3) return { level: 'high', score: 72, reason: `Only ${Math.round(pct)}% integrated, ${e.days_since_active}d inactive`, label: '🟠 High Risk' }
  if (e.mission_day <= 2 && e.days_since_active >= 4) return { level: 'high', score: 65, reason: 'Stuck on first 2 missions', label: '🟠 High Risk' }

  // Medium: progressing but slow
  if (pct < 60 && e.days_since_active >= 2) return { level: 'medium', score: 40, reason: 'Below integration velocity', label: '🟡 Monitor' }

  // Low: on track
  const velocity = e.sessions_completed >= 4 || e.staked_amount > 0
  if (velocity) return { level: 'low', score: 8, reason: 'High integration velocity', label: '🟢 On Track' }
  return { level: 'low', score: 20, reason: `${Math.round(pct)}% integrated`, label: '🟢 Progressing' }
}

const RISK_STYLE = {
  critical: { bg: '#180505', border: '#3a0f0f', badge: '#f87171', badgeBg: '#2a0505' },
  high:     { bg: '#180e05', border: '#3a2000', badge: '#fb923c', badgeBg: '#2a1000' },
  medium:   { bg: '#141005', border: '#2a2000', badge: '#fbbf24', badgeBg: '#1a1200' },
  low:      { bg: 'transparent', border: '#0d0d0d', badge: '#4ade80', badgeBg: '#0a1a0a' },
}

// Demo data
const DEMO_EMPLOYEES: Employee[] = [
  { id:'1', name:'Sarah Mitchell',  email:'sarah.m@teleperformance.com',  city:'athens',     flag:'🇬🇷', role:'Customer Success Mgr',  mission_day:6, target_language:'greek',     subscription_status:'active', onboarding_complete:true,  sessions_completed:5, last_active:'2h ago',  staked_amount:30, days_since_active:0, critical_deadline_days:null },
  { id:'2', name:'James Kowalski',  email:'j.kowalski@teleperformance.com', city:'athens',   flag:'🇬🇷', role:'Operations Analyst',      mission_day:3, target_language:'greek',     subscription_status:'active', onboarding_complete:true,  sessions_completed:2, last_active:'1d ago',  staked_amount:0,  days_since_active:1, critical_deadline_days:2 },
  { id:'3', name:'Priya Sharma',    email:'p.sharma@teleperformance.com',  city:'athens',     flag:'🇬🇷', role:'Data Engineer',           mission_day:7, target_language:'greek',     subscription_status:'active', onboarding_complete:true,  sessions_completed:6, last_active:'30m ago', staked_amount:30, days_since_active:0, critical_deadline_days:null },
  { id:'4', name:'Marco Delgado',   email:'m.delgado@teleperformance.com', city:'berlin',    flag:'🇩🇪', role:'Product Designer',         mission_day:1, target_language:'german',    subscription_status:'free',   onboarding_complete:false, sessions_completed:0, last_active:'5d ago',  staked_amount:0,  days_since_active:5, critical_deadline_days:null },
  { id:'5', name:'Aisha Okonkwo',   email:'a.okonkwo@teleperformance.com', city:'amsterdam', flag:'🇳🇱', role:'Marketing Lead',           mission_day:4, target_language:'dutch',     subscription_status:'active', onboarding_complete:true,  sessions_completed:3, last_active:'3h ago',  staked_amount:0,  days_since_active:0, critical_deadline_days:null },
  { id:'6', name:'Tom Eriksson',    email:'t.eriksson@teleperformance.com', city:'athens',   flag:'🇬🇷', role:'Engineering Manager',      mission_day:2, target_language:'greek',     subscription_status:'free',   onboarding_complete:true,  sessions_completed:1, last_active:'8d ago',  staked_amount:0,  days_since_active:8, critical_deadline_days:5 },
]

type Tab = 'risk' | 'overview' | 'employees' | 'settings'

export default function HRPage() {
  const router = useRouter()
  const [employees] = useState<Employee[]>(DEMO_EMPLOYEES)
  const [activeTab, setActiveTab] = useState<Tab>('risk')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookType, setWebhookType] = useState<'slack'|'teams'>('slack')
  const [webhookMsg, setWebhookMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'risk'|'name'|'progress'>('risk')

  const risks = employees.map(e => ({ ...e, risk: calcFlightRisk(e) }))
  const sorted = [...risks].sort((a, b) => {
    if (sortBy === 'risk')     return b.risk.score - a.risk.score
    if (sortBy === 'name')     return a.name.localeCompare(b.name)
    if (sortBy === 'progress') return b.mission_day - a.mission_day
    return 0
  })

  const criticalCount = risks.filter(r => r.risk.level === 'critical').length
  const highCount     = risks.filter(r => r.risk.level === 'high').length
  const onTrack       = risks.filter(r => r.risk.level === 'low').length
  const avgIntegration = Math.round(risks.reduce((s,r) => s + ((r.mission_day-1)/7)*100, 0) / risks.length)

  const testWebhook = async () => {
    if (!webhookUrl.trim()) return
    setLoading(true)
    try {
      await fetch('/api/webhook/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ webhookUrl, webhookType }) })
      setWebhookMsg('✓ Test message sent!')
    } catch { setWebhookMsg('Failed to send') }
    finally { setLoading(false); setTimeout(() => setWebhookMsg(''), 4000) }
  }

  const TABS: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'risk',      label: 'Flight Risk',  icon: '🎯', badge: criticalCount + highCount },
    { id: 'overview',  label: 'Overview',     icon: '📊' },
    { id: 'employees', label: 'All Employees',icon: '👥' },
    { id: 'settings',  label: 'Integrations', icon: '⚙️' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#070707', fontFamily: '"DM Sans", -apple-system, sans-serif', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}
        .nav{transition:all .15s;border:none;cursor:pointer;width:100%;text-align:left;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:9px;font-size:15px}
        .nav:hover{background:#141414!important}
        .row{transition:background .1s;cursor:pointer}
        .row:hover{filter:brightness(1.08)}
        .pulse-dot{animation:pulse 1.5s ease infinite}
        .content{animation:fadeUp .2s ease both}
        .sb::-webkit-scrollbar{width:4px}.sb::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:4px}
        input:focus{outline:none;border-color:#4ade80!important}
        .sort-btn{transition:all .1s;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;padding:5px 12px;border-radius:8px}
        .sort-btn:hover{opacity:.8}
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width: 230, background: '#050505', borderRight: '1px solid #0d0d0d', display: 'flex', flexDirection: 'column', padding: '24px 13px', flexShrink: 0 }}>
        <div style={{ marginBottom: 28, padding: '4px 10px' }}>
          <div style={{ color: G, fontWeight: 800, fontSize: 21 }}>Glotto</div>
          <div style={{ color: '#2a2a2a', fontSize: 11, fontFamily: '"DM Mono", monospace', marginTop: 2 }}>HR Command Center</div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {TABS.map(t => {
            const on = activeTab === t.id
            return (
              <button key={t.id} className="nav" onClick={() => setActiveTab(t.id)} style={{ background: on ? '#111' : 'transparent', color: on ? '#fff' : '#2a2a2a', fontWeight: on ? 700 : 400, position: 'relative' }}>
                {on && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: G, borderRadius: '0 3px 3px 0' }} />}
                <span>{t.icon}</span>{t.label}
                {t.badge != null && t.badge > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#f87171', color: '#fff', borderRadius: 10, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, padding: '0 5px' }}>{t.badge}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div style={{ borderTop: '1px solid #0d0d0d', paddingTop: 14 }}>
          <button className="nav" onClick={() => router.push('/dashboard')} style={{ background: 'transparent', color: '#2a2a2a', fontWeight: 400, fontSize: 14 }}>← Back to App</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="sb" style={{ flex: 1, overflowY: 'auto', background: '#0a0a0a' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(10,10,10,.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #0d0d0d', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#2a2a2a', fontSize: 11, fontFamily: '"DM Mono", monospace', letterSpacing: 2, textTransform: 'uppercase' }}>Teleperformance · HR</p>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              {{ risk: '🎯 Flight Risk Radar', overview: '📊 Overview', employees: '👥 All Employees', settings: '⚙️ Integrations' }[activeTab]}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {criticalCount > 0 && (
              <div style={{ background: '#1a0505', border: '1px solid #3a0f0f', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="pulse-dot" style={{ display: 'inline-block', width: 7, height: 7, background: '#f87171', borderRadius: '50%' }} />
                <span style={{ color: '#f87171', fontSize: 12, fontWeight: 700 }}>{criticalCount} Critical</span>
              </div>
            )}
            <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 20, padding: '6px 14px' }}>
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

              {/* Sort controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#333', fontSize: 12, fontFamily: '"DM Mono", monospace' }}>SORT:</span>
                {([['risk','By Risk'],['name','By Name'],['progress','By Progress']] as const).map(([key, label]) => (
                  <button key={key} className="sort-btn" onClick={() => setSortBy(key)}
                    style={{ background: sortBy === key ? '#111' : 'transparent', border: `1px solid ${sortBy === key ? '#1a1a1a' : '#0d0d0d'}`, color: sortBy === key ? '#fff' : '#333', fontWeight: sortBy === key ? 700 : 400 }}>
                    {label}
                  </button>
                ))}
              </div>

              {sorted.map((emp, idx) => {
                const risk = emp.risk
                const style = RISK_STYLE[risk.level]
                const pct = Math.round(((emp.mission_day - 1) / 7) * 100)
                const isCritical = risk.level === 'critical'
                const isHigh = risk.level === 'high'

                return (
                  <div key={emp.id} className="row" style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: 16, padding: '20px 24px', animation: `slideIn .25s ease ${idx * 0.04}s both`, borderLeft: isCritical ? `4px solid #f87171` : isHigh ? `4px solid #fb923c` : `1px solid ${style.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      {/* Employee info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#111', border: `1px solid ${style.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{emp.flag}</div>
                        <div>
                          <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{emp.name}</p>
                          <p style={{ color: '#444', fontSize: 12, fontFamily: '"DM Mono", monospace' }}>{emp.role}</p>
                          <p style={{ color: '#222', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>{emp.city} · {emp.target_language}</p>
                        </div>
                      </div>

                      {/* Risk badge */}
                      <div style={{ flexShrink: 0 }}>
                        <div style={{ background: style.badgeBg, border: `1px solid ${style.badge}30`, borderRadius: 10, padding: '6px 14px', textAlign: 'center' }}>
                          <p style={{ color: style.badge, fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>{risk.label}</p>
                          <p style={{ color: style.badge, fontWeight: 900, fontSize: 22, fontFamily: '"DM Mono", monospace', lineHeight: 1 }}>{risk.score}</p>
                          <p style={{ color: `${style.badge}80`, fontSize: 10, fontFamily: '"DM Mono", monospace' }}>RISK SCORE</p>
                        </div>
                      </div>

                      {/* Risk reason + integration */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Reason */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          {isCritical && <span className="pulse-dot" style={{ display: 'inline-block', width: 7, height: 7, background: '#f87171', borderRadius: '50%', flexShrink: 0 }} />}
                          <p style={{ color: isCritical ? '#f87171' : isHigh ? '#fb923c' : '#888', fontSize: 13, fontWeight: 600 }}>{risk.reason}</p>
                        </div>

                        {/* Integration mini-bar */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ color: '#333', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>Mission {emp.mission_day}/7</span>
                            <span style={{ color: pct >= 70 ? G : pct >= 40 ? '#fbbf24' : '#f87171', fontWeight: 700, fontSize: 11, fontFamily: '"DM Mono", monospace' }}>{pct}% integrated</span>
                          </div>
                          <div style={{ height: 5, background: '#111', borderRadius: 4 }}>
                            <div style={{ height: '100%', background: pct >= 70 ? G : pct >= 40 ? '#fbbf24' : '#f87171', borderRadius: 4, width: `${pct}%`, transition: 'width .5s ease' }} />
                          </div>
                        </div>

                        {/* Tags */}
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                          <span style={{ background: '#111', color: '#444', fontSize: 11, padding: '3px 9px', borderRadius: 7, fontFamily: '"DM Mono", monospace' }}>Last active: {emp.last_active || 'Never'}</span>
                          {emp.staked_amount > 0 && <span style={{ background: '#1a0a3a', color: '#a78bfa', fontSize: 11, padding: '3px 9px', borderRadius: 7, fontFamily: '"DM Mono", monospace' }}>⚡ Staked</span>}
                          {emp.critical_deadline_days !== null && <span style={{ background: '#1a0505', color: '#f87171', fontSize: 11, padding: '3px 9px', borderRadius: 7, fontFamily: '"DM Mono", monospace' }}>⏰ Deadline in {emp.critical_deadline_days}d</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                        {(isCritical || isHigh) && (
                          <button onClick={() => alert(`Check-in email would be sent to ${emp.name}`)}
                            style={{ background: isCritical ? '#1a0505' : '#180e05', border: `1px solid ${isCritical ? '#3a0f0f' : '#3a2000'}`, borderRadius: 9, padding: '8px 14px', color: isCritical ? '#f87171' : '#fb923c', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            📧 Intervene
                          </button>
                        )}
                        {risk.level === 'low' && (
                          <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 9, padding: '6px 12px', textAlign: 'center' }}>
                            <span style={{ color: G, fontSize: 11, fontWeight: 700 }}>✓ On Track</span>
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
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  { icon: '🔴', value: `${criticalCount}`, label: 'Critical Risk',    color: '#f87171', bg: '#1a0505', border: '#3a0f0f' },
                  { icon: '🟠', value: `${highCount}`,     label: 'High Risk',        color: '#fb923c', bg: '#180e05', border: '#3a2000' },
                  { icon: '🟢', value: `${onTrack}`,       label: 'On Track',         color: G,         bg: '#0a1a0a', border: '#1a3a1f' },
                  { icon: '📊', value: `${avgIntegration}%`, label: 'Avg Integrated', color: '#60a5fa', bg: '#0a0f1a', border: '#1a2a3f' },
                ].map(k => (
                  <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 16, padding: 22 }}>
                    <span style={{ fontSize: 24, display: 'block', marginBottom: 10 }}>{k.icon}</span>
                    <p style={{ color: k.color, fontSize: 30, fontWeight: 900, letterSpacing: '-1px', marginBottom: 5, fontFamily: '"DM Mono", monospace' }}>{k.value}</p>
                    <p style={{ color: k.color + '80', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace' }}>{k.label}</p>
                  </div>
                ))}
              </div>

              {/* ROI Calculator */}
              <div style={{ background: '#0a140a', border: '1px solid #1a3a1f', borderRadius: 18, padding: 28 }}>
                <p style={{ color: G, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: 20 }}>💰 Flight Risk ROI — What It Costs To Do Nothing</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {[
                    { label: 'Cost to rehire + relocate', value: '€15,000', sub: 'per failed expat hire', color: '#f87171' },
                    { label: `At-risk employees (${criticalCount + highCount} people)`, value: `€${(criticalCount + highCount) * 15000 / 1000}k`, sub: 'potential exposure', color: '#fbbf24' },
                    { label: 'Glotto prevents this for', value: `€${employees.length * 99.99 * 12 < 1000 ? (employees.length * 99.99 * 12).toFixed(0) : (employees.length * 99.99).toFixed(0) + '/mo'}`, sub: 'entire team · 90% retention rate', color: G },
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
          {/* EMPLOYEES TAB                                             */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'employees' && (
            <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr', padding: '12px 22px', borderBottom: '1px solid #111' }}>
                {['Employee', 'Flight Risk', 'Integration', 'Last Active'].map(h => (
                  <p key={h} style={{ color: '#333', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"DM Mono", monospace' }}>{h}</p>
                ))}
              </div>
              {sorted.map(emp => {
                const risk = emp.risk; const style = RISK_STYLE[risk.level]
                const pct = Math.round(((emp.mission_day-1)/7)*100)
                return (
                  <div key={emp.id} className="row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr', padding: '16px 22px', borderBottom: '1px solid #0d0d0d', background: style.bg, borderLeft: risk.level === 'critical' ? '3px solid #f87171' : risk.level === 'high' ? '3px solid #fb923c' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: `1px solid ${style.border}` }}>{emp.flag}</div>
                      <div>
                        <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{emp.name}</p>
                        <p style={{ color: '#333', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>{emp.role}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ background: style.badgeBg, color: style.badge, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: `1px solid ${style.badge}30` }}>{risk.label}</span>
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
                      <span style={{ color: risk.level === 'critical' ? '#f87171' : '#444', fontSize: 12, fontFamily: '"DM Mono", monospace' }}>{emp.last_active || 'Never'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SETTINGS TAB                                              */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 18, padding: 28 }}>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 17, marginBottom: 6 }}>🔔 Milestone Notifications</p>
                <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, marginBottom: 22 }}>Get automatic pings when employees complete missions, become at-risk, or achieve full integration.</p>

                <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                  {(['slack','teams'] as const).map(t => (
                    <button key={t} onClick={() => setWebhookType(t)} style={{ flex: 1, background: webhookType===t ? '#0f2a1a' : '#111', border: `2px solid ${webhookType===t ? '#1a3a1f' : '#1a1a1a'}`, borderRadius: 12, padding: '12px 16px', color: webhookType===t ? G : '#444', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {t === 'slack' ? '💬 Slack' : '🟦 Microsoft Teams'}
                    </button>
                  ))}
                </div>

                <label style={{ color: '#555', fontSize: 12, fontWeight: 700, fontFamily: '"DM Mono", monospace', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {webhookType === 'slack' ? 'Slack Incoming Webhook URL' : 'Teams Webhook URL'}
                </label>
                <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
                  placeholder={webhookType === 'slack' ? 'https://hooks.slack.com/services/...' : 'https://outlook.office.com/webhook/...'}
                  style={{ width: '100%', background: '#111', border: '1.5px solid #1a1a1a', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 14, fontFamily: '"DM Mono", monospace', marginBottom: 14, transition: 'border-color .15s' }}
                />

                {webhookMsg && <div style={{ background: webhookMsg.startsWith('✓') ? '#0f2a1a' : '#1a0505', border: `1px solid ${webhookMsg.startsWith('✓') ? '#1a3a1f' : '#3a0f0f'}`, borderRadius: 10, padding: '10px 16px', marginBottom: 14 }}><p style={{ color: webhookMsg.startsWith('✓') ? G : '#f87171', fontSize: 13, fontWeight: 700 }}>{webhookMsg}</p></div>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={testWebhook} disabled={loading || !webhookUrl.trim()} style={{ flex: 1, background: !webhookUrl.trim() ? '#111' : G, color: !webhookUrl.trim() ? '#333' : '#050f06', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {loading ? '...' : '🧪 Test Webhook'}
                  </button>
                </div>
              </div>

              {/* What fires */}
              <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 18, padding: 24 }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>What triggers a notification?</p>
                {[
                  { t: '✅ Mission Complete', e: '✅ *Sarah Mitchell* completed *Get Your Tax ID*. Now *43% integrated*.', c: G },
                  { t: '🔴 Flight Risk Alert', e: '🔴 *Tom Eriksson* has been inactive 8 days. Only 14% integrated. Intervention recommended.', c: '#f87171' },
                  { t: '🎉 Fully Integrated', e: '🎉 *Priya Sharma* completed all 7 missions! 100% integrated in Athens 🇬🇷', c: '#a78bfa' },
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