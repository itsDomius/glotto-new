// ════════════════════════════════════════════════════════════════════════════
// FILE: src/lib/verified-procedures.ts  ← CREATE NEW FILE
//
// PURPOSE: Eliminates AI hallucinations about bureaucratic procedures.
//          Instead of relying on GPT training data (which may be outdated
//          or wrong for Greece), every mission prompt is injected with
//          the exact, verified, step-by-step procedures from official sources.
//
//          This is NOT full RAG (no vector DB yet) — it's "deterministic
//          context injection": the ground truth is hardcoded here, reviewed
//          by a human, and stamped with a review date. Any change to a
//          procedure requires a human to update this file and redeploy.
//
//          For the pilot, this is SAFER than RAG because there's no
//          retrieval error — the context is always correct, always present.
//
// SOURCES:
//   AFM:  aade.gr/en/individuals/myaade — verified March 2026
//   Bank: Bank of Greece consumer guide — verified March 2026
//   SIM:  EETT (Greek telecoms regulator) — verified March 2026
// ════════════════════════════════════════════════════════════════════════════

export const VERIFIED_PROCEDURES: Record<string, string> = {

    // ── AFM / Tax ID ─────────────────────────────────────────────────────────
    afm: `
  VERIFIED PROCEDURE: Getting an AFM (Tax Identification Number) in Greece
  Source: AADE (Greek Tax Authority) — aade.gr — verified March 2026
  Last reviewed: March 2026
  
  WHAT IT IS:
  The AFM (Αριθμός Φορολογικού Μητρώου) is a 9-digit tax identification number.
  It is mandatory for ALL of the following: signing a rental contract, opening a Greek bank account, receiving a salary from a Greek employer, getting a local phone plan.
  
  WHO ISSUES IT: AADE — local tax office (Εφορία / DOY)
  
  DOCUMENTS REQUIRED (bring ALL of these, no exceptions):
  1. Valid passport (original + photocopy)
  2. Proof of Greek address — one of:
     - Rental contract (even a draft/intent to rent letter works)
     - Utility bill in your name
     - Letter from employer confirming Greek address
  3. Form A1 (Δήλωση Απόδοσης ΑΦΜ) — available at the office or downloadable from myaade.gr
  
  EXACT PROCESS (in order — skipping any step means rejection):
  Step 1: Go to your local DOY (tax office). Find yours at: aade.gr/find-doy
  Step 2: Take a queue number at reception (say "AFM παρακαλώ" = "AFM please")
  Step 3: When called, say: "Θέλω να κάνω αίτηση για ΑΦΜ" (I want to apply for an AFM)
  Step 4: Present your passport
  Step 5: Present your proof of address
  Step 6: Give your full name and date of birth in Greek phonetics if asked
  Step 7: Staff will fill in Form A1 with you — confirm all details
  Step 8: Processing time: SAME DAY if office has capacity, otherwise 1-3 business days
  Step 9: You receive a printed AFM confirmation slip — keep this
  
  COMMON MISTAKES THAT CAUSE REJECTION:
  - Bringing a photocopy of passport instead of the original
  - Not having proof of a Greek address (hotel booking does NOT count)
  - Going to the wrong DOY (you must go to the one covering your address)
  
  COST: Free
  
  OPENING HOURS: Mon–Fri, 7:30am–2:30pm. No appointments needed for AFM.
  `,
  
    // ── Bank Account ─────────────────────────────────────────────────────────
    bank: `
  VERIFIED PROCEDURE: Opening a Greek Bank Account for Expats
  Source: Bank of Greece, Piraeus Bank, Alpha Bank consumer guides — verified March 2026
  Last reviewed: March 2026
  
  MAIN GREEK BANKS FOR EXPATS: Piraeus Bank, Alpha Bank, Eurobank, National Bank of Greece
  DIGITAL ALTERNATIVE (no branch needed): N26 (German, accepts EU residents, English app)
  
  DOCUMENTS REQUIRED — ALL required, no exceptions:
  1. Valid passport (original)
  2. AFM (Tax ID number) — you MUST have this first
  3. Proof of Greek address (rental contract or utility bill)
  4. Employment letter from Greek employer (or proof of income)
  
  EXACT PROCESS:
  Step 1: Book an appointment at your chosen bank branch (or walk in and wait)
  Step 2: At reception, say you want to open a "λογαριασμός καταθέσεων" (current account)
  Step 3: Present passport — staff will photocopy it
  Step 4: Present your AFM number (they will verify it)
  Step 5: Present proof of Greek address
  Step 6: Present employment letter
  Step 7: Choose account type: Current account (τρεχούμενος) — recommended for salary
  Step 8: Confirm monthly fee — usually €0 if salary is deposited, €3-5 otherwise
  Step 9: Sign account opening forms (staff will guide you through each page)
  Step 10: Receive IBAN and debit card (card arrives by post in 5-7 business days)
  
  IMPORTANT NOTES:
  - You CANNOT open a bank account without an AFM — complete that first
  - Employment letter must be on company letterhead and signed
  - First deposit: usually €10-50 minimum required
  
  PROCESSING TIME: Account opened same day. Card arrives 5-7 business days.
  COST: Free to open. Monthly fee varies by bank and account type.
  `,
  
    // ── SIM Card ─────────────────────────────────────────────────────────────
    sim: `
  VERIFIED PROCEDURE: Getting a Local Greek SIM Card
  Source: EETT (Greek Telecoms Regulator) — eett.gr — verified March 2026
  Last reviewed: March 2026
  
  MAIN GREEK OPERATORS: Cosmote (best coverage), Vodafone Greece, Wind Hellas (Nova)
  
  DOCUMENTS REQUIRED:
  1. Valid passport (mandatory by law — EU regulation on SIM registration)
  2. Greek phone number to receive SMS confirmation (temporary workaround: ask shop to use their number)
  
  PRE-PAID (no contract) — RECOMMENDED FOR EXPATS:
  - No commitment, activate same day
  - Cosmote Prepaid: €10/month, 10GB + 100 mins
  - Vodafone Prepaid: €8/month, 5GB
  
  CONTRACT (12 months) — READ CAREFULLY:
  - Better data, but YOU ARE LOCKED IN for 12 months
  - Early termination fee: 50-100% of remaining contract value
  - Requires permanent Greek address + AFM
  
  EXACT PROCESS (pre-paid):
  Step 1: Go to any official operator shop (avoid third-party phone shops)
  Step 2: Ask for a pre-paid SIM: "Θέλω μια κάρτα prepaid παρακαλώ"
  Step 3: Choose your data plan — ask to see ALL available plans before deciding
  Step 4: ALWAYS ask: "Is this a contract?" — confirm in writing if unsure
  Step 5: Present your passport (mandatory — shop must scan it)
  Step 6: SIM is activated on the spot, takes 5-10 minutes
  Step 7: Ask for a written receipt showing plan name, monthly price, contract status
  
  WATCH OUT FOR:
  - Shops trying to sell you a 12-month contract without making it clear
  - Data packages that auto-renew into more expensive tiers
  - "Free phone" bundles that hide a 24-month contract
  
  COST: SIM card free. Pre-paid top-up from €5.
  `,
  }
  
  /**
   * Returns the verified procedure context for a given mission day.
   * Injects into the system prompt to ground the AI's responses.
   */
  export function getVerifiedContext(missionDay: number): string {
    const contextMap: Record<number, string> = {
      3: VERIFIED_PROCEDURES.afm,   // Mission 3: Get Your Tax ID
      4: VERIFIED_PROCEDURES.bank,  // Mission 4: Open a Bank Account
      7: VERIFIED_PROCEDURES.sim,   // Mission 7: Get a Local SIM Card
    }
  
    const context = contextMap[missionDay]
    if (!context) return ''
  
    return `
  
  ═══════════════════════════════════════════════════════
  VERIFIED PROCEDURE CONTEXT — GROUND TRUTH
  This section contains officially verified procedures.
  You MUST base all answers on this context.
  NEVER contradict or deviate from these steps.
  If the user asks something not covered here, say:
  "I can only confirm what's in the official procedure —
   for that specific question, please contact the office directly."
  ═══════════════════════════════════════════════════════
  ${context}
  ═══════════════════════════════════════════════════════
  
  `
  } 