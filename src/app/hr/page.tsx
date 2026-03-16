// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/hr/page.tsx
// ════════════════════════════════════════════════════════════════════════════
'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const G = '#4ade80'

type Employee = {
  id: string
  name: string
  email: string
  city: string
  flag: string
  role: string
  mission_day: number
  current_level: string
  target_language: string
  subscription_status: string
  onboarding_complete: boolean
  sessions_completed: number
  last_active: string | null
  staked_amount: number
}

type Company = {
  id: string
  name: string
  webhook_url: string | null
  webhook_type: 'slack' | 'teams' | null
}

const CITY_FLAGS: Record<string, string> = {
  athens: '🇬🇷', berlin: '🇩🇪', lisbon: '🇵🇹', amsterdam: '🇳🇱',
  madrid: '🇪🇸', paris: '🇫🇷', milan: '🇮🇹', barcelona: '🇪🇸',
  prague: '🇨🇿', warsaw: '🇵🇱', stockholm: '🇸🇪', other: '🌍',
}

function IntegrationBar({ pct, size = 'normal' }: { pct: number, size?: string }) {
  const color = pct >= 80 ? G : pct >= 40 ? '#fbbf24' : '#f87171'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'small' ? 8 : 10 }}>
      <div style={{ flex: 1, height: size === 'small' ? 4 : 6, background: '#111', borderRadius: 4 }}>
        <div style={{ height: '100%', background: color, borderRadius: 4, width: `${pct}%`, transition: 'width .5s ease' }} />
      </div>
      <span style={{ color, fontWeight: 800, fontSize: size === 'small' ? 11 : 13, fontFamily: '"DM Mono", monospace', minWidth: 36 }}>{pct}%</span>
    </div>
  )
}

