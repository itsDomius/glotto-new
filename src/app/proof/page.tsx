'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const GREEN = '#4ade80'
const GREEN_DIM = '#0f2a1a'
const GREEN_BORDER = '#1a3a1f'

type Recording = {
  id: string
  recorded_at: string
  duration_seconds: number
  storage_path: string
  month: string
  language: string
  level: string
  label: string
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split('-')
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

function AudioPlayer({ url, duration }: { url: string; duration: number }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100
    setProgress(pct || 0)
    setCurrentTime(Math.floor(audioRef.current.currentTime))
  }

  const handleEnded = () => {
    setPlaying(false)
    setProgress(0)
    setCurrentTime(0)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = pct * audioRef.current.duration
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <audio ref={audioRef} src={url} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} />
      <button
        onClick={toggle}
        style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: playing ? GREEN_DIM : GREEN,
          border: `1px solid ${playing ? GREEN_BORDER : GREEN}`,
          color: playing ? GREEN : '#050f06',
          fontSize: '14px', cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {playing ? '⏸' : '▶'}
      </button>
      <div style={{ flex: 1 }}>
        <div
          onClick={handleSeek}
          style={{
            height: '4px', background: '#1a1a1a', borderRadius: '100px',
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{
            height: '100%', background: GREEN, borderRadius: '100px',
            width: `${progress}%`, transition: 'width 0.1s linear',
          }} />
        </div>
      </div>
      <span style={{ color: '#444', fontSize: '12px', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </span>
    </div>
  )
}

function RecordingCard({ recording, onDelete }: { recording: Recording; onDelete: (id: string) => void }) {
  const [url, setUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const getUrl = async () => {
      const { data } = await supabase.storage
        .from('proof-recordings')
        .createSignedUrl(recording.storage_path, 3600)
      if (data) setUrl(data.signedUrl)
    }
    getUrl()
  }, [recording.storage_path])

  const handleDelete = async () => {
    if (!confirm('Delete this recording? This cannot be undone.')) return
    setDeleting(true)
    await supabase.storage.from('proof-recordings').remove([recording.storage_path])
    await supabase.from('proof_recordings').delete().eq('id', recording.id)
    onDelete(recording.id)
  }

  const monthsAgo = Math.floor(
    (Date.now() - new Date(recording.recorded_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
  )

  return (
    <div style={{
      background: '#0e0e0e',
      border: '1px solid #141414',
      borderRadius: '16px',
      padding: '20px 24px',
      transition: 'border-color 0.15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>
              {recording.label || formatMonth(recording.month)}
            </span>
            <span style={{
              background: `${GREEN}18`, border: `1px solid ${GREEN}30`,
              borderRadius: '6px', padding: '2px 8px',
              color: GREEN, fontSize: '11px', fontWeight: '600',
            }}>
              {recording.level}
            </span>
          </div>
          <p style={{ color: '#444', fontSize: '12px', margin: 0 }}>
            {new Date(recording.recorded_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
            {monthsAgo > 0 && <span style={{ color: '#333' }}> · {monthsAgo} month{monthsAgo > 1 ? 's' : ''} ago</span>}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            background: 'none', border: 'none',
            color: '#2a2a2a', fontSize: '16px',
            cursor: 'pointer', padding: '4px',
          }}
        >
          ✕
        </button>
      </div>

      {url ? (
        <AudioPlayer url={url} duration={recording.duration_seconds} />
      ) : (
        <div style={{ height: '36px', display: 'flex', alignItems: 'center' }}>
          <div style={{ color: '#333', fontSize: '13px' }}>Loading audio...</div>
        </div>
      )}
    </div>
  )
}

export default function ProofPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ target_language: string; current_level: string } | null>(null)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)

  // Recording state
  const [recording, setRecording] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [saving, setSaving] = useState(false)
  const [label, setLabel] = useState('')
  const [showLabelInput, setShowLabelInput] = useState(false)
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const [profileRes, recordingsRes] = await Promise.all([
        supabase.from('profiles').select('target_language, current_level').eq('user_id', user.id).single(),
        supabase.from('proof_recordings').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }),
      ])

      if (profileRes.data) setProfile(profileRes.data)
      if (recordingsRes.data) setRecordings(recordingsRes.data)
      setLoading(false)
    }
    load()
  }, [])

  const startRecording = async () => {
    // 3-second countdown
    setCountdown(3)
    for (let i = 3; i > 0; i--) {
      await new Promise(r => setTimeout(r, 1000))
      setCountdown(i - 1)
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setPendingBlob(blob)
        setShowLabelInput(true)
      }

      mediaRecorder.start()
      setRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
    } catch {
      alert('Microphone access is required. Please allow it in your browser settings.')
      setCountdown(0)
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const saveRecording = async () => {
    if (!pendingBlob || !userId || !profile) return
    setSaving(true)

    const month = new Date().toISOString().slice(0, 7)
    const filename = `${userId}/${month}-${Date.now()}.webm`

    const { error: uploadError } = await supabase.storage
      .from('proof-recordings')
      .upload(filename, pendingBlob, { contentType: 'audio/webm' })

    if (uploadError) {
      alert('Upload failed. Try again.')
      setSaving(false)
      return
    }

    const { data: newRec } = await supabase
      .from('proof_recordings')
      .insert({
        user_id: userId,
        duration_seconds: recordingTime,
        storage_path: filename,
        month,
        language: profile.target_language,
        level: profile.current_level,
        label: label.trim() || formatMonth(month),
      })
      .select()
      .single()

    if (newRec) setRecordings(prev => [newRec, ...prev])
    setPendingBlob(null)
    setShowLabelInput(false)
    setLabel('')
    setRecordingTime(0)
    setSaving(false)
  }

  const discardRecording = () => {
    setPendingBlob(null)
    setShowLabelInput(false)
    setLabel('')
    setRecordingTime(0)
  }

  if (loading) return (
    <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: GREEN, fontSize: '15px' }}>Loading...</div>
    </div>
  )

  const thisMonth = new Date().toISOString().slice(0, 7)
  const hasRecordedThisMonth = recordings.some(r => r.month === thisMonth)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Sidebar */}
      <div style={{
        width: '220px', flexShrink: 0,
        background: '#080808', borderRight: '1px solid #111',
        display: 'flex', flexDirection: 'column',
        padding: '24px 12px',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '0 8px', marginBottom: '32px' }}>
          <span style={{ color: GREEN, fontWeight: '800', fontSize: '20px' }}>Glotto</span>
        </div>
        {[
          { icon: '⬛', label: 'Dashboard', href: '/dashboard', active: false },
          { icon: '✦', label: 'Talk to Lex', href: '/tutor', active: false },
          { icon: '🎯', label: 'Missions', href: '/missions', active: false },
          { icon: '🎙', label: 'The Proof', href: '/proof', active: true },
          { icon: '💳', label: 'Upgrade', href: '/pricing', active: false },
        ].map(({ icon, label, href, active }) => (
          <button key={label} onClick={() => router.push(href)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            background: active ? GREEN_DIM : 'transparent',
            border: `1px solid ${active ? GREEN_BORDER : 'transparent'}`,
            color: active ? GREEN : '#444',
            fontSize: '14px', fontWeight: active ? '600' : '400',
            cursor: 'pointer', marginBottom: '2px', textAlign: 'left',
          }}>
            <span style={{ fontSize: '16px' }}>{icon}</span>{label}
          </button>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '40px', maxWidth: '800px' }}>

        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', margin: '0 0 8px' }}>The Proof 🎙</h1>
          <p style={{ color: '#555', fontSize: '15px', margin: 0, lineHeight: 1.6 }}>
            Record yourself speaking each month. Come back in 90 days and listen to who you were.
            That gap — that's your proof.
          </p>
        </div>

        {/* Record card */}
        {!showLabelInput ? (
          <div style={{
            background: recording ? '#0a1a0a' : GREEN_DIM,
            border: `2px solid ${recording ? GREEN : GREEN_BORDER}`,
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '24px',
            textAlign: 'center',
          }}>
            {countdown > 0 ? (
              <div>
                <div style={{
                  fontSize: '80px', fontWeight: '800', color: GREEN,
                  lineHeight: 1, marginBottom: '12px',
                  animation: 'pulse 0.8s ease infinite',
                }}>
                  {countdown}
                </div>
                <p style={{ color: '#555', fontSize: '15px', margin: 0 }}>Get ready to speak...</p>
              </div>
            ) : recording ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: '#ff4444',
                    animation: 'pulse 1s ease infinite',
                  }} />
                  <span style={{ color: '#ff4444', fontSize: '14px', fontWeight: '700' }}>RECORDING</span>
                </div>
                <div style={{
                  fontSize: '48px', fontWeight: '800', color: '#fff',
                  fontVariantNumeric: 'tabular-nums', marginBottom: '20px',
                }}>
                  {formatDuration(recordingTime)}
                </div>
                <p style={{ color: '#555', fontSize: '14px', marginBottom: '24px' }}>
                  Just speak naturally. Introduce yourself. Say what you're learning and why.
                </p>
                <button
                  onClick={stopRecording}
                  style={{
                    background: '#ff4444', color: '#fff',
                    border: 'none', borderRadius: '12px',
                    padding: '14px 32px', fontSize: '15px', fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Stop Recording ⏹
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎙</div>
                <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', margin: '0 0 8px' }}>
                  {hasRecordedThisMonth ? 'Record again this month' : 'Record this month\'s Proof'}
                </h2>
                <p style={{ color: '#555', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.6 }}>
                  {hasRecordedThisMonth
                    ? 'You\'ve already recorded this month. You can record another take.'
                    : 'Speak for 1–3 minutes. Introduce yourself, describe your goals, say anything in your target language.'}
                </p>
                <button
                  onClick={startRecording}
                  style={{
                    background: GREEN, color: '#050f06',
                    border: 'none', borderRadius: '12px',
                    padding: '14px 32px', fontSize: '15px', fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 24px rgba(74,222,128,0.25)',
                  }}
                >
                  Start Recording →
                </button>
              </div>
            )}
          </div>
        ) : (
          // Label + save
          <div style={{
            background: GREEN_DIM, border: `2px solid ${GREEN_BORDER}`,
            borderRadius: '20px', padding: '32px',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />
              <span style={{ color: GREEN, fontSize: '14px', fontWeight: '700' }}>
                Recording done · {formatDuration(recordingTime)}
              </span>
            </div>
            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '800', margin: '0 0 20px' }}>
              Give it a name
            </h2>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={`e.g. "First recording ever" or "${formatMonth(thisMonth)}"`}
              style={{
                width: '100%', background: '#0a0a0a', border: '1px solid #1f1f1f',
                borderRadius: '12px', padding: '14px 18px', color: '#fff',
                fontSize: '15px', outline: 'none', marginBottom: '16px',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = GREEN}
              onBlur={e => e.target.style.borderColor = '#1f1f1f'}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={saveRecording}
                disabled={saving}
                style={{
                  background: saving ? '#1a3a2a' : GREEN,
                  color: saving ? '#2a5a3a' : '#050f06',
                  border: 'none', borderRadius: '12px',
                  padding: '14px 28px', fontSize: '15px', fontWeight: '800',
                  cursor: saving ? 'not-allowed' : 'pointer', flex: 1,
                }}
              >
                {saving ? 'Saving...' : 'Save Recording →'}
              </button>
              <button
                onClick={discardRecording}
                style={{
                  background: 'none', border: '1px solid #1f1f1f',
                  borderRadius: '12px', padding: '14px 20px',
                  color: '#444', fontSize: '15px', cursor: 'pointer',
                }}
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Tip */}
        {recordings.length === 0 && (
          <div style={{
            background: '#0e0e0e', border: '1px solid #141414',
            borderRadius: '14px', padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex', gap: '14px', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>💡</span>
            <div>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>What to say</p>
              <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                Introduce yourself. Say why you're learning. Describe what you did today — in your target language if you can, in English if you can't yet. In 3 months, you'll come back and listen. That difference is everything.
              </p>
            </div>
          </div>
        )}

        {/* Recordings list */}
        {recordings.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ color: '#fff', fontSize: '17px', fontWeight: '700', margin: 0 }}>
                Your recordings · {recordings.length}
              </h2>
              {recordings.length >= 2 && (
                <div style={{
                  background: GREEN_DIM, border: `1px solid ${GREEN_BORDER}`,
                  borderRadius: '8px', padding: '4px 12px',
                  color: GREEN, fontSize: '12px', fontWeight: '600',
                }}>
                  Compare first & latest ↓
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recordings.map(r => (
                <RecordingCard
                  key={r.id}
                  recording={r}
                  onDelete={id => setRecordings(prev => prev.filter(rec => rec.id !== id))}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}