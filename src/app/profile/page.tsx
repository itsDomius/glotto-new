'use client'

import React from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const Icons = {
  back: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  edit: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  camera: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  globe: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  target: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  user: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  star: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
}

const LANGUAGES = [
  { value: 'spanish', label: 'Spanish', flag: '🇪🇸' },
  { value: 'french', label: 'French', flag: '🇫🇷' },
  { value: 'german', label: 'German', flag: '🇩🇪' },
  { value: 'italian', label: 'Italian', flag: '🇮🇹' },
  { value: 'portuguese', label: 'Portuguese', flag: '🇵🇹' },
  { value: 'english', label: 'English', flag: '🇬🇧' },
  { value: 'japanese', label: 'Japanese', flag: '🇯🇵' },
  { value: 'mandarin', label: 'Mandarin', flag: '🇨🇳' },
]

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LEVEL_NAMES: Record<string, string> = { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper Intermediate', C1: 'Advanced', C2: 'Mastery' }

const GOALS = [
  { value: 'travel', label: 'Travel independently', icon: '✈️' },
  { value: 'job', label: 'Get a job or promotion', icon: '💼' },
  { value: 'netflix', label: 'Watch content without subtitles', icon: '🎬' },
  { value: 'move', label: 'Move to another country', icon: '🌍' },
  { value: 'exam', label: 'Pass a language exam', icon: '📝' },
  { value: 'connect', label: 'Connect with people', icon: '🤝' },
  { value: 'business', label: 'Run my business internationally', icon: '📈' },
  { value: 'study', label: 'Study abroad', icon: '🎓' },
]

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)
  const [profile, setProfile] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Editable fields
  const [fullName, setFullName] = React.useState('')
  const [targetLang, setTargetLang] = React.useState('spanish')
  const [currentLevel, setCurrentLevel] = React.useState('A1')
  const [dreamGoal, setDreamGoal] = React.useState('travel')
  const [nativeLang, setNativeLang] = React.useState('')
  const [bio, setBio] = React.useState('')

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  React.useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (p) {
        setProfile(p)
        setFullName(p.full_name || user.user_metadata?.full_name || '')
        setTargetLang(p.target_language || 'spanish')
        setCurrentLevel(p.current_level || 'A1')
        setDreamGoal(p.dream_goal || 'travel')
        setNativeLang(p.native_language || '')
        setBio(p.bio || '')
      }
      setLoading(false)
    }
    load()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      target_language: targetLang,
      current_level: currentLevel,
      dream_goal: dreamGoal,
      native_language: nativeLang,
      bio,
    }).eq('user_id', user.id)
    setSaving(false)
    if (error) showToast('Failed to save changes', 'error')
    else showToast('Profile saved successfully', 'success')
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#4ade80', animation: 'spin .8s linear infinite' }} />
    </main>
  )

  const name = fullName || user?.user_metadata?.full_name || 'there'
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const selectedLang = LANGUAGES.find(l => l.value === targetLang)
  const selectedGoal = GOALS.find(g => g.value === dreamGoal)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;font-family:'DM Sans',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.4)}60%{box-shadow:0 0 0 8px rgba(74,222,128,0)}}
        .back-btn{transition:color .15s;border:none;background:none;cursor:pointer;font-family:'DM Sans',sans-serif}
        .back-btn:hover{color:#888!important}
        .input-field{background:#0e0e0e;border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:13px 16px;color:#fff;font-size:15px;width:100%;outline:none;transition:border-color .15s;font-family:'DM Sans',sans-serif}
        .input-field:focus{border-color:rgba(74,222,128,.3)}
        .input-field::placeholder{color:#252525}
        .lang-card{transition:all .15s ease;cursor:pointer;border:2px solid transparent}
        .lang-card:hover{border-color:rgba(255,255,255,.1)!important;background:#141414!important}
        .level-btn{transition:all .15s ease;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
        .level-btn:hover{border-color:rgba(74,222,128,.3)!important}
        .goal-card{transition:all .15s ease;cursor:pointer}
        .goal-card:hover{border-color:rgba(255,255,255,.1)!important;background:#141414!important}
        .save-btn{transition:all .18s ease;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
        .save-btn:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(74,222,128,.35)!important}
        .save-btn:active{transform:scale(.98)}
        .avatar-overlay{transition:opacity .2s;opacity:0;cursor:pointer}
        .avatar-wrap:hover .avatar-overlay{opacity:1}
        .sb::-webkit-scrollbar{display:none}
        .sb{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 100, animation: 'toastIn .2s ease', background: toast.type === 'success' ? '#0a1f0f' : '#1a0808', border: `1px solid ${toast.type === 'success' ? 'rgba(74,222,128,.2)' : 'rgba(248,113,113,.2)'}`, borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
          <span style={{ color: toast.type === 'success' ? '#4ade80' : '#f87171', fontSize: '16px' }}>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{toast.msg}</span>
        </div>
      )}

      <div className="sb" style={{ minHeight: '100vh', background: '#070707', overflowY: 'auto' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 48px', animation: 'fadeUp .25s ease' }}>

          {/* HEADER */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
            <button className="back-btn" onClick={() => router.push('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
              <Icons.back /> Back to Dashboard
            </button>
            <button className="save-btn" onClick={handleSave} disabled={saving}
              style={{ background: '#4ade80', color: '#050f06', borderRadius: '10px', padding: '11px 24px', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(74,222,128,.2)', opacity: saving ? .7 : 1 }}>
              {saving ? 'Saving...' : <><Icons.check /> Save Changes</>}
            </button>
          </div>

          {/* AVATAR + NAME */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', marginBottom: '48px', padding: '32px', background: '#0e0e0e', border: '1px solid rgba(74,222,128,.08)', borderRadius: '20px', boxShadow: '0 0 40px rgba(74,222,128,.04)' }}>
            <div className="avatar-wrap" style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '88px', height: '88px', background: 'linear-gradient(135deg,#0f2a1a,#1a4a2e)', border: '2px solid rgba(74,222,128,.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '28px', fontWeight: '900', boxShadow: '0 0 32px rgba(74,222,128,.15)' }}>
                {initials}
              </div>
              <div className="avatar-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Icons.camera />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#444', fontSize: '11px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'DM Mono,monospace', display: 'block', marginBottom: '8px' }}>Full Name</label>
              <input className="input-field" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Your full name" style={{ fontSize: '18px', fontWeight: '700', padding: '12px 16px' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#252525', fontSize: '11px', fontFamily: 'DM Mono,monospace', marginBottom: '4px' }}>Member since</p>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Today'}
              </p>
              <p style={{ color: '#4ade80', fontSize: '12px', fontFamily: 'DM Mono,monospace', marginTop: '4px' }}>{user?.email}</p>
            </div>
          </div>

          {/* BIO */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{ color: '#444', fontSize: '11px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'DM Mono,monospace', display: 'block', marginBottom: '10px' }}>Bio <span style={{ color: '#222', fontWeight: '400' }}>(optional)</span></label>
            <textarea className="input-field" value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tell others why you're learning..." rows={3}
              style={{ resize: 'none', lineHeight: 1.65 }} />
          </div>

          {/* DIVIDER */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,.04)', marginBottom: '40px' }} />

          {/* LEARNING LANGUAGE */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(74,222,128,.08)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}><Icons.globe /></div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: '800', letterSpacing: '-0.4px' }}>Learning Language</h3>
                <p style={{ color: '#252525', fontSize: '11px', fontFamily: 'DM Mono,monospace' }}>Which language are you studying?</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
              {LANGUAGES.map(lang => {
                const on = targetLang === lang.value
                return (
                  <div key={lang.value} className="lang-card" onClick={() => setTargetLang(lang.value)}
                    style={{ background: on ? 'rgba(74,222,128,.08)' : '#0e0e0e', border: `2px solid ${on ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.05)'}`, borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: on ? '0 0 20px rgba(74,222,128,.08)' : 'none' }}>
                    <p style={{ fontSize: '24px', marginBottom: '8px' }}>{lang.flag}</p>
                    <p style={{ color: on ? '#4ade80' : '#888', fontSize: '13px', fontWeight: on ? '700' : '400' }}>{lang.label}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CURRENT LEVEL */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(96,165,250,.08)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}><Icons.star /></div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: '800', letterSpacing: '-0.4px' }}>Current Level</h3>
                <p style={{ color: '#252525', fontSize: '11px', fontFamily: 'DM Mono,monospace' }}>Where are you right now?</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '10px' }}>
              {LEVELS.map(lv => {
                const on = currentLevel === lv
                return (
                  <button key={lv} className="level-btn" onClick={() => setCurrentLevel(lv)}
                    style={{ background: on ? 'rgba(96,165,250,.1)' : '#0e0e0e', border: `2px solid ${on ? 'rgba(96,165,250,.35)' : 'rgba(255,255,255,.05)'}`, borderRadius: '12px', padding: '16px 8px', textAlign: 'center', boxShadow: on ? '0 0 20px rgba(96,165,250,.1)' : 'none' }}>
                    <p style={{ color: on ? '#60a5fa' : '#888', fontSize: '18px', fontWeight: '900', fontFamily: 'DM Mono,monospace', marginBottom: '6px' }}>{lv}</p>
                    <p style={{ color: on ? 'rgba(96,165,250,.7)' : '#252525', fontSize: '10px', fontWeight: '600', letterSpacing: '.5px' }}>{LEVEL_NAMES[lv]}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* DREAM GOAL */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(251,191,36,.08)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}><Icons.target /></div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: '800', letterSpacing: '-0.4px' }}>Dream Goal</h3>
                <p style={{ color: '#252525', fontSize: '11px', fontFamily: 'DM Mono,monospace' }}>Why are you really doing this?</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
              {GOALS.map(goal => {
                const on = dreamGoal === goal.value
                return (
                  <div key={goal.value} className="goal-card" onClick={() => setDreamGoal(goal.value)}
                    style={{ background: on ? 'rgba(251,191,36,.06)' : '#0e0e0e', border: `2px solid ${on ? 'rgba(251,191,36,.25)' : 'rgba(255,255,255,.05)'}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: on ? '0 0 20px rgba(251,191,36,.06)' : 'none' }}>
                    <span style={{ fontSize: '22px' }}>{goal.icon}</span>
                    <p style={{ color: on ? '#fbbf24' : '#888', fontSize: '14px', fontWeight: on ? '700' : '400' }}>{goal.label}</p>
                    {on && <span style={{ marginLeft: 'auto', color: '#fbbf24', flexShrink: 0 }}><Icons.check /></span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* NATIVE LANGUAGE */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(192,132,252,.08)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}><Icons.user /></div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: '800', letterSpacing: '-0.4px' }}>Native Language</h3>
                <p style={{ color: '#252525', fontSize: '11px', fontFamily: 'DM Mono,monospace' }}>Helps Lex teach you better</p>
              </div>
            </div>
            <input className="input-field" value={nativeLang} onChange={e => setNativeLang(e.target.value)}
              placeholder="e.g. Greek, Polish, English..." />
          </div>

          {/* SAVE BUTTON */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '48px' }}>
            <button className="save-btn" onClick={handleSave} disabled={saving}
              style={{ background: '#4ade80', color: '#050f06', borderRadius: '12px', padding: '14px 32px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 24px rgba(74,222,128,.25)', opacity: saving ? .7 : 1 }}>
              {saving ? 'Saving...' : <><Icons.check /> Save Profile</>}
            </button>
          </div>

        </div>
      </div>
    </>
  )
}