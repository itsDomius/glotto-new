'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const LANGUAGES = [
  { code: 'spanish', label: 'Spanish', flag: '🇪🇸' },
  { code: 'french', label: 'French', flag: '🇫🇷' },
  { code: 'german', label: 'German', flag: '🇩🇪' },
  { code: 'italian', label: 'Italian', flag: '🇮🇹' },
  { code: 'portuguese', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'japanese', label: 'Japanese', flag: '🇯🇵' },
  { code: 'mandarin', label: 'Mandarin', flag: '🇨🇳' },
  { code: 'greek', label: 'Greek', flag: '🇬🇷' },
]

const LEVELS = [
  { code: 'A1', label: 'Complete Beginner', desc: 'I know almost nothing' },
  { code: 'A2', label: 'Elementary', desc: 'I know basic phrases and greetings' },
  { code: 'B1', label: 'Intermediate', desc: 'I can handle simple conversations' },
  { code: 'B2', label: 'Upper Intermediate', desc: 'I can discuss most topics' },
  { code: 'C1', label: 'Advanced', desc: 'I am nearly fluent' },
  { code: 'C2', label: 'Mastery', desc: 'I want to perfect my language' },
]

const GOALS = [
  { code: 'travel', label: 'Travel independently', desc: 'Navigate a country with confidence', icon: '✈️' },
  { code: 'job', label: 'Get a job or promotion', desc: 'Career advancement requiring language skills', icon: '💼' },
  { code: 'netflix', label: 'Watch without subtitles', desc: 'Fully enjoy films, series, and videos', icon: '🎬' },
  { code: 'connect', label: 'Connect with people', desc: 'Make friends, date, build relationships', icon: '❤️' },
  { code: 'move', label: 'Move to another country', desc: 'Live and thrive in a new place', icon: '🏡' },
  { code: 'exam', label: 'Pass a language exam', desc: 'IELTS, TOEFL, DELF, or other certification', icon: '📜' },
  { code: 'business', label: 'Run my business globally', desc: 'Communicate with international clients', icon: '🌍' },
  { code: 'study', label: 'Study abroad', desc: 'Attend university or courses overseas', icon: '🎓' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [language, setLanguage] = useState('')
  const [level, setLevel] = useState('')
  const [goal, setGoal] = useState('')
  const [nativeLanguage, setNativeLanguage] = useState('')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const totalSteps = 5

  const handleFinish = async () => {
    setSaving(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('User:', user, 'Error:', userError)

      if (!user) {
        console.log('No user found, redirecting to login')
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase.from('profiles').upsert({
        user_id: user.id,
        full_name: fullName,
        target_language: language,
        current_level: level,
        dream_goal: goal,
        native_language: nativeLanguage,
        onboarding_complete: true,
      })

      console.log('Profile save result:', data, 'Error:', error)
    } catch (err) {
      console.error('Onboarding error:', err)
    }

    // Always redirect to dashboard
    router.push('/dashboard')
  }

  const canContinue =
    (step === 1 && !!language) ||
    (step === 2 && !!level) ||
    (step === 3 && !!goal) ||
    (step === 4 && !!nativeLanguage.trim()) ||
    (step === 5 && !!fullName.trim())

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px 24px',
      fontFamily: 'inherit',
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '560px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
        <span style={{ color: '#4ade80', fontWeight: '800', fontSize: '20px' }}>Glotto</span>
        <span style={{ color: '#333', fontSize: '14px' }}>{step} of {totalSteps}</span>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: '560px', height: '2px', background: '#1a1a1a', borderRadius: '2px', marginBottom: '48px' }}>
        <div style={{
          height: '2px', background: '#4ade80', borderRadius: '2px',
          width: `${(step / totalSteps) * 100}%`, transition: 'width 0.3s'
        }} />
      </div>

      {/* Content */}
      <div style={{ width: '100%', maxWidth: '560px' }}>

        {/* STEP 1 — Language */}
        {step === 1 && (
          <div>
            <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>Which language?</h1>
            <p style={{ color: '#555', fontSize: '16px', textAlign: 'center', marginBottom: '36px' }}>Choose your target language</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
              {LANGUAGES.map(l => (
                <div key={l.code} onClick={() => setLanguage(l.code)} style={{
                  background: language === l.code ? '#0f2a1a' : '#111',
                  border: `2px solid ${language === l.code ? '#4ade80' : '#1f1f1f'}`,
                  borderRadius: '14px', padding: '20px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  transition: 'all 0.15s'
                }}>
                  <span style={{ fontSize: '28px' }}>{l.flag}</span>
                  <span style={{ color: language === l.code ? '#4ade80' : '#fff', fontSize: '15px', fontWeight: '600' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Level */}
        {step === 2 && (
          <div>
            <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>What is your level?</h1>
            <p style={{ color: '#555', fontSize: '16px', textAlign: 'center', marginBottom: '36px' }}>Be honest — we adapt everything to where you are</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
              {LEVELS.map(l => (
                <div key={l.code} onClick={() => setLevel(l.code)} style={{
                  background: level === l.code ? '#0f2a1a' : '#111',
                  border: `2px solid ${level === l.code ? '#4ade80' : '#1f1f1f'}`,
                  borderRadius: '14px', padding: '18px 20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  transition: 'all 0.15s'
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: level === l.code ? '#4ade80' : '#1a1a1a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: '13px',
                    color: level === l.code ? '#050f06' : '#555',
                    flexShrink: 0
                  }}>{l.code}</div>
                  <div>
                    <div style={{ color: level === l.code ? '#4ade80' : '#fff', fontWeight: '700', fontSize: '15px' }}>{l.label}</div>
                    <div style={{ color: '#555', fontSize: '13px', marginTop: '2px' }}>{l.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 — Goal */}
        {step === 3 && (
          <div>
            <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>What is your dream goal?</h1>
            <p style={{ color: '#555', fontSize: '16px', textAlign: 'center', marginBottom: '36px' }}>Everything we build for you aims at this outcome</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
              {GOALS.map(g => (
                <div key={g.code} onClick={() => setGoal(g.code)} style={{
                  background: goal === g.code ? '#0f2a1a' : '#111',
                  border: `2px solid ${goal === g.code ? '#4ade80' : '#1f1f1f'}`,
                  borderRadius: '14px', padding: '18px 20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  transition: 'all 0.15s'
                }}>
                  <span style={{ fontSize: '24px', flexShrink: 0 }}>{g.icon}</span>
                  <div>
                    <div style={{ color: goal === g.code ? '#4ade80' : '#fff', fontWeight: '700', fontSize: '15px' }}>{g.label}</div>
                    <div style={{ color: '#555', fontSize: '13px', marginTop: '2px' }}>{g.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4 — Native language */}
        {step === 4 && (
          <div>
            <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>Your native language?</h1>
            <p style={{ color: '#555', fontSize: '16px', textAlign: 'center', marginBottom: '36px' }}>Lex will use this to explain things in a way that makes sense to you</p>
            <input
              value={nativeLanguage}
              onChange={e => setNativeLanguage(e.target.value)}
              placeholder='e.g. English, Greek, Polish...'
              style={{
                width: '100%', background: '#111', border: '2px solid #1f1f1f',
                borderRadius: '14px', padding: '18px 20px', color: '#fff',
                fontSize: '16px', outline: 'none', marginBottom: '32px',
                boxSizing: 'border-box', fontFamily: 'inherit'
              }}
              onFocus={e => e.target.style.borderColor = '#4ade80'}
              onBlur={e => e.target.style.borderColor = '#1f1f1f'}
            />
          </div>
        )}

        {/* STEP 5 — Name */}
        {step === 5 && (
          <div>
            <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>Last thing — your name</h1>
            <p style={{ color: '#555', fontSize: '16px', textAlign: 'center', marginBottom: '36px' }}>Lex will use this every session. Make it personal.</p>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder='Your first name'
              style={{
                width: '100%', background: '#111', border: '2px solid #1f1f1f',
                borderRadius: '14px', padding: '18px 20px', color: '#fff',
                fontSize: '16px', outline: 'none', marginBottom: '16px',
                boxSizing: 'border-box', fontFamily: 'inherit'
              }}
              onFocus={e => e.target.style.borderColor = '#4ade80'}
              onBlur={e => e.target.style.borderColor = '#1f1f1f'}
            />
            <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '14px', padding: '16px 20px', marginBottom: '32px' }}>
              <p style={{ color: '#4ade80', fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>Your setup</p>
              <p style={{ color: '#aaa', fontSize: '14px' }}>
                Learning <strong style={{ color: '#fff' }}>{language}</strong> from <strong style={{ color: '#fff' }}>{level}</strong> — goal: <strong style={{ color: '#fff' }}>{GOALS.find(g => g.code === goal)?.label}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={step === totalSteps ? handleFinish : () => setStep(step + 1)}
          disabled={!canContinue || saving}
          style={{
            width: '100%', padding: '18px',
            background: saving ? '#1a3a2a' : '#4ade80',
            color: saving ? '#2a5a3a' : '#050f06',
            border: 'none', borderRadius: '14px',
            fontSize: '16px', fontWeight: '800',
            cursor: canContinue ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            opacity: canContinue && !saving ? 1 : 0.3
          }}
        >
          {saving ? 'Setting up your account...' : step === totalSteps ? 'Start learning →' : 'Continue →'}
        </button>

        {step > 1 && (
          <button onClick={() => setStep(step - 1)} style={{
            width: '100%', padding: '14px', background: 'none',
            border: 'none', color: '#333', fontSize: '14px',
            cursor: 'pointer', marginTop: '12px'
          }}>← Back</button>
        )}

      </div>
    </div>
  )
}