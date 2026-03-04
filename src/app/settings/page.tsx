'use client'

import React from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const Icons = {
  back: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  lock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  sliders: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeoff: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
}

type Toast = { msg: string; type: 'success' | 'error' }

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', padding: '2px', background: on ? '#4ade80' : '#1f1f1f', transition: 'background .2s', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: on ? '#061009' : '#444', transform: on ? 'translateX(20px)' : 'translateX(0)', transition: 'transform .2s' }} />
    </button>
  )
}

export default function Settings() {
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeSection, setActiveSection] = React.useState('password')
  const [toast, setToast] = React.useState<Toast | null>(null)

  // Password
  const [currentPw, setCurrentPw] = React.useState('')
  const [newPw, setNewPw] = React.useState('')
  const [confirmPw, setConfirmPw] = React.useState('')
  const [showPw, setShowPw] = React.useState(false)
  const [pwLoading, setPwLoading] = React.useState(false)

  // Notifications
  const [notifs, setNotifs] = React.useState({
    dailyReminder: true,
    streakAlert: true,
    weeklyReport: false,
    newRewards: true,
    tips: false,
  })

  // Preferences
  const [prefs, setPrefs] = React.useState({
    theme: 'dark',
    sessionLength: '5',
    difficulty: 'adaptive',
    soundEffects: true,
    autoPlay: false,
  })

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      setLoading(false)
    })
  }, [router])

  const handlePasswordChange = async () => {
    if (!newPw || !confirmPw) { showToast('Please fill in all fields', 'error'); return }
    if (newPw !== confirmPw) { showToast('Passwords do not match', 'error'); return }
    if (newPw.length < 8) { showToast('Password must be at least 8 characters', 'error'); return }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwLoading(false)
    if (error) { showToast(error.message, 'error') }
    else { showToast('Password updated successfully', 'success'); setCurrentPw(''); setNewPw(''); setConfirmPw('') }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you absolutely sure? This cannot be undone. All your progress will be lost forever.')
    if (!confirmed) return
    const confirmed2 = window.confirm('Last chance — delete your Glotto account permanently?')
    if (!confirmed2) return
    showToast('Please contact support to delete your account', 'error')
  }

  const sections = [
    { id: 'password', label: 'Password', Icon: Icons.lock },
    { id: 'notifications', label: 'Notifications', Icon: Icons.bell },
    { id: 'preferences', label: 'Preferences', Icon: Icons.sliders },
  ]

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#4ade80', animation: 'spin .8s linear infinite' }} />
    </main>
  )

  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;font-family:'DM Sans',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .section-btn{transition:all .15s ease;border:none;cursor:pointer;text-align:left;width:100%}
        .section-btn:hover{background:#141414!important;color:#fff!important}
        .input-field{background:#0f0f0f;border:1px solid #1f1f1f;border-radius:10px;padding:12px 16px;color:#fff;font-size:15px;width:100%;outline:none;transition:border-color .15s;font-family:'DM Sans',sans-serif}
        .input-field:focus{border-color:#333}
        .input-field::placeholder{color:#2a2a2a}
        .save-btn{transition:all .15s ease;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
        .save-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(74,222,128,.25)!important}
        .save-btn:active{transform:translateY(0)}
        .danger-btn{transition:all .15s ease;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
        .danger-btn:hover{background:#1a0808!important;border-color:#3a1414!important}
        .notif-row{transition:background .15s}
        .notif-row:hover{background:#111!important}
        .pref-select{background:#0f0f0f;border:1px solid #1f1f1f;border-radius:10px;padding:10px 14px;color:#fff;font-size:14px;outline:none;cursor:pointer;font-family:'DM Sans',sans-serif;width:100%}
        .pref-select:focus{border-color:#333}
        .sb-hide::-webkit-scrollbar{display:none}
        .sb-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 100, animation: 'toastIn .2s ease', background: toast.type === 'success' ? '#0f2a1a' : '#1a0808', border: `1px solid ${toast.type === 'success' ? '#1a4a2a' : '#3a1414'}`, borderRadius: '10px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: toast.type === 'success' ? '#4ade80' : '#f87171', display: 'flex' }}>{toast.type === 'success' ? <Icons.check /> : '✕'}</span>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{toast.msg}</span>
        </div>
      )}

      <div className="sb-hide" style={{ minHeight: '100vh', background: '#080808', display: 'flex' }}>

        {/* LEFT PANEL */}
        <div style={{ width: '260px', background: '#080808', borderRight: '1px solid #111', padding: '32px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>

          <button onClick={() => router.push('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#333', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginBottom: '40px', padding: '4px 8px', transition: 'color .15s', fontFamily: 'DM Sans, sans-serif' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#888'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#333'}>
            <Icons.back /> Back to Dashboard
          </button>

          <div style={{ marginBottom: '32px', padding: '0 8px' }}>
            <div style={{ width: '48px', height: '48px', background: '#0f2a1a', border: '1px solid #1a3a25', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '18px', fontWeight: '900', marginBottom: '12px' }}>
              {name[0]?.toUpperCase()}
            </div>
            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '4px' }}>{name}</h2>
            <p style={{ color: '#282828', fontSize: '12px', fontFamily: 'DM Mono, monospace' }}>{user?.email}</p>
          </div>

          <p style={{ color: '#2a2a2a', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', padding: '0 8px', marginBottom: '8px' }}>Settings</p>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {sections.map(({ id, label, Icon }) => {
              const on = activeSection === id
              return (
                <button key={id} className="section-btn" onClick={() => setActiveSection(id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 12px', borderRadius: '8px', background: on ? '#141414' : 'transparent', color: on ? '#fff' : '#333', fontSize: '15px', fontWeight: on ? '600' : '400', position: 'relative' }}>
                  {on && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '18px', background: '#4ade80', borderRadius: '0 3px 3px 0' }} />}
                  <span style={{ opacity: on ? 1 : 0.5 }}><Icon /></span>
                  {label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* MAIN */}
        <div className="sb-hide" style={{ flex: 1, overflowY: 'auto', padding: '48px 56px', maxWidth: '720px' }}>

          {/* ── PASSWORD ── */}
          {activeSection === 'password' && (
            <div style={{ animation: 'fadeUp .2s ease' }}>
              <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>Password</h1>
              <p style={{ color: '#282828', fontSize: '14px', fontFamily: 'DM Mono, monospace', marginBottom: '40px' }}>Change your account password</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>

                <div>
                  <label style={{ color: '#666', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: '8px' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} className="input-field" placeholder="Min. 8 characters"
                      value={newPw} onChange={e => setNewPw(e.target.value)} style={{ paddingRight: '48px' }} />
                    <button onClick={() => setShowPw(!showPw)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#333', cursor: 'pointer', display: 'flex' }}>
                      {showPw ? <Icons.eyeoff /> : <Icons.eye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ color: '#666', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: '8px' }}>Confirm New Password</label>
                  <input type={showPw ? 'text' : 'password'} className="input-field" placeholder="Repeat new password"
                    value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                  {confirmPw && newPw !== confirmPw && (
                    <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px', fontFamily: 'DM Mono, monospace' }}>Passwords don't match</p>
                  )}
                  {confirmPw && newPw === confirmPw && newPw.length >= 8 && (
                    <p style={{ color: '#4ade80', fontSize: '12px', marginTop: '6px', fontFamily: 'DM Mono, monospace', display: 'flex', alignItems: 'center', gap: '4px' }}><Icons.check /> Passwords match</p>
                  )}
                </div>

                {/* Password strength */}
                {newPw && (
                  <div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      {[
                        newPw.length >= 8,
                        /[A-Z]/.test(newPw),
                        /[0-9]/.test(newPw),
                        /[^A-Za-z0-9]/.test(newPw),
                      ].map((ok, i) => (
                        <div key={i} style={{ flex: 1, height: '3px', borderRadius: '3px', background: ok ? '#4ade80' : '#1f1f1f', transition: 'background .2s' }} />
                      ))}
                    </div>
                    <p style={{ color: '#333', fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>
                      {newPw.length < 8 ? 'Too short' : /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) && /[^A-Za-z0-9]/.test(newPw) ? '✓ Strong password' : 'Add uppercase, numbers, or symbols for a stronger password'}
                    </p>
                  </div>
                )}
              </div>

              <button className="save-btn" onClick={handlePasswordChange} disabled={pwLoading}
                style={{ background: '#4ade80', color: '#061009', borderRadius: '10px', padding: '13px 28px', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', opacity: pwLoading ? 0.7 : 1 }}>
                {pwLoading ? 'Updating...' : <><Icons.check /> Update Password</>}
              </button>

              {/* Danger Zone */}
              <div style={{ marginTop: '60px', borderTop: '1px solid #111', paddingTop: '40px' }}>
                <h3 style={{ color: '#f87171', fontSize: '16px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.3px' }}>Danger Zone</h3>
                <p style={{ color: '#282828', fontSize: '13px', fontFamily: 'DM Mono, monospace', marginBottom: '20px' }}>These actions are permanent and cannot be undone.</p>
                <button className="danger-btn" onClick={handleDeleteAccount}
                  style={{ display: 'flex', alignItems: 'center', gap: '9px', background: '#110808', border: '1px solid #2a1414', color: '#f87171', borderRadius: '10px', padding: '12px 20px', fontSize: '14px', fontWeight: '600' }}>
                  <Icons.trash /> Delete Account
                </button>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeSection === 'notifications' && (
            <div style={{ animation: 'fadeUp .2s ease' }}>
              <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>Notifications</h1>
              <p style={{ color: '#282828', fontSize: '14px', fontFamily: 'DM Mono, monospace', marginBottom: '40px' }}>Choose what Glotto notifies you about</p>

              <div style={{ background: '#0f0f0f', border: '1px solid #181818', borderRadius: '14px', overflow: 'hidden' }}>
                {[
                  { key: 'dailyReminder', label: 'Daily Reminder', desc: 'Get reminded to practice every day', accent: '#4ade80' },
                  { key: 'streakAlert', label: 'Streak Alert', desc: 'Warning when your streak is about to break', accent: '#fb923c' },
                  { key: 'weeklyReport', label: 'Weekly Progress Report', desc: 'Summary of your week sent every Sunday', accent: '#60a5fa' },
                  { key: 'newRewards', label: 'New Rewards', desc: 'When new partner rewards become available', accent: '#fbbf24' },
                  { key: 'tips', label: 'Learning Tips', desc: 'Occasional tips to improve faster', accent: '#c084fc' },
                ].map(({ key, label, desc, accent }, i, arr) => (
                  <div key={key} className="notif-row"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: i < arr.length - 1 ? '1px solid #131313' : 'none' }}>
                    <div>
                      <p style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{label}</p>
                      <p style={{ color: '#282828', fontSize: '12px', fontFamily: 'DM Mono, monospace' }}>{desc}</p>
                    </div>
                    <Toggle on={notifs[key as keyof typeof notifs]} onChange={v => setNotifs(n => ({ ...n, [key]: v }))} />
                  </div>
                ))}
              </div>

              <button className="save-btn" onClick={() => showToast('Notification preferences saved', 'success')}
                style={{ background: '#4ade80', color: '#061009', borderRadius: '10px', padding: '13px 28px', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '28px' }}>
                <Icons.check /> Save Preferences
              </button>
            </div>
          )}

          {/* ── PREFERENCES ── */}
          {activeSection === 'preferences' && (
            <div style={{ animation: 'fadeUp .2s ease' }}>
              <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>Preferences</h1>
              <p style={{ color: '#282828', fontSize: '14px', fontFamily: 'DM Mono, monospace', marginBottom: '40px' }}>Customize your Glotto experience</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {[
                  {
                    label: 'Default Session Length', key: 'sessionLength',
                    options: [{ v: '5', l: '5 minutes — Quick practice' }, { v: '10', l: '10 minutes — Standard' }, { v: '20', l: '20 minutes — Deep dive' }, { v: '30', l: '30 minutes — Full session' }]
                  },
                  {
                    label: 'Difficulty Adjustment', key: 'difficulty',
                    options: [{ v: 'adaptive', l: 'Adaptive — Adjusts automatically' }, { v: 'easy', l: 'Easy — Build confidence first' }, { v: 'normal', l: 'Normal — Steady challenge' }, { v: 'hard', l: 'Hard — Push your limits' }]
                  },
                ].map(({ label, key, options }) => (
                  <div key={key}>
                    <label style={{ color: '#666', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: '8px' }}>{label}</label>
                    <select className="pref-select" value={prefs[key as keyof typeof prefs] as string}
                      onChange={e => setPrefs(p => ({ ...p, [key]: e.target.value }))}>
                      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                ))}

                <div style={{ background: '#0f0f0f', border: '1px solid #181818', borderRadius: '14px', overflow: 'hidden' }}>
                  {[
                    { key: 'soundEffects', label: 'Sound Effects', desc: 'Play sounds for correct answers and XP gains' },
                    { key: 'autoPlay', label: 'Auto-play Audio', desc: 'Automatically play word pronunciation' },
                  ].map(({ key, label, desc }, i, arr) => (
                    <div key={key} className="notif-row"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: i < arr.length - 1 ? '1px solid #131313' : 'none' }}>
                      <div>
                        <p style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{label}</p>
                        <p style={{ color: '#282828', fontSize: '12px', fontFamily: 'DM Mono, monospace' }}>{desc}</p>
                      </div>
                      <Toggle on={prefs[key as keyof typeof prefs] as boolean} onChange={v => setPrefs(p => ({ ...p, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>

              <button className="save-btn" onClick={() => showToast('Preferences saved', 'success')}
                style={{ background: '#4ade80', color: '#061009', borderRadius: '10px', padding: '13px 28px', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '28px' }}>
                <Icons.check /> Save Preferences
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  )
}