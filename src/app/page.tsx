export default function Home() {
  return (
    <main className="min-h-screen bg-[#1A1814] flex flex-col items-center justify-center px-6">
      
      {/* Logo */}
      {/* Logo */}
<div className="mb-8 flex flex-col items-center gap-4">
  <img 
    src="/logo.png" 
    alt="Glotto" 
    className="w-24 h-24 object-contain brightness-0 invert"
  />
  <h1 className="text-6xl font-bold text-white tracking-tight">
    Glotto
  </h1>
</div>

      {/* Headline */}
      <div className="text-center mb-6 max-w-2xl">
        <h2 className="ext-3xl font-bold text-white mb-4 text-center">
          The Language App That Pays You Back
        </h2>
        <p className="text-lg text-gray-400">
          Glotto combines AI-powered language learning with real-world rewards 
          and a verified Learning Passport. Learn at your own pace, earn café 
          discounts and travel deals, and build proof of fluency that employers 
          actually trust.
        </p>
      </div>

      {/* Waitlist Form */}
      <div className="w-full max-w-2xl mb-8">
        <iframe
          src="https://tally.so/embed/Pd6JV1"
          width="100%"
          height="400"
          frameBorder="0"
          className="rounded-lg"
        />
      </div>

      {/* Social Proof */}
      <p className="text-gray-500 text-sm">
        Built by a language learner in Athens. Launching 2026.
      </p>

    </main>
  )
}