'use client'

import { useEffect, useState } from 'react'

export default function InstallButton() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // This listens for Chrome's secret signal that the app CAN be installed
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true) // Turns our button on
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    
    // Show the native browser install prompt
    deferredPrompt.prompt()
    
    // Wait for the user to click "Install" or "Cancel"
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User installed Glotto!')
      setIsInstallable(false) // Hide button after install
    }
    setDeferredPrompt(null)
  }

  // If the app is already installed, or Chrome says no, don't show the button
  if (!isInstallable) return null

  return (
    <button 
      onClick={handleInstallClick}
      className="ml-4 px-6 py-3 rounded-full font-bold bg-white text-black hover:bg-gray-200 transition"
    >
      Install App ⬇️
    </button>
  )
}