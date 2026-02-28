'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import LanguageFitnessScore from '@/components/LanguageFitnessScore'
import ForgettingCurve from '@/components/ForgettingCurve'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [streak, setStreak] = useState<any>(null)
  const [personalBests, setPersonalBests] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const router = useRouter()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileData && !profileData.onboarding_complete) {
        router.push('/onboarding')
        return
      }

      setProfile(profileData)

      const { data: streakData } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setStreak(streakData)

      const { data: pbData } = await supabase
        .from('personal_bests')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setPersonalBests(pbData)
      setLoading(false)
    }
    getData()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="Glotto" className="w-10 h-10 object-contain brightness-0 invert animate-pulse" />
          <p className="text-gray-500 text-sm tracking-widest uppercase">Loading</p>
        </div>
      </main>
    )
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const dreamGoalLabels: Record<string, string> = {
    job: 'Get a job or promotion',
    travel: 'Travel independently',
    netflix: 'Watch content without subtitles',
    move: 'Move to another country',
    exam: 'Pass a language exam',
    connect: 'Connect with people',
    business: 'Run my business internationally',
    study: 'Study abroad',
  }

  const languageFlags: Record<string, string> = {
    english: '🇬🇧',
    spanish: '🇪🇸',
    french: '🇫🇷',
    german: '🇩🇪',
    italian: '🇮🇹',
    portuguese: '🇵🇹',
    japanese: '🇯🇵',
    mandarin: '🇨🇳',
  }

  const currentStreak = streak?.current_streak || 0
  const longestStreak = streak?.longest_streak || 0
  const chainLinks = Array.from({ length: Math.max(currentStreak, 7) }, (_, i) => i < currentStreak)

  const navItems = [
    { id: 'home', label: 'Home', icon: '⊞' },
    { id: 'lessons', label: 'Lessons', icon: '◈' },
    { id: 'tutor', label: 'AI Tutor', icon: '🤖' },
    { id: 'passport', label: 'Passport', icon: '🛂' },
    { id: 'rewards', label: 'Rewards', icon: '🎁' },
  ]

  // Helper for capitalize language
  const targetLang = profile?.target_language ? profile.target_language.charAt(0).toUpperCase() + profile.target_language.slice(1) : 'Language'

  return (
    <div className="flex h-screen bg-[#111111] overflow-hidden">

      {/* LEFT SIDEBAR */}
      <div className="w-64 bg-[#111111] border-r border-[#1f1f1f] flex flex-col px-4 py-6 shrink-0">
        <div className="flex items-center gap-3 px-3 mb-10">
          <img src="/logo.png" alt="Glotto" className="w-7 h-7 object-contain brightness-0 invert" />
          <span className="text-white font-bold text-lg tracking-tight">Glotto</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeTab === item.id
                  ? 'bg-white text-[#111111]'
                  : 'text-gray-500 hover:text-white hover:bg-white hover:bg-opacity-5'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
              {item.id === 'tutor' && (
                <span className="ml-auto w-1.5 h-1.5 bg-green-400 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-white bg-opacity-5 rounded-xl">
          <span className="text-lg">{languageFlags[profile?.target_language] || '🌍'}</span>
          <div>
            <p className="text-white text-sm font-semibold capitalize">{profile?.target_language || 'English'}</p>
            <p className="text-gray-600 text-xs">Level {profile?.current_level || 'A1'}</p>
          </div>
        </div>

        <div className="border-t border-[#1f1f1f] pt-4 px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
              {firstName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{firstName}</p>
              <p className="text-gray-600 text-xs truncate">{user?.email}</p>
            </div>
            <button onClick={handleSignOut} className="text-gray-600 hover:text-gray-400 text-xs transition-colors shrink-0">
              ⏻
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-[#f5f4f0] overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          
          <div className="mb-10">
            <p className="text-gray-400 text-sm mb-1">{greeting}</p>
            <h1 className="text-3xl font-bold text-[#111111] tracking-tight">
              Welcome back, {firstName} 👋
            </h1>
            {profile?.dream_goal && (
              <p className="text-gray-400 text-sm mt-1">
                Goal: {dreamGoalLabels[profile.dream_goal]}
              </p>
            )}
          </div>

          {/* Hero Mission Card */}
          <div className="rounded-3xl p-8 mb-6 relative overflow-hidden"
            style={{background: 'linear-gradient(135deg, #0d2818 0%, #1a4731 60%, #0d3320 100%)'}}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-400 rounded-full opacity-5 blur-3xl" />
            <div className="relative flex items-start justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span className="text-green-400 text-xs font-semibold tracking-widest uppercase">Today's Mission</span>
                </div>
                <h2 className="text-white text-3xl font-bold mb-3 leading-tight">
                  Order a coffee<br />in {targetLang} ☕
                </h2>
                <p className="text-green-200 text-sm leading-relaxed mb-6 max-w-md opacity-70">
                  Practice real café conversation using present simple and polite phrases in {targetLang}.
                </p>
                <button className="px-6 py-3 rounded-2xl bg-green-400 text-green-950 font-bold text-sm hover:bg-green-300 transition-colors">
                  Start Mission →
                </button>
              </div>
              <div className="shrink-0 text-7xl select-none">☕</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#111111] font-bold">The Chain</h3>
              <div className="text-right">
                <p className="text-[#111111] font-bold text-lg">{currentStreak} days</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {chainLinks.map((active, i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${active ? 'bg-yellow-400 text-yellow-900 shadow-sm' : 'bg-gray-100 text-gray-300'}`}>
                  {active ? '🔗' : '○'}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { icon: '🔥', value: currentStreak.toString(), label: 'Day streak', color: 'text-orange-500' },
              { icon: '📚', value: '0', label: 'Words learned', color: 'text-blue-500' },
              { icon: '⏱', value: '0', label: 'Minutes today', color: 'text-purple-500' },
              { icon: '⚡', value: '0', label: 'XP earned', color: 'text-yellow-500' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-2xl mb-3">{stat.icon}</p>
                <p className="text-3xl font-bold text-[#111111] mb-1">{stat.value}</p>
                <p className={`text-xs font-medium ${stat.color}`}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-purple-900">🤖</div>
                  <h3 className="text-[#111111] font-bold text-sm">AI Tutor</h3>
                </div>
                <button onClick={() => router.push('/tutor')} className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-purple-600">
                  Start Conversation →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-[#111111] font-bold text-sm mb-4">Level Progress</h3>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                <div className="h-2 rounded-full bg-green-500" style={{width: '5%'}} />
              </div>
              <p className="text-[#111111] text-sm font-semibold">{profile?.current_level || 'A1'} Beginner</p>
            </div>
          </div>

          <div className="mb-6"><LanguageFitnessScore /></div>
          <div className="mb-6"><ForgettingCurve /></div>

        </div>
      </div>
    </div>
  )
}