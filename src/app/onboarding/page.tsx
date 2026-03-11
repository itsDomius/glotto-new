'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CITIES = [
  { code: 'athens',    label: 'Athens',     flag: '🇬🇷', lang: 'greek' },
  { code: 'berlin',    label: 'Berlin',     flag: '🇩🇪', lang: 'german' },
  { code: 'lisbon',    label: 'Lisbon',     flag: '🇵🇹', lang: 'portuguese' },
  { code: 'amsterdam', label: 'Amsterdam',  flag: '🇳🇱', lang: 'dutch' },
  { code: 'madrid',    label: 'Madrid',     flag: '🇪🇸', lang: 'spanish' },
  { code: 'paris',     label: 'Paris',      flag: '🇫🇷', lang: 'french' },
  { code: 'milan',     label: 'Milan',      flag: '🇮🇹', lang: 'italian' },
  { code: 'barcelona', label: 'Barcelona',  flag: '🇪🇸', lang: 'spanish' },
  { code: 'prague',    label: 'Prague',     flag: '🇨🇿', lang: 'czech' },
  { code: 'warsaw',    label: 'Warsaw',     flag: '🇵🇱', lang: 'polish' },
  { code: 'stockholm', label: 'Stockholm',  flag: '🇸🇪', lang: 'swedish' },
  { code: 'other',     label: 'Other city', flag: '🌍', lang: '' },
]

const LANGUAGES = [
  { code: 'greek',      label: 'Greek',      flag: '🇬🇷' },
  { code: 'german',     label: 'German',     flag: '🇩🇪' },
  { code: 'spanish',    label: 'Spanish',    flag: '🇪🇸' },
  { code: 'french',     label: 'French',     flag: '🇫🇷' },
  { code: 'italian',    label: 'Italian',    flag: '🇮🇹' },
  { code: 'portuguese', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'dutch',      label: 'Dutch',      flag: '🇳🇱' },
  { code: 'polish',     label: 'Polish',     flag: '🇵🇱' },
  { code: 'swedish',    label: 'Swedish',    flag: '🇸🇪' },
  { code: 'czech',      label: 'Czech',      flag: '🇨🇿' },
  { code: 'japanese',   label: 'Japanese',   flag: '🇯🇵' },
  { code: 'mandarin',   label: 'Mandarin',   flag: '🇨🇳' },
]

const LEVELS = [
  { code: 'A1', label: 'Complete Beginner', desc: 'I know almost nothing yet' },
  { code: 'A2', label: 'Elementary',        desc: 'I know a few basic phrases' },
  { code: 'B1', label: 'Intermediate',      desc: 'I can handle simple conversations' },
  { code: 'B2', label: 'Upper Intermediate',desc: 'I can get by most of the time' },
  { code: 'C1', label: 'Advanced',          desc: 'I am nearly fluent' },
]

const G = '#4ade80'

