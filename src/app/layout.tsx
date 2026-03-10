// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/layout.tsx
// ════════════════════════════════════════════════════════════════════════════
import type { Metadata } from "next"
import "./globals.css"
import PanicButton from "@/components/PanicButton"

export const metadata: Metadata = {
  title: "Glotto — Relocation OS",
  description: "Survive your relocation. Master the bureaucracy.",
  manifest: "/manifest.json",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}

        {/* 🆘 Emergency Panic Button — visible on EVERY page */}
        <PanicButton />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}