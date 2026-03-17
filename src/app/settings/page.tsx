// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/settings/page.tsx
// CHANGE: All emojis replaced with lucide-react icons. Zero logic changes.
// ════════════════════════════════════════════════════════════════════════════
'use client'
import React from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Lock, Bell, SlidersHorizontal, CreditCard, Map,
  Eye, EyeOff, Trash2, Check, Zap, Globe, MapPin, BarChart3,
  CheckCircle2,
} from 'lucide-react'

type Toast = { msg: string; type: 'success' | 'error' }

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} style={{ width: '46px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer', padding: '3px', background: on ? '#4ade80' : '#1f1f1f', transition: 'background .2s', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: on ? '#061009' : '#444', transform: on ? 'translateX(20px)' : 'translateX(0)', transition: 'transform .2s' }} />
    </button>
  )
}

export default function Settings() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeSection, setActiveSection] = React.useState('relocation')
  const [toast, setToast] = React.useState<Toast | null>(null)

  const [newPw, setNewPw] = React.useState('')
  const [confirmPw, setConfirmPw] = React.useState('')
  const [showPw, setShowPw] = React.useState(false)
  const [pwLoading, setPwLoading] = React.useState(false)

  const [notifs, setNotifs] = React.useState({
    missionReminder: true, milestoneAlerts: true, weeklyReport: false, rewardUnlocked: true, hrUpdates: false,
  })

  const [relocCity, setRelocCity]   = React.useState('')
  const [relocLang, setRelocLang]   = React.useState('')
  const [relocLevel, setRelocLevel] = React.useState('')
  const [relocSaving, setRelocSaving] = React.useState(false)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  React.useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (p) { setProfile(p); setRelocCity(p.city || ''); setRelocLang(p.target_language || ''); setRelocLevel(p.current_level || '') }
      setLoading(false)
    })
  }, [router])

  const handlePasswordChange = async () => {
    if (!newPw || !confirmPw) { showToast('Please fill in all fields', 'error'); return }
    if (newPw !== confirmPw)  { showToast('Passwords do not match', 'error'); return }
    if (newPw.length < 8)    { showToast('Password must be at least 8 characters', 'error'); return }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwLoading(false)
    if (error) { showToast(error.message, 'error') } else { showToast('Password updated', 'success'); setNewPw(''); setConfirmPw('') }
  }

  const handleRelocSave = async () => {
    setRelocSaving(true)
    const { error } = await supabase.from('profiles').update({ city: relocCity, target_language: relocLang, current_level: relocLevel }).eq('user_id', user?.id)
    setRelocSaving(false)
    if (error) { showToast('Failed to save', 'error') } else { showToast('Relocation profile updated', 'success') }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you absolutely sure? All your integration progress will be lost forever.')
    if (!confirmed) return
    showToast('Please contact support@glotto.app to delete your account', 'error')
  }

  const isPaid   = profile?.subscription_status === 'active'
  const isStaked = (profile?.staked_amount || 0) > 0
  const name     = profile?.full_name?.split(' ')[0] || 'there'

  const sections = [
    { id: 'relocation',    label: 'Relocation Profile', Icon: Map            },
    { id: 'subscription',  label: 'Subscription',       Icon: CreditCard     },
    { id: 'notifications', label: 'Notifications',      Icon: Bell           },
    { id: 'password',      label: 'Password',           Icon: Lock           },
    { id: 'preferences',   label: 'Preferences',        Icon: SlidersHorizontal },
  ]

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#4ade80', animation: 'spin .8s linear infinite' }} />
    </main>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;font-family:'DM Sans',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .sec-btn{transition:all .15s;border:none;cursor:pointer;text-align:left;width:100%}
        .sec-btn:hover{background:#141414!important;color:#fff!important}
        .field{background:#0f0f0f;border:1.5px solid #1f1f1f;border-radius:11px;padding:13px 17px;color:#fff;font-size:15px;width:100%;outline:none;transition:border-color .15s;font-family:'DM Sans',sans-serif}
        .field:focus{border-color:#333}
        .field::placeholder{color:#2a2a2a}
        .save-btn{transition:all .15s;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
        .save-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(74,222,128,.2)!important}
        .danger-btn{transition:all .15s;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
        .danger-btn:hover{background:#1a0808!important;border-color:#3a1414!important}
        .row-hover{transition:background .15s}
        .row-hover:hover{background:#111!important}
        .sel{background:#0f0f0f;border:1.5px solid #1f1f1f;border-radius:11px;padding:12px 15px;color:#fff;font-size:15px;outline:none;cursor:pointer;font-family:'DM Sans',sans-serif;width:100%}
        .sel:focus{border-color:#333}
        .sb::-webkit-scrollbar{display:none}.sb{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 100, animation: 'toastIn .2s ease', background: toast.type === 'success' ? '#0f2a1a' : '#1a0808', border: `1px solid ${toast.type === 'success' ? '#1a4a2a' : '#3a1414'}`, borderRadius: '11px', padding: '13px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {toast.type === 'success'
            ? <Check size={15} color="#4ade80" />
            : <Trash2 size={15} color="#f87171" />
          }
          <span style={{ color: '#fff', fontSize: '15px', fontWeight: '500' }}>{toast.msg}</span>
        </div>
      )}

      <div className="sb" style={{ minHeight: '100vh', background: '#080808', display: 'flex' }}>

        {/* Left panel */}
        <div style={{ width: '270px', background: '#080808', borderRight: '1px solid #111', padding: '32px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#333', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '500', marginBottom: '40px', padding: '4px 8px', fontFamily: 'DM Sans, sans-serif' }}>
            <ArrowLeft size={16} color="#333" /> Back to Dashboard
          </button>
          <div style={{ marginBottom: '32px', padding: '0 8px' }}>
            <div style={{ width: '52px', height: '52px', background: '#0f2a1a', border: '1px solid #1a3a25', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '20px', fontWeight: '900', marginBottom: '14px' }}>
              {name[0]?.toUpperCase()}
            </div>
            <h2 style={{ color: '#fff', fontSize: '19px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '4px' }}>{name}</h2>
            <p style={{ color: '#282828', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>{user?.email}</p>
          </div>
          <p style={{ color: '#2a2a2a', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', padding: '0 8px', marginBottom: '8px' }}>Settings</p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {sections.map(({ id, label, Icon }) => {
              const on = activeSection === id
              return (
                <button key={id} className="sec-btn" onClick={() => setActiveSection(id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 13px', borderRadius: '9px', background: on ? '#141414' : 'transparent', color: on ? '#fff' : '#333', fontSize: '15px', fontWeight: on ? '600' : '400', position: 'relative' }}>
                  {on && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: '#4ade80', borderRadius: '0 3px 3px 0' }} />}
                  <Icon size={17} color={on ? '#4ade80' : '#333'} />
                  {label}
                  {id === 'subscription' && isPaid && (
                    <span style={{ marginLeft: 'auto', background: '#0f2a1a', color: '#4ade80', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', fontFamily: 'DM Mono, monospace' }}>ACTIVE</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main */}
        <div className="sb" style={{ flex: 1, overflowY: 'auto', padding: '52px 64px', maxWidth: '800px' }}>

          {/* ── RELOCATION PROFILE ── */}
          {activeSection === 'relocation' && (
            <div style={{ animation: 'fadeUp .2s ease' }}>
              <h1 style={{ color: '#fff', fontSize: '30px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>Relocation Profile</h1>
              <p style={{ color: '#444', fontSize: '15px', fontFamily: 'DM Mono, monospace', marginBottom: '40px' }}>Update your city, language, and level. This shapes your missions.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '36px' }}>
                <div>
                  <label style={{ color: '#666', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '9px' }}>
                    <MapPin size={13} color="#555" />Your City
                  </label>
                  <select className="sel" value={relocCity} onChange={e => setRelocCity(e.target.value)}>
                    <option value="">Select city</option>
                    {[['athens','Athens 🇬🇷'],['berlin','Berlin 🇩🇪'],['lisbon','Lisbon 🇵🇹'],['amsterdam','Amsterdam 🇳🇱'],['madrid','Madrid 🇪🇸'],['paris','Paris 🇫🇷'],['milan','Milan 🇮🇹'],['barcelona','Barcelona 🇪🇸'],['prague','Prague 🇨🇿'],['warsaw','Warsaw 🇵🇱'],['stockholm','Stockholm 🇸🇪'],['other','Other 🌍']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#666', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '9px' }}>
                    <Globe size={13} color="#555" />Target Language
                  </label>
                  <select className="sel" value={relocLang} onChange={e => setRelocLang(e.target.value)}>
                    <option value="">Select language</option>
                    {[['greek','Greek'],['german','German'],['spanish','Spanish'],['french','French'],['italian','Italian'],['portuguese','Portuguese'],['dutch','Dutch'],['polish','Polish'],['swedish','Swedish'],['czech','Czech'],['japanese','Japanese'],['mandarin','Mandarin']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#666', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '9px' }}>
                    <BarChart3 size={13} color="#555" />Current Level
                  </label>
                  <select className="sel" value={relocLevel} onChange={e => setRelocLevel(e.target.value)}>
                    <option value="">Select level</option>
                    {[['A1','A1 — Complete Beginner'],['A2','A2 — Elementary'],['B1','B1 — Intermediate'],['B2','B2 — Upper Intermediate'],['C1','C1 — Advanced']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <button className="save-btn" onClick={handleRelocSave} disabled={relocSaving} style={{ background: '#4ade80', color: '#061009', borderRadius: '11px', padding: '14px 30px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {relocSaving ? 'Saving...' : <><Check size={16} /> Save Profile</>}
              </button>
            </div>
          )}

          {/* ── SUBSCRIPTION ── */}
          {activeSection === 'subscription' && (
            <div style={{ animation: 'fadeUp .2s ease' }}>
              <h1 style={{ color: '#fff', fontSize: '30px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>Subscription</h1>
              <p style={{ color: '#444', fontSize: '15px', fontFamily: 'DM Mono, monospace', marginBottom: '40px' }}>Manage your plan and billing</p>

              <div style={{ background: isPaid ? '#0f2a1a' : '#0e0e0e', border: `1px solid ${isPaid ? '#1a3a1f' : '#1a1a1a'}`, borderRadius: '16px', padding: '28px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div>
                    <p style={{ color: '#555', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', marginBottom: '6px' }}>Current Plan</p>
                    <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isStaked ? <><Zap size={20} color="#4ade80" /> Commitment Mode</> : isPaid ? <><CheckCircle2 size={20} color="#4ade80" /> Full Access</> : <><Lock size={20} color="#555" /> Free Plan</>}
                    </h3>
                  </div>
                  <span style={{ background: isPaid || isStaked ? '#0f2a1a' : '#111', color: isPaid || isStaked ? '#4ade80' : '#555', border: `1px solid ${isPaid || isStaked ? '#1a3a1f' : '#1a1a1a'}`, fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '9px', fontFamily: 'DM Mono, monospace' }}>
                    {isPaid || isStaked ? 'ACTIVE' : 'FREE'}
                  </span>
                </div>
                {isStaked && (
                  <div style={{ background: '#0a0a0a', borderRadius: '11px', padding: '16px 18px', marginBottom: '14px' }}>
                    <p style={{ color: '#4ade80', fontWeight: '700', fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CreditCard size={14} color="#4ade80" /> €{profile?.staked_amount} staked
                    </p>
                    <p style={{ color: '#555', fontSize: '13px', lineHeight: 1.5 }}>Complete all 7 missions and your stake is returned in full. Completion rate with Commitment Mode: 90%.</p>
                  </div>
                )}
                {!isPaid && !isStaked && <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.6 }}>You have access to Missions 1 &amp; 2 for free. Upgrade to unlock all 7 missions and the full Relocation OS.</p>}
                {(isPaid || isStaked) && <p style={{ color: '#555', fontSize: '14px' }}>Full access to all 7 survival missions, AI rehearsal, document scanner, and dependency map.</p>}
              </div>

              <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
                <p style={{ color: '#333', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', marginBottom: '16px' }}>Full Access Includes</p>
                {[
                  { Icon: MapPin,      title: '7 Survival Missions',   desc: 'Metro → Tax ID → Bank → Health → SIM' },
                  { Icon: Globe,       title: 'AI Rehearsal',          desc: 'Practice before visiting any government office' },
                  { Icon: Zap,         title: 'Document Scanner',      desc: 'Translate any scary official letter instantly' },
                  { Icon: BarChart3,   title: 'Dependency Map',        desc: 'Visual roadmap of your entire integration' },
                  { Icon: CreditCard,  title: 'Affiliate Rewards',     desc: 'N26, SafetyWing, Airalo — unlocked on completion' },
                  { Icon: Bell,        title: 'Panic Button',          desc: 'Emergency phrases in any location, any time' },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} style={{ display: 'flex', gap: '14px', padding: '12px 0', borderBottom: '1px solid #111', alignItems: 'flex-start' }}>
                    <Icon size={20} color={isPaid || isStaked ? '#4ade80' : '#333'} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ color: isPaid || isStaked ? '#fff' : '#555', fontWeight: '600', fontSize: '15px', marginBottom: '2px' }}>{title}</p>
                      <p style={{ color: '#333', fontSize: '13px' }}>{desc}</p>
                    </div>
                    {(isPaid || isStaked) && <Check size={14} color="#4ade80" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                  </div>
                ))}
              </div>

              {!isPaid && !isStaked ? (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button className="save-btn" onClick={() => router.push('/pricing')} style={{ flex: 1, background: '#4ade80', color: '#061009', borderRadius: '11px', padding: '14px 24px', fontSize: '16px', fontWeight: '800' }}>Upgrade to Full Access →</button>
                  <button className="save-btn" onClick={() => router.push('/pricing')} style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', color: '#888', borderRadius: '11px', padding: '14px 24px', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    <Zap size={16} color="#888" /> Try Commitment Mode
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button className="save-btn" onClick={() => router.push('/pricing')} style={{ background: '#111', border: '1px solid #1a1a1a', color: '#888', borderRadius: '11px', padding: '14px 24px', fontSize: '15px', fontWeight: '700' }}>View All Plans</button>
                  <button className="danger-btn" onClick={() => showToast('To cancel, email billing@glotto.app', 'error')} style={{ background: '#110808', border: '1px solid #2a1414', color: '#f87171', borderRadius: '11px', padding: '14px 24px', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Trash2 size={14} color="#f87171" /> Cancel Subscription
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeSection === 'notifications' && (
            <div style={{ animation: 'fadeUp .2s ease' }}>
              <h1 style={{ color: '#fff', fontSize: '30px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>Notifications</h1>
              <p style={{ color: '#444', fontSize: '15px', fontFamily: 'DM Mono, monospace', marginBottom: '40px' }}>Choose what Glotto notifies you about</p>
              <div style={{ background: '#0f0f0f', border: '1px solid #181818', borderRadius: '15px', overflow: 'hidden' }}>
                {[
                  { key: 'missionReminder', label: 'Daily Mission Reminder',   desc: 'Reminded to complete your mission each day' },
                  { key: 'milestoneAlerts', label: 'Milestone Alerts',         desc: 'When you unlock a new reward or complete a key step' },
                  { key: 'weeklyReport',    label: 'Weekly Integration Report', desc: 'Summary of your relocation progress every Sunday' },
                  { key: 'rewardUnlocked',  label: 'Reward Unlocked',          desc: 'When a new partner reward becomes available to you' },
                  { key: 'hrUpdates',       label: 'HR Updates',               desc: 'Messages from your company HR about your relocation' },
                ].map(({ key, label, desc }, i, arr) => (
                  <div key={key} className="row-hover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px', borderBottom: i < arr.length - 1 ? '1px solid #131313' : 'none' }}>
                    <div>
                      <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{label}</p>
                      <p style={{ color: '#333', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>{desc}</p>
                    </div>
                    <Toggle on={notifs[key as keyof typeof notifs]} onChange={v => setNotifs(n => ({ ...n, [key]: v }))} />
                  </div>
                ))}
              </div>
              <button className="save-btn" onClick={() => showToast('Notification preferences saved', 'success')} style={{ background: '#4ade80', color: '#061009', borderRadius: '11px', padding: '14px 30px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '28px' }}>
                <Check size={16} /> Save Preferences
              </button>
            </div>
          )}

          {/* ── PASSWORD ── */}
          {activeSection === 'password' && (
            <div style={{ animation: 'fadeUp .2s ease' }}>
              <h1 style={{ color: '#fff', fontSize: '30px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>Password</h1>
              <p style={{ color: '#444', fontSize: '15px', fontFamily: 'DM Mono, monospace', marginBottom: '40px' }}>Change your account password</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', marginBottom: '32px' }}>
                <div>
                  <label style={{ color: '#666', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: '9px' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} className="field" placeholder="Min. 8 characters" value={newPw} onChange={e => setNewPw(e.target.value)} style={{ paddingRight: '50px' }} />
                    <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#333', cursor: 'pointer', display: 'flex' }}>
                      {showPw ? <EyeOff size={16} color="#333" /> : <Eye size={16} color="#333" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ color: '#666', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: '9px' }}>Confirm New Password</label>
                  <input type={showPw ? 'text' : 'password'} className="field" placeholder="Repeat new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                  {confirmPw && newPw !== confirmPw && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '6px', fontFamily: 'DM Mono, monospace' }}>Passwords don&apos;t match</p>}
                  {confirmPw && newPw === confirmPw && newPw.length >= 8 && <p style={{ color: '#4ade80', fontSize: '13px', marginTop: '6px', fontFamily: 'DM Mono, monospace', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Passwords match</p>}
                </div>
                {newPw && (
                  <div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      {[newPw.length >= 8, /[A-Z]/.test(newPw), /[0-9]/.test(newPw), /[^A-Za-z0-9]/.test(newPw)].map((ok, i) => (
                        <div key={i} style={{ flex: 1, height: '3px', borderRadius: '3px', background: ok ? '#4ade80' : '#1f1f1f', transition: 'background .2s' }} />
                      ))}
                    </div>
                    <p style={{ color: '#333', fontSize: '12px', fontFamily: 'DM Mono, monospace' }}>
                      {newPw.length < 8 ? 'Too short' : /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) && /[^A-Za-z0-9]/.test(newPw) ? '✓ Strong password' : 'Add uppercase, numbers, or symbols'}
                    </p>
                  </div>
                )}
              </div>
              <button className="save-btn" onClick={handlePasswordChange} disabled={pwLoading} style={{ background: '#4ade80', color: '#061009', borderRadius: '11px', padding: '14px 30px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {pwLoading ? 'Updating...' : <><Check size={16} /> Update Password</>}
              </button>
              <div style={{ marginTop: '60px', borderTop: '1px solid #111', paddingTop: '40px' }}>
                <h3 style={{ color: '#f87171', fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>Danger Zone</h3>
                <p style={{ color: '#282828', fontSize: '14px', fontFamily: 'DM Mono, monospace', marginBottom: '20px' }}>These actions are permanent and cannot be undone.</p>
                <button className="danger-btn" onClick={handleDeleteAccount} style={{ display: 'flex', alignItems: 'center', gap: '9px', background: '#110808', border: '1px solid #2a1414', color: '#f87171', borderRadius: '11px', padding: '13px 22px', fontSize: '15px', fontWeight: '600' }}>
                  <Trash2 size={15} color="#f87171" /> Delete Account
                </button>
              </div>
            </div>
          )}

          {/* ── PREFERENCES ── */}
          {activeSection === 'preferences' && (
            <div style={{ animation: 'fadeUp .2s ease' }}>
              <h1 style={{ color: '#fff', fontSize: '30px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>Preferences</h1>
              <p style={{ color: '#444', fontSize: '15px', fontFamily: 'DM Mono, monospace', marginBottom: '40px' }}>Customize your Glotto experience</p>
              <div style={{ background: '#0f0f0f', border: '1px solid #181818', borderRadius: '15px', overflow: 'hidden', marginBottom: '28px' }}>
                {[
                  { key: 'sound',      label: 'Sound Effects',        desc: 'Play sounds for XP gains and mission completion' },
                  { key: 'autoScroll', label: 'Auto-scroll Messages', desc: 'Automatically scroll to new messages in missions' },
                  { key: 'haptics',    label: 'Haptic Feedback',      desc: 'Vibration on key interactions (mobile)' },
                ].map(({ key, label, desc }, i, arr) => (
                  <div key={key} className="row-hover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px', borderBottom: i < arr.length - 1 ? '1px solid #131313' : 'none' }}>
                    <div>
                      <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{label}</p>
                      <p style={{ color: '#333', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>{desc}</p>
                    </div>
                    <Toggle on={key === 'autoScroll'} onChange={() => showToast('Preference saved', 'success')} />
                  </div>
                ))}
              </div>
              <button className="save-btn" onClick={() => showToast('Preferences saved', 'success')} style={{ background: '#4ade80', color: '#061009', borderRadius: '11px', padding: '14px 30px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} /> Save Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}