export default function OnboardingPage() {
  const [step, setStep]         = useState(1)
  const [city, setCity]         = useState('')
  const [language, setLanguage] = useState('')
  const [level, setLevel]       = useState('')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving]     = useState(false)
  const router = useRouter()
  const TOTAL = 4

  const pickCity = (code: string) => {
    setCity(code)
    const found = CITIES.find(c => c.code === code)
    if (found?.lang) setLanguage(found.lang)
  }

  const canContinue =
    (step === 1 && !!city) ||
    (step === 2 && !!language) ||
    (step === 3 && !!level) ||
    (step === 4 && fullName.trim().length >= 1)

  const handleFinish = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      await supabase.from('profiles').upsert({
        user_id: user.id,
        full_name: fullName.trim(),
        city,
        target_language: language,
        current_level: level,
        dream_goal: 'relocation',
        native_language: 'english',
        onboarding_complete: true,
        mission_day: 1,
        staked_amount: 0,
      })
    } catch (err) {
      console.error('Onboarding error:', err)
    }
    router.push('/dashboard')
  }

  const next = () => step === TOTAL ? handleFinish() : setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', color: '#fff',
      fontFamily: '"DM Sans", -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        .step { animation: fadeUp 0.35s cubic-bezier(.16,1,.3,1) both; }
        .opt:hover { border-color: #2a2a2a !important; }
        .opt { transition: all 0.15s; cursor: pointer; }
        input:focus { border-color: #4ade80 !important; outline: none; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '540px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <span style={{ color: G, fontWeight: '800', fontSize: '20px' }}>Glotto</span>
        <span style={{ color: '#2a2a2a', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>{step} of {TOTAL}</span>
      </div>

      <div style={{ width: '100%', maxWidth: '540px', height: '2px', background: '#111', borderRadius: '2px', marginBottom: '48px' }}>
        <div style={{ height: '2px', background: G, borderRadius: '2px', width: `${(step / TOTAL) * 100}%`, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '540px' }}>

        {step === 1 && (
          <div className="step">
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '100px', padding: '4px 12px', fontSize: '11px', color: G, fontWeight: '700', marginBottom: '16px', letterSpacing: '0.08em' }}>
                📍 STEP 1 OF 4
              </div>
              <h1 style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: '8px' }}>Where did you land?</h1>
              <p style={{ color: '#555', fontSize: '15px', lineHeight: 1.6 }}>We build your survival missions around your exact city — its bureaucracy, its language, its system.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '32px' }}>
              {CITIES.map(c => (
                <div key={c.code} className="opt" onClick={() => pickCity(c.code)} style={{ background: city === c.code ? '#0f2a1a' : '#111', border: `2px solid ${city === c.code ? G : '#1a1a1a'}`, borderRadius: '14px', padding: '18px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px', flexShrink: 0 }}>{c.flag}</span>
                  <span style={{ color: city === c.code ? G : '#fff', fontWeight: '700', fontSize: '15px' }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step">
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '100px', padding: '4px 12px', fontSize: '11px', color: G, fontWeight: '700', marginBottom: '16px', letterSpacing: '0.08em' }}>
                🗣 STEP 2 OF 4
              </div>
              <h1 style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: '8px' }}>Which language will you need?</h1>
              <p style={{ color: '#555', fontSize: '15px', lineHeight: 1.6 }}>{language ? 'We pre-selected based on your city — change it if needed.' : 'Pick the language of your new home.'}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '32px' }}>
              {LANGUAGES.map(l => (
                <div key={l.code} className="opt" onClick={() => setLanguage(l.code)} style={{ background: language === l.code ? '#0f2a1a' : '#111', border: `2px solid ${language === l.code ? G : '#1a1a1a'}`, borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{l.flag}</span>
                  <span style={{ color: language === l.code ? G : '#fff', fontWeight: '700', fontSize: '15px' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step">
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '100px', padding: '4px 12px', fontSize: '11px', color: G, fontWeight: '700', marginBottom: '16px', letterSpacing: '0.08em' }}>
                📊 STEP 3 OF 4
              </div>
              <h1 style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: '8px' }}>How much do you know?</h1>
              <p style={{ color: '#555', fontSize: '15px', lineHeight: 1.6 }}>Be honest — missions adapt to your level. Starting from zero is fine.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
              {LEVELS.map(l => (
                <div key={l.code} className="opt" onClick={() => setLevel(l.code)} style={{ background: level === l.code ? '#0f2a1a' : '#111', border: `2px solid ${level === l.code ? G : '#1a1a1a'}`, borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '10px', flexShrink: 0, background: level === l.code ? G : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', color: level === l.code ? '#050f06' : '#555', fontFamily: 'DM Mono, monospace' }}>{l.code}</div>
                  <div>
                    <p style={{ color: level === l.code ? G : '#fff', fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>{l.label}</p>
                    <p style={{ color: '#444', fontSize: '12px' }}>{l.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step">
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '100px', padding: '4px 12px', fontSize: '11px', color: G, fontWeight: '700', marginBottom: '16px', letterSpacing: '0.08em' }}>
                ✦ STEP 4 OF 4
              </div>
              <h1 style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: '8px' }}>Last thing — your name</h1>
              <p style={{ color: '#555', fontSize: '15px', lineHeight: 1.6 }}>Lex will use it every session.</p>
            </div>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canContinue && next()}
              placeholder="Your first name"
              autoFocus
              style={{ width: '100%', background: '#111', border: '2px solid #1a1a1a', borderRadius: '14px', padding: '18px 20px', color: '#fff', fontSize: '18px', marginBottom: '20px', fontFamily: 'DM Sans, sans-serif', transition: 'border-color 0.15s' }}
            />
            <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '20px 22px', marginBottom: '32px' }}>
              <p style={{ color: '#333', fontSize: '10px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', marginBottom: '14px' }}>YOUR SETUP</p>
              {[
                { label: 'City',     value: CITIES.find(c => c.code === city)?.label || city },
                { label: 'Language', value: LANGUAGES.find(l => l.code === language)?.label || language },
                { label: 'Level',    value: LEVELS.find(l => l.code === level)?.label || level },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #111' }}>
                  <span style={{ color: '#333', fontSize: '13px' }}>{label}</span>
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={next}
          disabled={!canContinue || saving}
          style={{ width: '100%', padding: '18px', background: canContinue && !saving ? G : '#111', color: canContinue && !saving ? '#050f06' : '#333', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '800', cursor: canContinue && !saving ? 'pointer' : 'not-allowed', transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif' }}
        >
          {saving ? 'Setting up...' : step === TOTAL ? 'Start my first mission →' : 'Continue →'}
        </button>

        {step > 1 && (
          <button onClick={back} style={{ width: '100%', padding: '14px', background: 'none', border: 'none', color: '#333', fontSize: '14px', cursor: 'pointer', marginTop: '10px', fontFamily: 'DM Sans, sans-serif' }}>← Back</button>
        )}
      </div>
    </div>
  )
}
