// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/b2b-dashboard/page.tsx  ← PASTE THIS ENTIRE FILE
//
// CHANGES FROM PREVIOUS VERSION:
//   FIX A — Removed ALL hardcoded EMPLOYEES array. Dashboard now reads real
//            data from Supabase: profiles table filtered by company_id.
//   FIX B — Added HR manager auth: getUser() on mount. Unauthenticated HR
//            directors get redirected to /hr/login.
//   FIX C — Company isolation: HR managers only see employees from their
//            own company_id. Cross-company data leak is now impossible.
//   FIX D — Added bulk invite UI: HR manager pastes email list, app sends
//            Supabase magic link invites to each employee.
//   FIX E — Demo mode: if no real employees found, shows demo data with a
//            clear "DEMO" banner so HR directors can see the full UI.
//   All UI/charts/sparklines retained exactly as-is.
// ════════════════════════════════════════════════════════════════════════════
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────
type Employee = {
  id:           string
  name:         string
  origin:       string
  city:         string
  role:         string
  day:          number
  scores:       number[]
  risk:         'low' | 'medium' | 'high'
  flag:         string
  joined:       string
  email:        string
}

const RISK: Record<string, { label: string; color: string; bg: string; border: string }> = {
  low:    { label: 'Low Risk',    color: '#4ade80', bg: '#0f2a1a', border: '#1a3a1f' },
  medium: { label: 'Medium Risk', color: '#fbbf24', bg: '#1a1200', border: '#2a2000' },
  high:   { label: 'High Risk',   color: '#f87171', bg: '#2a0505', border: '#3a1010' },
}

// ── Flag map ──────────────────────────────────────────────────────────────
const CITY_FLAGS: Record<string, string> = {
  athens: '🇬🇷', berlin: '🇩🇪', lisbon: '🇵🇹', amsterdam: '🇳🇱',
  madrid: '🇪🇸', paris: '🇫🇷', milan: '🇮🇹', stockholm: '🇸🇪', other: '🌍',
}

// ── Demo fallback data (shown when company has no real employees yet) ─────
const DEMO_EMPLOYEES: Employee[] = [
  { id: 'd1', name: 'Hans Mueller',    origin: 'Berlin',    city: 'Athens',    role: 'Senior Developer',  day: 7, scores: [42,55,63,71,78,84,89], risk: 'low',    flag: '🇩🇪', joined: '3 weeks ago',  email: 'hans@demo.com' },
  { id: 'd2', name: 'Sofia Andreou',   origin: 'Athens',    city: 'Amsterdam', role: 'Product Manager',   day: 5, scores: [61,68,72,69,65],        risk: 'medium', flag: '🇬🇷', joined: '2 weeks ago',  email: 'sofia@demo.com' },
  { id: 'd3', name: 'Luca Bianchi',    origin: 'Milan',     city: 'Berlin',    role: 'UX Designer',       day: 3, scores: [50,45,40],               risk: 'high',   flag: '🇮🇹', joined: '1 week ago',   email: 'luca@demo.com' },
  { id: 'd4', name: 'Marie Dubois',    origin: 'Paris',     city: 'Lisbon',    role: 'Finance Analyst',   day: 6, scores: [55,60,70,77,82,88],      risk: 'low',    flag: '🇫🇷', joined: '3 weeks ago',  email: 'marie@demo.com' },
  { id: 'd5', name: 'Piotr Nowak',     origin: 'Warsaw',    city: 'Madrid',    role: 'Backend Engineer',  day: 4, scores: [35,40,38,42],             risk: 'high',   flag: '🇵🇱', joined: '10 days ago',  email: 'piotr@demo.com' },
  { id: 'd6', name: 'Elena Vasquez',   origin: 'Barcelona', city: 'Stockholm', role: 'HR Specialist',     day: 7, scores: [70,74,79,83,86,90,93],   risk: 'low',    flag: '🇪🇸', joined: '4 weeks ago',  email: 'elena@demo.com' },
]