function SparklineSVG({ data }: { data: number[] }) {
  const w = 60, h = 24
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={G} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HRPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'alerts' | 'settings'>('overview')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookType, setWebhookType] = useState<'slack' | 'teams'>('slack')
  const [webhookSaving, setWebhookSaving] = useState(false)
  const [webhookTesting, setWebhookTesting] = useState(false)
  const [webhookMsg, setWebhookMsg] = useState('')
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setCurrentUser(user)

      // Load HR manager's profile to get company
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()

      // Load or create company
      let companyData: Company | null = null
      if (profile?.company_id) {
        const { data } = await supabase.from('companies').select('*').eq('id', profile.company_id).single()
        companyData = data
      }
      
      if (!companyData) {
        // Demo mode: show mock data
        companyData = { id: 'demo', name: 'Teleperformance', webhook_url: null, webhook_type: null }
      }

      setCompany(companyData)
      if (companyData.webhook_url) setWebhookUrl(companyData.webhook_url)
      if (companyData.webhook_type) setWebhookType(companyData.webhook_type)

      // Load employees
      let empData: Employee[] = []
      if (profile?.company_id) {
        const { data: realEmps } = await supabase
          .from('profiles')
          .select('*')
          .eq('company_id', profile.company_id)
          .neq('user_id', user.id)
        
        if (realEmps && realEmps.length > 0) {
          empData = realEmps.map(e => ({
            id: e.user_id,
            name: e.full_name || 'Unknown',
            email: '',
            city: e.city || 'other',
            flag: CITY_FLAGS[e.city] || '🌍',
            role: 'Employee',
            mission_day: e.mission_day || 1,
            current_level: e.current_level || 'A1',
            target_language: e.target_language || 'greek',
            subscription_status: e.subscription_status || 'free',
            onboarding_complete: e.onboarding_complete || false,
            sessions_completed: 0,
            last_active: null,
            staked_amount: e.staked_amount || 0,
          }))
        }
      }

      // Always show demo employees for investor demos
      if (empData.length === 0) {
        empData = [
          { id: '1', name: 'Sarah Mitchell', email: 'sarah.m@teleperformance.com', city: 'athens', flag: '🇬🇷', role: 'Customer Success Manager', mission_day: 6, current_level: 'B1', target_language: 'greek', subscription_status: 'active', onboarding_complete: true, sessions_completed: 5, last_active: '2h ago', staked_amount: 30 },
          { id: '2', name: 'James Kowalski', email: 'j.kowalski@teleperformance.com', city: 'athens', flag: '🇬🇷', role: 'Operations Analyst', mission_day: 3, current_level: 'A1', target_language: 'greek', subscription_status: 'active', onboarding_complete: true, sessions_completed: 2, last_active: '1d ago', staked_amount: 0 },
          { id: '3', name: 'Priya Sharma', email: 'p.sharma@teleperformance.com', city: 'athens', flag: '🇬🇷', role: 'Data Engineer', mission_day: 7, current_level: 'B2', target_language: 'greek', subscription_status: 'active', onboarding_complete: true, sessions_completed: 6, last_active: '30m ago', staked_amount: 30 },
          { id: '4', name: 'Marco Delgado', email: 'm.delgado@teleperformance.com', city: 'berlin', flag: '🇩🇪', role: 'Product Designer', mission_day: 1, current_level: 'A1', target_language: 'german', subscription_status: 'free', onboarding_complete: false, sessions_completed: 0, last_active: '5d ago', staked_amount: 0 },
          { id: '5', name: 'Aisha Okonkwo', email: 'a.okonkwo@teleperformance.com', city: 'amsterdam', flag: '🇳🇱', role: 'Marketing Lead', mission_day: 4, current_level: 'A2', target_language: 'dutch', subscription_status: 'active', onboarding_complete: true, sessions_completed: 3, last_active: '3h ago', staked_amount: 0 },
          { id: '6', name: 'Tom Eriksson', email: 't.eriksson@teleperformance.com', city: 'athens', flag: '🇬🇷', role: 'Engineering Manager', mission_day: 2, current_level: 'A1', target_language: 'greek', subscription_status: 'free', onboarding_complete: true, sessions_completed: 1, last_active: '2d ago', staked_amount: 0 },
        ]
      }

      setEmployees(empData)
      setLoading(false)
    }
    load()
  }, [router])

  const getIntegrationPct = (e: Employee) => Math.round(((e.mission_day - 1) / 7) * 100)
  const getAtRiskEmployees = () => employees.filter(e => {
    const pct = getIntegrationPct(e)
    return pct < 30 || !e.onboarding_complete
  })

  const avgIntegration = employees.length
    ? Math.round(employees.reduce((sum, e) => sum + getIntegrationPct(e), 0) / employees.length)
    : 0

  const saveWebhook = async () => {
    if (!webhookUrl.trim() || !company) return
    setWebhookSaving(true)
    try {
      if (company.id !== 'demo') {
        await supabase.from('companies').update({ webhook_url: webhookUrl, webhook_type: webhookType }).eq('id', company.id)
      }
      setWebhookMsg('✓ Webhook saved successfully')
      setTimeout(() => setWebhookMsg(''), 3000)
    } catch {
      setWebhookMsg('Failed to save webhook')
    } finally {
      setWebhookSaving(false)
    }
  }

  const testWebhook = async () => {
    if (!webhookUrl.trim()) return
    setWebhookTesting(true)
    try {
      await fetch('/api/webhook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, webhookType }),
      })
      setWebhookMsg('✓ Test message sent! Check your Slack/Teams channel.')
    } catch {
      setWebhookMsg('Failed to send test message')
    } finally {
      setWebhookTesting(false)
      setTimeout(() => setWebhookMsg(''), 4000)
    }
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: G, animation: 'spin .8s linear infinite' }} />
    </main>
  )

  const atRisk = getAtRiskEmployees()

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#070707', fontFamily: '"DM Sans", -apple-system, sans-serif', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .tab-in{animation:fadeUp .2s ease both}
        .nav-btn{transition:all .15s;border:none;cursor:pointer;width:100%;text-align:left;font-family:inherit;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;font-size:14px}
        .nav-btn:hover{background:#141414!important}
        .row:hover{background:#0e0e0e!important}
        .row{transition:background .1s}
        .sb::-webkit-scrollbar{display:none}.sb{-ms-overflow-style:none;scrollbar-width:none}
        input:focus,textarea:focus{outline:none;border-color:#4ade80!important}
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 220, background: '#050505', borderRight: '1px solid #0d0d0d', display: 'flex', flexDirection: 'column', padding: '24px 12px', flexShrink: 0 }}>
        <div style={{ marginBottom: 28, padding: '4px 10px' }}>
          <div style={{ color: G, fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>Glotto</div>
          <div style={{ color: '#2a2a2a', fontSize: 10, fontFamily: '"DM Mono", monospace', marginTop: 2 }}>HR Command Center</div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {([
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'employees', label: 'Employees', icon: '👥' },
            { id: 'alerts', label: `Alerts ${atRisk.length > 0 ? `(${atRisk.length})` : ''}`, icon: '🔔' },
            { id: 'settings', label: 'Integrations', icon: '⚙️' },
          ] as const).map(item => {
            const on = activeTab === item.id
            return (
              <button key={item.id} className="nav-btn" onClick={() => setActiveTab(item.id)} style={{ background: on ? '#111' : 'transparent', color: on ? '#fff' : '#2a2a2a', fontWeight: on ? 700 : 400, position: 'relative' }}>
                {on && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, background: G, borderRadius: '0 3px 3px 0' }} />}
                <span>{item.icon}</span>
                {item.label}
                {item.id === 'alerts' && atRisk.length > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#f87171', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{atRisk.length}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div style={{ borderTop: '1px solid #0d0d0d', paddingTop: 14 }}>
          <button onClick={() => router.push('/dashboard')} className="nav-btn" style={{ background: 'transparent', color: '#2a2a2a', fontWeight: 400, fontSize: 13 }}>
            <span>←</span> Back to App
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="sb" style={{ flex: 1, overflowY: 'auto', background: '#0a0a0a' }}>

        {/* Top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(10,10,10,.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #0d0d0d', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#2a2a2a', fontSize: 11, fontFamily: '"DM Mono", monospace', letterSpacing: 2, textTransform: 'uppercase' }}>{company?.name || 'Your Company'}</p>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
              {{ overview: 'Overview', employees: 'Employees', alerts: 'At-Risk Alerts', settings: 'Integrations' }[activeTab]}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12 }}>👥</span>
              <span style={{ color: '#888', fontSize: 12, fontWeight: 600 }}>{employees.length} expats</span>
            </div>
            <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 20, padding: '6px 14px' }}>
              <span style={{ color: G, fontSize: 12, fontWeight: 700 }}>{avgIntegration}% avg integrated</span>
            </div>
          </div>
        </div>

        <div className="tab-in" style={{ padding: '32px 40px', maxWidth: 900 }}>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { icon: '✅', value: `${employees.filter(e => getIntegrationPct(e) >= 80).length}`, label: 'Fully Integrated', color: G },
                  { icon: '⚡', value: `${employees.filter(e => getIntegrationPct(e) >= 30 && getIntegrationPct(e) < 80).length}`, label: 'In Progress', color: '#fbbf24' },
                  { icon: '⚠️', value: `${atRisk.length}`, label: 'At Risk', color: '#f87171' },
                  { icon: '💰', value: `€${employees.filter(e => e.staked_amount > 0).length * 30}`, label: 'Staked (Committed)', color: '#a78bfa' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#0e0e0e', border: '1px solid #111', borderRadius: 16, padding: 20 }}>
                    <span style={{ fontSize: 22, display: 'block', marginBottom: 10 }}>{k.icon}</span>
                    <p style={{ color: k.color, fontSize: 28, fontWeight: 900, letterSpacing: '-1px', marginBottom: 4 }}>{k.value}</p>
                    <p style={{ color: '#333', fontSize: 11, fontFamily: '"DM Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Integration progress by employee */}
              <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 16, padding: 24 }}>
                <p style={{ color: '#333', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: 18 }}>Team Integration Progress</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[...employees].sort((a, b) => getIntegrationPct(b) - getIntegrationPct(a)).map(e => {
                    const pct = getIntegrationPct(e)
                    return (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{e.flag}</div>
                        <div style={{ width: 120, flexShrink: 0 }}>
                          <p style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{e.name.split(' ')[0]}</p>
                          <p style={{ color: '#333', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>{e.city}</p>
                        </div>
                        <div style={{ flex: 1 }}>
                          <IntegrationBar pct={pct} size="small" />
                        </div>
                        <p style={{ color: '#444', fontSize: 11, fontFamily: '"DM Mono", monospace', width: 60, textAlign: 'right', flexShrink: 0 }}>Day {e.mission_day}/7</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ROI calculator */}
              <div style={{ background: '#0a140a', border: '1px solid #1a3a1f', borderRadius: 16, padding: 24 }}>
                <p style={{ color: G, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: 16 }}>💰 ROI Calculator</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Cost to rehire & relocate (avg)', value: '€15,000', sub: 'per failed expat', color: '#f87171' },
                    { label: 'Glotto annual cost', value: `€${employees.length * 99.99 * 12 < 1000 ? (employees.length * 99.99 * 12).toFixed(0) : (employees.length * 99.99 * 12 / 1000).toFixed(1) + 'k'}`, sub: `${employees.length} employees × €99.99/mo`, color: '#fbbf24' },
                    { label: 'Net savings per prevented churn', value: `€${(15000 - employees.length * 99.99 * 12).toFixed(0)}`, sub: 'per employee retained', color: G },
                  ].map(r => (
                    <div key={r.label} style={{ background: '#060e06', border: '1px solid #1a3a1f', borderRadius: 12, padding: 16 }}>
                      <p style={{ color: '#555', fontSize: 11, marginBottom: 8, lineHeight: 1.4 }}>{r.label}</p>
                      <p style={{ color: r.color, fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px', marginBottom: 4 }}>{r.value}</p>
                      <p style={{ color: '#333', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>{r.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── EMPLOYEES TAB ── */}
          {activeTab === 'employees' && (
            <div>
              <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 80px', gap: 0, padding: '12px 20px', borderBottom: '1px solid #111' }}>
                  {['Employee', 'City', 'Language', 'Integration', 'Last Active'].map(h => (
                    <p key={h} style={{ color: '#333', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace' }}>{h}</p>
                  ))}
                </div>
                {employees.map(e => {
                  const pct = getIntegrationPct(e)
                  const isAtRisk = pct < 30 || !e.onboarding_complete
                  return (
                    <div key={e.id} className="row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 80px', gap: 0, padding: '16px 20px', borderBottom: '1px solid #0d0d0d', background: isAtRisk ? '#0e0505' : 'transparent' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: G, border: '1px solid #1a1a1a' }}>{e.name[0]}</div>
                          <div>
                            <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{e.name}</p>
                            <p style={{ color: '#333', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>{e.role}</p>
                          </div>
                          {e.staked_amount > 0 && <span style={{ background: '#1a0a3a', color: '#a78bfa', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, fontFamily: '"DM Mono", monospace' }}>STAKED</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{e.flag}</span>
                        <span style={{ color: '#888', fontSize: 13, textTransform: 'capitalize' }}>{e.city}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#888', fontSize: 13, textTransform: 'capitalize' }}>{e.target_language}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', paddingRight: 16 }}>
                        <div style={{ flex: 1 }}>
                          <IntegrationBar pct={pct} size="small" />
                          <p style={{ color: '#333', fontSize: 10, fontFamily: '"DM Mono", monospace', marginTop: 3 }}>Mission {e.mission_day}/7 · {e.sessions_completed} sessions</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: isAtRisk ? '#f87171' : '#444', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>{e.last_active || 'Never'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── ALERTS TAB ── */}
          {activeTab === 'alerts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {atRisk.length === 0 ? (
                <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 16, padding: '40px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>🎉</p>
                  <p style={{ color: G, fontWeight: 700, fontSize: 16 }}>All employees are on track</p>
                  <p style={{ color: '#555', fontSize: 13, marginTop: 6 }}>No intervention needed at this time.</p>
                </div>
              ) : (
                <>
                  <div style={{ background: '#1a0505', border: '1px solid #3a0f0f', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <p style={{ color: '#f87171', fontWeight: 700, fontSize: 14 }}>{atRisk.length} employee{atRisk.length > 1 ? 's' : ''} need your attention</p>
                  </div>

                  {atRisk.map(e => {
                    const pct = getIntegrationPct(e)
                    const reason = !e.onboarding_complete
                      ? 'Has not completed onboarding'
                      : pct === 0
                      ? 'Has not started any missions'
                      : `Only ${pct}% integrated — at churn risk`

                    return (
                      <div key={e.id} style={{ background: '#0e0e0e', border: '1px solid #2a1a1a', borderRadius: 16, padding: 22 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 24 }}>{e.flag}</span>
                            <div>
                              <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{e.name}</p>
                              <p style={{ color: '#555', fontSize: 12, fontFamily: '"DM Mono", monospace' }}>{e.role} · {e.city}</p>
                            </div>
                          </div>
                          <span style={{ background: '#1a0505', color: '#f87171', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, fontFamily: '"DM Mono", monospace' }}>AT RISK</span>
                        </div>
                        <div style={{ background: '#111', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
                          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 4 }}>⚠️ {reason}</p>
                          <p style={{ color: '#555', fontSize: 12, lineHeight: 1.5 }}>
                            Employees who don't complete integration within 30 days are 4x more likely to leave within 12 months.
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            style={{ flex: 1, background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 10, padding: '10px 16px', color: G, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                            onClick={async () => {
                              // In a real app: send email via API route
                              alert(`Check-in email would be sent to ${e.name} (${e.email || 'email on file'})`)
                            }}
                          >
                            📧 Send Check-in
                          </button>
                          <button
                            style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: '10px 16px', color: '#888', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                            onClick={() => setActiveTab('employees')}
                          >
                            👁️ View Profile
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}

          {/* ── SETTINGS / INTEGRATIONS TAB ── */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Slack/Teams webhook */}
              <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 16, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 6 }}>🔔 Milestone Notifications</p>
                  <p style={{ color: '#555', fontSize: 13, lineHeight: 1.6 }}>Get automatic pings in Slack or Teams when your expats complete missions, unlock key integrations, or fall behind.</p>
                </div>

                {/* Platform toggle */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  {(['slack', 'teams'] as const).map(t => (
                    <button key={t} onClick={() => setWebhookType(t)} style={{ flex: 1, background: webhookType === t ? '#0f2a1a' : '#111', border: `2px solid ${webhookType === t ? '#1a3a1f' : '#1a1a1a'}`, borderRadius: 12, padding: '12px 16px', color: webhookType === t ? G : '#444', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {t === 'slack' ? '💬' : '🟦'} {t === 'slack' ? 'Slack' : 'Microsoft Teams'}
                    </button>
                  ))}
                </div>

                {/* Webhook URL input */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: '#555', fontSize: 12, fontWeight: 700, fontFamily: '"DM Mono", monospace', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {webhookType === 'slack' ? 'Slack Incoming Webhook URL' : 'Teams Webhook URL'}
                  </label>
                  <input
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    placeholder={webhookType === 'slack' ? 'https://hooks.slack.com/services/...' : 'https://outlook.office.com/webhook/...'}
                    style={{ width: '100%', background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, fontFamily: '"DM Mono", monospace', transition: 'border-color .15s' }}
                  />
                  <p style={{ color: '#333', fontSize: 11, marginTop: 6, fontFamily: '"DM Mono", monospace' }}>
                    {webhookType === 'slack' ? 'Create at: Slack → Your App → Incoming Webhooks' : 'Create at: Teams channel → Connectors → Incoming Webhook'}
                  </p>
                </div>

                {webhookMsg && (
                  <div style={{ background: webhookMsg.startsWith('✓') ? '#0f2a1a' : '#1a0505', border: `1px solid ${webhookMsg.startsWith('✓') ? '#1a3a1f' : '#3a0f0f'}`, borderRadius: 10, padding: '10px 16px', marginBottom: 14 }}>
                    <p style={{ color: webhookMsg.startsWith('✓') ? G : '#f87171', fontSize: 13, fontWeight: 700 }}>{webhookMsg}</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={saveWebhook} disabled={webhookSaving || !webhookUrl.trim()} style={{ flex: 1, background: !webhookUrl.trim() ? '#111' : G, color: !webhookUrl.trim() ? '#333' : '#050f06', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 800, fontSize: 14, cursor: !webhookUrl.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {webhookSaving ? 'Saving...' : '💾 Save Webhook'}
                  </button>
                  <button onClick={testWebhook} disabled={webhookTesting || !webhookUrl.trim()} style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '12px 20px', color: !webhookUrl.trim() ? '#333' : '#888', fontWeight: 700, fontSize: 14, cursor: !webhookUrl.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {webhookTesting ? 'Sending...' : '🧪 Test Message'}
                  </button>
                </div>
              </div>

              {/* What triggers notifications */}
              <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 16, padding: 24 }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>What triggers a notification?</p>
                {[
                  { trigger: 'Mission Completed', example: '✅ Sarah Mitchell just completed Get Your Tax ID. They are now 43% integrated.', color: G },
                  { trigger: 'At-Risk Alert', example: '⚠️ Tom Eriksson has not been active for 5 days. They are only 14% integrated.', color: '#fbbf24' },
                  { trigger: 'Full Integration', example: '🎉 Priya Sharma completed all 7 missions! 100% integrated in Athens. 🇬🇷', color: '#a78bfa' },
                  { trigger: 'Commitment Stake', example: '💰 James Kowalski staked €30 in Commitment Mode. Completion rate: 90%.', color: '#fb923c' },
                ].map(n => (
                  <div key={n.trigger} style={{ marginBottom: 12, padding: '14px 16px', background: '#111', borderRadius: 12, borderLeft: `3px solid ${n.color}` }}>
                    <p style={{ color: n.color, fontWeight: 700, fontSize: 12, fontFamily: '"DM Mono", monospace', marginBottom: 6 }}>{n.trigger}</p>
                    <p style={{ color: '#555', fontSize: 13, fontFamily: '"DM Mono", monospace', lineHeight: 1.5 }}>{n.example}</p>
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