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

      if (!profileData || !profileData.onboarding_complete) {
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

  const targetLang = profile?.target_language
    ? profile.target_language.charAt(0).toUpperCase() + profile.target_language.slice(1)
    : 'Language'

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
                  <span className="ml-2 bg-green-900 text-green-300 text-xs px-2 py-0.5 rounded-full">+50 XP</span>
                </div>
                <h2 className="text-white text-3xl font-bold mb-3 leading-tight">
                  Order a coffee<br />in {targetLang} ☕
                </h2>
                <p className="text-green-200 text-sm leading-relaxed mb-6 max-w-md opacity-70">
                  Practice real café conversation using present simple and polite phrases in {targetLang}.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push('/emergency')}
                    className="px-6 py-3 rounded-2xl bg-green-400 text-green-950 font-bold text-sm hover:bg-green-300 transition-colors"
                  >
                    Start Mission →
                  </button>
                  <span className="text-green-400 text-xs opacity-60">Estimated 5 minutes</span>
                </div>
              </div>
              <div className="shrink-0 text-7xl select-none">☕</div>
            </div>
          </div>

          {/* The Chain */}
          <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[#111111] font-bold">The Chain</h3>
                <p className="text-gray-400 text-xs mt-0.5">Don't break it — every day counts</p>
              </div>
              <div className="text-right">
                <p className="text-[#111111] font-bold text-lg">{currentStreak} days</p>
                <p className="text-gray-400 text-xs">Best: {longestStreak} days</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {chainLinks.map((active, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    active ? 'bg-yellow-400 text-yellow-900 shadow-sm' : 'bg-gray-100 text-gray-300'
                  }`}
                >
                  {active ? '🔗' : '○'}
                </div>
              ))}
            </div>
            {currentStreak === 0 && (
              <p className="text-gray-400 text-xs mt-3">Complete your first session to start your chain</p>
            )}
          </div>

          {/* Stats Row */}
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

          {/* Two Column Row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-full opacity-50 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                    style={{background: 'linear-gradient(135deg, #4c1d95, #7c3aed)'}}>
                    🤖
                  </div>
                  <div>
                    <h3 className="text-[#111111] font-bold text-sm">AI Tutor</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      <p className="text-gray-400 text-xs">Online now</p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                  Your personal coach adapts to your level and goals in real time.
                </p>
                <button
                  onClick={() => router.push('/tutor')}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                  style={{background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)'}}>
                  Start Conversation →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[#111111] font-bold text-sm">Level Progress</h3>
                <span className="text-gray-400 text-xs">{profile?.current_level || 'A1'} → next</span>
              </div>
              <p className="text-gray-400 text-xs mb-4">5 / 100 XP to next level</p>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                <div className="h-2 rounded-full" style={{width: '5%', background: 'linear-gradient(90deg, #059669, #34d399)'}} />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-green-700 font-bold text-sm">{profile?.current_level || 'A1'}</span>
                </div>
                <div>
                  <p className="text-[#111111] text-sm font-semibold">
                    {profile?.current_level === 'A1' ? 'Beginner' :
                     profile?.current_level === 'A2' ? 'Elementary' :
                     profile?.current_level === 'B1' ? 'Intermediate' :
                     profile?.current_level === 'B2' ? 'Upper Intermediate' :
                     profile?.current_level === 'C1' ? 'Advanced' : 'Mastery'}
                  </p>
                  <p className="text-gray-400 text-xs">Current level</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Bests */}
          <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#111111] font-bold">Personal Bests</h3>
              <span className="text-gray-400 text-xs">Your all-time records</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: '⏱', label: 'Longest session', value: `${personalBests?.longest_session || 0} min` },
                { icon: '💬', label: 'Most words produced', value: personalBests?.most_words_produced || 0 },
                { icon: '🎯', label: 'Highest accuracy', value: `${personalBests?.highest_accuracy || 0}%` },
                { icon: '⚡', label: 'Most XP in one session', value: personalBests?.most_xp_single_session || 0 },
              ].map((pb) => (
                <div key={pb.label} className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-2xl mb-2">{pb.icon}</p>
                  <p className="text-[#111111] font-bold text-lg">{pb.value}</p>
                  <p className="text-gray-400 text-xs mt-1">{pb.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Language Fitness Score */}
          <div className="mb-6">
            <LanguageFitnessScore />
          </div>

          {/* Forgetting Curve */}
          <div className="mb-6">
            <ForgettingCurve />
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#111111] font-bold">Rewards</h3>
                <span className="text-green-600 text-xs cursor-pointer hover:text-green-500">View all →</span>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { icon: '☕', name: 'Μπρίκι Café', discount: '20% off', progress: '0/5 missions', locked: true },
                  { icon: '✈️', name: 'Aegean Airlines', discount: '10% off', progress: 'Reach B1', locked: true },
                ].map((reward) => (
                  <div key={reward.name} className={`flex items-center gap-4 p-3 rounded-2xl bg-gray-50 ${reward.locked ? 'opacity-50' : ''}`}>
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
                      {reward.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-[#111111] text-sm font-medium">{reward.name} — {reward.discount}</p>
                      <p className="text-gray-400 text-xs">{reward.progress}</p>
                    </div>
                    <div className="text-gray-300 text-sm">🔒</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111111] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">Passport</h3>
                <span className="text-blue-400 text-xs cursor-pointer">Share →</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {firstName[0]}
                </div>
                <div>
                  <p className="text-white text-xs font-medium">{firstName}</p>
                  <p className="text-gray-600 text-xs capitalize">{profile?.target_language} · {profile?.current_level}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Level', value: profile?.current_level || 'A1' },
                  { label: 'Sessions', value: '0' },
                  { label: 'Last active', value: 'Today' },
                  { label: 'Streak', value: `${currentStreak} days` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-[#1f1f1f]">
                    <span className="text-gray-600 text-xs">{item.label}</span>
                    <span className="text-white text-xs font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* First Conversation Guarantee */}
          <div className="mt-4 bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="text-[#111111] font-bold text-sm">First Conversation Guarantee</h3>
                  <p className="text-gray-400 text-xs">Real conversation within 7 days — guaranteed</p>
                </div>
              </div>
              <span className="text-yellow-500 text-xs font-medium">Day 0/7</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full w-0" style={{background: 'linear-gradient(90deg, #d97706, #fbbf24)'}} />
            </div>
          </div>

          {/* Commitment Card */}
          <div className="mt-4 bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤝</span>
                <div>
                  <h3 className="text-[#111111] font-bold text-sm">Monthly Commitment</h3>
                  <p className="text-gray-400 text-xs">Set your goal and stick to it</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/commitment')}
                className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-[#222222] transition-colors"
              >
                Set commitment →
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}