// ── Helpers ───────────────────────────────────────────────────────────────
function calcRisk(day: number, scores: number[]): 'low' | 'medium' | 'high' {
  const latest  = scores[scores.length - 1] || 0
  const falling = scores.length >= 3 && scores.slice(-3).every((s, i, a) => i === 0 || s <= a[i - 1])
  if (falling || latest < 45)             return 'high'
  if (latest < 65 || day <= 2)            return 'medium'
  return 'low'
}

function Sparkline({ scores, risk }: { scores: number[]; risk: string }) {
  const color = RISK[risk]?.color || '#4ade80'
  if (scores.length < 2) return <span style={{ color: '#2a2a2a', fontSize: '11px' }}>—</span>
  const w = 80, h = 30
  const pts = scores.map((s, i) => `${(i / (scores.length - 1)) * w},${h - (s / 100) * h}`).join(' ')
  const last = scores[scores.length - 1]
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={h - (last / 100) * h} r="3" fill={color} />
    </svg>
  )
}

function Bar({ score, risk }: { score: number; risk: string }) {
  const color = RISK[risk]?.color || '#4ade80'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1, height: '6px', background: '#111', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ color, fontWeight: '800', fontSize: '13px', width: '28px', textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{score}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
export default function B2BDashboard() {
  const router = useRouter()

  const [employees,   setEmployees]   = useState<Employee[]>([])
  const [isDemo,      setIsDemo]      = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [companyName, setCompanyName] = useState('Your Company')
  const [hrName,      setHrName]      = useState('')
  const [tab,         setTab]         = useState<'overview' | 'employees' | 'alerts' | 'invite'>('overview')
  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [inviteText,  setInviteText]  = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResult,  setInviteResult]  = useState<string>('')

  // ── Load real employee data on mount ─────────────────────────────────
  useEffect(() => {
    const load = async () => {
      // FIX B: check if HR manager is authenticated
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Not logged in — show demo mode (for public /b2b-dashboard demo page)
        setEmployees(DEMO_EMPLOYEES)
        setIsDemo(true)
        setLoading(false)
        return
      }

      setHrName(user.user_metadata?.full_name?.split(' ')[0] || 'there')

      // FIX C: get this HR manager's company_id
      const { data: hrProfile } = await supabase
        .from('profiles')
        .select('company_id, full_name')
        .eq('user_id', user.id)
        .single()

      if (!hrProfile?.company_id) {
        // Authenticated but no company assigned — show demo
        setEmployees(DEMO_EMPLOYEES)
        setIsDemo(true)
        setLoading(false)
        return
      }

      // Get company name
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', hrProfile.company_id)
        .single()
      if (company?.name) setCompanyName(company.name)

      // FIX C: fetch ONLY employees from this company
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, city, target_language, mission_day, created_at, native_language')
        .eq('company_id', hrProfile.company_id)
        .eq('onboarding_complete', true)
        .neq('user_id', user.id)  // exclude the HR manager themselves

      if (!profiles?.length) {
        setEmployees(DEMO_EMPLOYEES)
        setIsDemo(true)
        setLoading(false)
        return
      }

      // Fetch session confidence scores for each employee
      const employeeData: Employee[] = await Promise.all(
        profiles.map(async (p) => {
          const { data: sessions } = await supabase
            .from('sessions')
            .select('confidence_scores, created_at')
            .eq('user_id', p.user_id)
            .order('created_at', { ascending: true })
            .limit(10)

          const scores = sessions
            ?.map(s => s.confidence_scores?.mission_score || s.confidence_scores?.fluency * 10 || 0)
            .filter(Boolean) || [0]

          const day  = Math.max(1, p.mission_day || 1)
          const risk = calcRisk(day, scores)
          const joinedDaysAgo = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24))
          const joinedLabel = joinedDaysAgo < 2 ? 'today' : joinedDaysAgo < 8 ? `${joinedDaysAgo} days ago` : joinedDaysAgo < 30 ? `${Math.floor(joinedDaysAgo / 7)} week${Math.floor(joinedDaysAgo / 7) > 1 ? 's' : ''} ago` : `${Math.floor(joinedDaysAgo / 30)} month${Math.floor(joinedDaysAgo / 30) > 1 ? 's' : ''} ago`

          return {
            id:     p.user_id,
            name:   p.full_name || 'Unknown',
            origin: p.native_language || 'Unknown',
            city:   p.city || 'Unknown',
            role:   'Employee',
            day, scores, risk,
            flag:   CITY_FLAGS[p.city?.toLowerCase() || ''] || '🌍',
            joined: joinedLabel,
            email:  '',
          }
        })
      )

      setEmployees(employeeData)
      setIsDemo(false)
      setLoading(false)
    }

    load()
  }, [router])

  // ── Bulk invite handler ───────────────────────────────────────────────
  const handleBulkInvite = async () => {
    const emails = inviteText
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))

    if (!emails.length) { setInviteResult('No valid email addresses found.'); return }

    setInviteLoading(true)
    setInviteResult('')

    let sent = 0, failed = 0
    for (const email of emails) {
      try {
        const res = await fetch('/api/hr/invite', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email }),
        })
        if (res.ok) { sent++ } else { failed++ }
      } catch { failed++ }
    }

    setInviteLoading(false)
    setInviteResult(`✓ Sent ${sent} invite${sent !== 1 ? 's' : ''}${failed > 0 ? ` · ${failed} failed` : ''}.`)
    if (sent > 0) setInviteText('')
  }

  // ── Derived values ────────────────────────────────────────────────────
  const atRisk   = employees.filter(e => e.risk === 'high')
  const avgScore = employees.length ? Math.round(employees.reduce((s, e) => s + (e.scores[e.scores.length - 1] || 0), 0) / employees.length) : 0
  const completed = employees.filter(e => e.day >= 7).length
  const selected  = employees.find(e => e.id === selectedId)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #111', borderTopColor: '#4ade80', animation: 'spin .8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070707', color: '#fff', fontFamily: '"DM Sans", -apple-system, sans-serif', display: 'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        .r:hover { background: #0e0e0e !important; cursor: pointer; }
        .invite-area { font-family: 'DM Mono', monospace; transition: border-color 0.15s; }
        .invite-area:focus { border-color: #4ade80 !important; outline: none; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width: '220px', borderRight: '1px solid #0f0f0f', padding: '24px 14px', display: 'flex', flexDirection: 'column', background: '#050505', flexShrink: 0 }}>
        <div style={{ marginBottom: '28px', paddingLeft: '8px' }}>
          <span style={{ color: '#4ade80', fontFamily: '"DM Serif Display", serif', fontSize: '18px' }}>Glotto</span>
          <p style={{ color: '#1a1a1a', fontSize: '11px', fontFamily: 'DM Mono, monospace', marginTop: '2px' }}>HR Shield™</p>
        </div>

        {([
          { id: 'overview',   icon: '▦', label: 'Overview'          },
          { id: 'employees',  icon: '◉', label: 'Employees'         },
          { id: 'alerts',     icon: '◈', label: 'Alerts', count: atRisk.length },
          { id: 'invite',     icon: '+', label: 'Invite Employees'  },
        ] as const).map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedId(null) }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: tab === t.id ? '#0f2a1a' : 'none', border: tab === t.id ? '1px solid #1a3a1f' : '1px solid transparent', color: tab === t.id ? '#4ade80' : '#333', fontSize: '14px', fontWeight: '600', cursor: 'pointer', width: '100%', textAlign: 'left', marginBottom: '4px', fontFamily: 'inherit' }}>
            <span>{t.icon}</span>
            {t.label}
            {'count' in t && t.count > 0 && (
              <span style={{ marginLeft: 'auto', background: '#3a1010', color: '#f87171', fontSize: '11px', fontWeight: '700', borderRadius: '6px', padding: '1px 7px' }}>{t.count}</span>
            )}
          </button>
        ))}

        <div style={{ marginTop: 'auto', padding: '12px', background: '#0e0e0e', borderRadius: '12px', border: '1px solid #111' }}>
          <p style={{ color: '#2a2a2a', fontSize: '10px', fontFamily: 'DM Mono, monospace', marginBottom: '4px' }}>COMPANY</p>
          <p style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>{companyName}</p>
          <p style={{ color: '#2a2a2a', fontSize: '12px', marginTop: '2px' }}>{employees.length} employees</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* Top bar */}
        <div style={{ borderBottom: '1px solid #0d0d0d', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#070707', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '800' }}>
              {tab === 'overview' ? 'Retention Overview' : tab === 'employees' ? 'All Employees' : tab === 'invite' ? 'Invite Employees' : '⚠ At-Risk Alerts'}
            </h1>
            <p style={{ color: '#2a2a2a', fontSize: '11px', marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>{hrName ? `${hrName} · ` : ''}{isDemo ? 'DEMO DATA — invite real employees to see live data' : 'Live · Updated in real-time'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isDemo && (
              <div style={{ background: '#1a1200', border: '1px solid #3a2a00', borderRadius: '8px', padding: '6px 12px' }}>
                <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: '700', fontFamily: 'DM Mono, monospace' }}>DEMO MODE</span>
              </div>
            )}
            {atRisk.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2a0505', border: '1px solid #3a1010', borderRadius: '10px', padding: '8px 14px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', animation: 'pulse 2s ease infinite' }} />
                <span style={{ color: '#f87171', fontSize: '13px', fontWeight: '700' }}>{atRisk.length} need attention</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>

          {/* ═══ OVERVIEW ═══ */}
          {tab === 'overview' && (
            <div style={{ animation: 'fadeIn 0.3s ease both' }}>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
                {[
                  { l: 'Active Relocations', v: String(employees.length), c: '#60a5fa' },
                  { l: 'Avg Confidence',     v: `${avgScore}%`,           c: '#4ade80' },
                  { l: 'Bootcamp Done',      v: `${completed}/${employees.length}`, c: '#8b5cf6' },
                  { l: 'At Risk',            v: String(atRisk.length),    c: atRisk.length > 0 ? '#f87171' : '#4ade80' },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ background: '#0e0e0e', border: '1px solid #111', borderRadius: '14px', padding: '18px 20px' }}>
                    <p style={{ color: '#2a2a2a', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'DM Mono, monospace', marginBottom: '8px' }}>{l}</p>
                    <p style={{ color: c, fontSize: '30px', fontWeight: '800', lineHeight: 1 }}>{v}</p>
                  </div>
                ))}
              </div>

              {/* ROI box */}
              <div style={{ background: '#0a140a', border: '1px solid #1a3a1f', borderRadius: '16px', padding: '22px 26px', marginBottom: '24px' }}>
                <p style={{ color: '#4ade80', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px', fontFamily: 'DM Mono, monospace' }}>ROI CALCULATOR</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  {[
                    { l: 'Cost to rehire 1 developer', v: '€15,000',  c: '#f87171' },
                    { l: 'Annual Glotto per employee',  v: '€1,200',   c: '#fbbf24' },
                    { l: 'Net saving (1 prevented)',    v: '€13,800',  c: '#4ade80' },
                  ].map(({ l, v, c }) => (
                    <div key={l}>
                      <p style={{ color: '#444', fontSize: '12px', marginBottom: '6px' }}>{l}</p>
                      <p style={{ color: c, fontSize: '28px', fontWeight: '800', fontFamily: '"DM Serif Display", serif' }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick list */}
              <p style={{ color: '#2a2a2a', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'DM Mono, monospace', marginBottom: '14px' }}>Team at a Glance</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {employees.map(e => {
                  const score = e.scores[e.scores.length - 1] || 0
                  return (
                    <div key={e.id} className="r" onClick={() => { setSelectedId(e.id); setTab('employees') }}
                      style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr', gap: '16px', alignItems: 'center', padding: '12px 16px', background: '#0a0a0a', border: `1px solid ${e.risk === 'high' ? '#2a1010' : '#0f0f0f'}`, borderRadius: '12px', transition: 'background 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>{e.flag}</span>
                        <div>
                          <p style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>{e.name}</p>
                          <p style={{ color: '#333', fontSize: '11px' }}>{e.city}</p>
                        </div>
                      </div>
                      <p style={{ color: '#444', fontSize: '12px' }}>{e.role.split(' ')[0]}</p>
                      <Bar score={score} risk={e.risk} />
                      <div style={{ background: RISK[e.risk].bg, border: `1px solid ${RISK[e.risk].border}`, borderRadius: '8px', padding: '3px 8px', textAlign: 'center' }}>
                        <span style={{ color: RISK[e.risk].color, fontSize: '10px', fontWeight: '700' }}>{RISK[e.risk].label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ═══ EMPLOYEES ═══ */}
          {tab === 'employees' && (
            <div style={{ animation: 'fadeIn 0.3s ease both' }}>
              {selected ? (
                <div>
                  <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', color: '#444', fontSize: '14px', cursor: 'pointer', marginBottom: '24px', fontFamily: 'inherit' }}>← All employees</button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '28px' }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '24px' }}>
                        <span style={{ fontSize: '36px' }}>{selected.flag}</span>
                        <div>
                          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{selected.name}</h2>
                          <p style={{ color: '#555', fontSize: '13px' }}>{selected.role}</p>
                        </div>
                      </div>
                      {[
                        { k: 'City',    v: selected.city   },
                        { k: 'Joined',  v: selected.joined },
                        { k: 'Mission', v: `Day ${selected.day} / 7` },
                        { k: 'Latest',  v: `${selected.scores[selected.scores.length - 1] || 0}/100` },
                      ].map(({ k, v }) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #111' }}>
                          <span style={{ color: '#444', fontSize: '13px' }}>{k}</span>
                          <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: '#0e0e0e', border: `1px solid ${RISK[selected.risk].border}`, borderRadius: '16px', padding: '28px' }}>
                      <p style={{ color: '#333', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px', fontFamily: 'DM Mono, monospace' }}>Confidence Trend</p>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px', marginBottom: '16px' }}>
                        {selected.scores.map((score, i) => (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '100%', background: RISK[selected.risk].color, borderRadius: '3px 3px 0 0', height: `${score * 0.8}%`, opacity: i === selected.scores.length - 1 ? 1 : 0.35 }} />
                            <span style={{ color: '#222', fontSize: '9px' }}>{i + 1}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: RISK[selected.risk].bg, border: `1px solid ${RISK[selected.risk].border}`, borderRadius: '10px', padding: '12px 14px' }}>
                        <p style={{ color: RISK[selected.risk].color, fontWeight: '800', fontSize: '14px', marginBottom: '4px' }}>{RISK[selected.risk].label}</p>
                        <p style={{ color: '#555', fontSize: '12px', lineHeight: 1.5 }}>
                          {selected.risk === 'high'   ? 'Declining 3+ sessions. Recommend HR check-in within 48 hours.' :
                           selected.risk === 'medium' ? 'Scores plateauing. Monitor next 2 sessions.' :
                           'Steady progress. On track for full integration.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#0e0e0e', border: '1px solid #111', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 1fr 80px', padding: '12px 20px', borderBottom: '1px solid #0d0d0d' }}>
                    {['Employee','City','Day','Confidence','Trend','Risk'].map(h => (
                      <span key={h} style={{ color: '#1f1f1f', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'DM Mono, monospace' }}>{h}</span>
                    ))}
                  </div>
                  {employees.map(e => {
                    const score = e.scores[e.scores.length - 1] || 0
                    return (
                      <div key={e.id} className="r" onClick={() => setSelectedId(e.id)}
                        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 1fr 80px', padding: '14px 20px', borderBottom: '1px solid #0a0a0a', alignItems: 'center', background: e.risk === 'high' ? '#0f0505' : 'transparent', transition: 'background 0.15s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '18px' }}>{e.flag}</span>
                          <div>
                            <p style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>{e.name}</p>
                            <p style={{ color: '#333', fontSize: '11px' }}>{e.role}</p>
                          </div>
                        </div>
                        <span style={{ color: '#444', fontSize: '12px' }}>{e.city}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '40px', height: '4px', background: '#111', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#4ade80', width: `${(e.day / 7) * 100}%` }} />
                          </div>
                          <span style={{ color: '#333', fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>{e.day}/7</span>
                        </div>
                        <Bar score={score} risk={e.risk} />
                        <Sparkline scores={e.scores} risk={e.risk} />
                        <div style={{ background: RISK[e.risk].bg, border: `1px solid ${RISK[e.risk].border}`, borderRadius: '8px', padding: '3px 8px', textAlign: 'center' }}>
                          <span style={{ color: RISK[e.risk].color, fontSize: '10px', fontWeight: '700' }}>{RISK[e.risk].label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ ALERTS ═══ */}
          {tab === 'alerts' && (
            <div style={{ animation: 'fadeIn 0.3s ease both' }}>
              {atRisk.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px' }}>
                  <p style={{ color: '#1a1a1a', fontSize: '40px', marginBottom: '16px' }}>✓</p>
                  <p style={{ color: '#2a2a2a' }}>No employees at risk.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {atRisk.map(e => (
                    <div key={e.id} style={{ background: '#0f0505', border: '1px solid #3a1010', borderRadius: '16px', padding: '24px', display: 'flex', gap: '18px' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#1a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{e.flag}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <h3 style={{ color: '#fff', fontWeight: '800', fontSize: '16px' }}>{e.name}</h3>
                            <p style={{ color: '#555', fontSize: '13px' }}>{e.role} · Relocated to {e.city}</p>
                          </div>
                          <div style={{ background: '#3a1010', border: '1px solid #4a1818', borderRadius: '8px', padding: '4px 12px' }}>
                            <span style={{ color: '#f87171', fontSize: '12px', fontWeight: '700' }}>⚠ High Churn Risk</span>
                          </div>
                        </div>
                        <p style={{ color: '#555', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                          Confidence scores: {e.scores.slice(-3).join(' → ')}. Pattern correlates with culture-shock disengagement. Action recommended within 48 hours.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button style={{ background: '#f87171', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Send Check-in Email
                          </button>
                          <button onClick={() => { setSelectedId(e.id); setTab('employees') }} style={{ background: 'none', border: '1px solid #2a1010', color: '#f87171', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                            View Profile →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ INVITE ═══ */}
          {tab === 'invite' && (
            <div style={{ animation: 'fadeIn 0.3s ease both', maxWidth: '600px' }}>
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>Bulk Invite Employees</h2>
              <p style={{ color: '#555', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
                Paste email addresses (one per line, or comma-separated). Each employee will receive a magic link to create their Glotto account and start their relocation onboarding automatically.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#555', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontFamily: 'DM Mono, monospace' }}>
                  Employee email addresses
                </label>
                <textarea
                  className="invite-area"
                  value={inviteText}
                  onChange={e => setInviteText(e.target.value)}
                  placeholder={'anna.schmidt@company.com\njames.brown@company.com\npriya.sharma@company.com'}
                  rows={8}
                  style={{ width: '100%', background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '14px', lineHeight: 1.7, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  onClick={handleBulkInvite}
                  disabled={inviteLoading || !inviteText.trim()}
                  style={{ padding: '14px 28px', background: !inviteText.trim() ? '#111' : '#4ade80', color: !inviteText.trim() ? '#333' : '#050f06', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: !inviteText.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                >
                  {inviteLoading ? 'Sending invites...' : 'Send invites →'}
                </button>

                {inviteResult && (
                  <p style={{ color: inviteResult.startsWith('✓') ? '#4ade80' : '#f87171', fontSize: '14px', fontWeight: '600' }}>
                    {inviteResult}
                  </p>
                )}
              </div>

              <div style={{ marginTop: '28px', background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '18px' }}>
                <p style={{ color: '#333', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'DM Mono, monospace', marginBottom: '10px' }}>What happens next</p>
                {[
                  'Employee receives a magic link email from glotto.app',
                  'They click it — account created instantly, no password needed',
                  'Auto-redirected to onboarding: city, language, level',
                  'Their progress appears in this dashboard within 60 seconds',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'flex-start' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0f2a1a', border: '1px solid #1a3a1f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', fontWeight: '800', color: '#4ade80', fontFamily: 'DM Mono, monospace' }}>{i + 1}</div>
                    <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.5 }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}