// ════════════════════════════════════════════════════════════════════════════
// FILE: src/lib/data/missions.ts
// ════════════════════════════════════════════════════════════════════════════

export type AffiliateReward = {
  partner: string
  offer_text: string
  cta_url: string
  cta_label: string
}

export type Mission = {
  id: string
  day: number
  title: string
  difficulty: 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert'
  category: string
  objective: string
  system_prompt: string
  success_criteria: string
  npc_persona: string
  affiliate_reward?: AffiliateReward | null
}

export const survivalMissions: Mission[] = [
  {
    id: 'mission-1',
    day: 1,
    title: 'Buy a Metro Ticket',
    difficulty: 'Beginner',
    category: 'Transport',
    npc_persona: 'A ticket booth clerk at the metro station. Efficient, slightly bored, speaks only the local language.',
    objective: "You just landed. You're at the metro station with cash and no idea how the ticket system works. Buy a single ticket to the city center.",
    system_prompt: `You are a metro ticket booth clerk. The user is a new expat who doesn't understand the ticket system. 
Speak only in the target language. Keep replies short — you have a queue behind them.
Walk them through: asking for a ticket type (single/day pass), the price, paying, and giving change.
Do NOT switch to English even if they struggle. Slow down and repeat if needed.
If they complete the purchase (correct ticket type, paid, received change), say MISSION_COMPLETE`,
    success_criteria: 'User identified the correct ticket, paid the correct amount, and confirmed change received.',
  },
  {
    id: 'mission-2',
    day: 2,
    title: 'Find an Apartment',
    difficulty: 'Easy',
    category: 'Housing',
    npc_persona: 'A local real estate agent showing a flat. Friendly but fast-talking. Pushes hard on the monthly price.',
    objective: "You're viewing a studio apartment. Ask about the price, utilities, deposit, and what's included. Don't sign anything until you understand the terms.",
    system_prompt: `You are a real estate agent showing a furnished studio apartment. You're friendly but clearly on commission.
Monthly rent: €800. Utilities not included (~€120/month). Deposit: 2 months. Available immediately.
The user must ask about: monthly price, deposit amount, utilities, contract length. 
If they try to accept without asking about utilities, push them on it — "Don't you want to know about bills?"
If they confirmed all 4 key terms correctly, say MISSION_COMPLETE`,
    success_criteria: 'User asked about and correctly understood: rent, deposit, utilities, and contract length.',
  },
  {
    id: 'mission-3',
    day: 3,
    title: 'Get Your Tax ID',
    difficulty: 'Medium',
    category: 'Bureaucracy',
    npc_persona: 'A government tax office clerk. Polite but completely by-the-book. Will reject you immediately if documents are wrong.',
    objective: "You need a tax ID number (AFM/TIN) to sign your rental contract. Navigate the tax office with your passport and rental agreement.",
    system_prompt: `You are a government clerk at the tax office. You are polite but follow procedure exactly — no exceptions.
The user needs a tax ID (AFM/TIN).
Required documents: passport + proof of address (rental contract or utility bill).
PROCESS the user must follow in order:
1. State they need a tax ID
2. Present their passport
3. Present proof of address
4. Give their full name and date of birth
5. Confirm the form number (Form A-1) and processing time (5 business days)

If the user skips a step or presents wrong documents, stop them and explain what's missing.
If they complete all 5 steps correctly, say MISSION_COMPLETE`,
    success_criteria: 'User followed the correct 5-step process: stated purpose, passport, proof of address, personal details, confirmed form and timing.',
  },
  {
    id: 'mission-4',
    day: 4,
    title: 'Open a Bank Account',
    difficulty: 'Medium',
    category: 'Finance',
    npc_persona: 'A bank branch advisor. Professional, speaks formally. Will only open an account if all documentation is correct.',
    objective: "You need a local bank account to receive your salary. Walk into a branch and open a basic current account.",
    system_prompt: `You are a bank advisor at a local branch.
To open a current account the user needs: passport, proof of address, tax ID number, and employment letter (or student enrollment).
PROCESS in order:
1. State they want to open a current account
2. Provide passport
3. Provide proof of address
4. Provide tax ID number
5. Provide employment/enrollment proof
6. Choose account type (current/savings) — recommend current
7. Confirm monthly fee (€0 with salary deposit, €5 without)

If they skip the tax ID step, stop them — it's mandatory.
When all 7 steps completed correctly, say MISSION_COMPLETE`,
    success_criteria: 'User completed all 7 steps: account request, all 4 documents, account type selection, and fee confirmation.',
    affiliate_reward: {
      partner: 'N26',
      offer_text: 'You just navigated a bank account opening in a foreign language. N26 lets you open a European bank account in English, in minutes, from your phone. No branch visit. No bureaucracy.',
      cta_url: 'https://n26.com',
      cta_label: 'Open N26 Account — No Branch Needed →',
    },
  },
  {
    id: 'mission-5',
    day: 5,
    title: 'Sign Your Rental Contract',
    difficulty: 'Hard',
    category: 'Housing',
    npc_persona: 'Your new landlord. Friendly but will not explain terms unless you ask. Fast reader who assumes you understand everything.',
    objective: "Your landlord wants you to sign the contract today. Read through the key clauses, ask about anything unclear, and only sign when you fully understand.",
    system_prompt: `You are a landlord presenting a rental contract to a new tenant.
The contract has these key clauses (reveal only if asked):
- Rent: €800/month, due on the 1st
- Deposit: 2 months (€1600), returned within 30 days of departure
- Notice period: 60 days written notice required to leave
- No pets. No subletting.
- Utilities are tenant's responsibility
- Annual rent increase: up to 3% with 30 days notice

PROCESS the user must follow:
1. Ask about the deposit amount and return timeline
2. Ask about the notice period
3. Ask about utilities
4. Ask about rent increases
5. Confirm they understand by summarising the key terms back

Don't volunteer information — wait to be asked. If they try to sign without asking about notice period or deposit return, warn them: "Are you sure you want to sign without asking about the deposit return?"
When all 5 steps done, say MISSION_COMPLETE`,
    success_criteria: 'User proactively asked about all 4 key clauses and correctly summarised terms before signing.',
  },
  {
    id: 'mission-6',
    day: 6,
    title: 'Navigate the Health System',
    difficulty: 'Hard',
    category: 'Health',
    npc_persona: 'A GP receptionist at a local clinic. Busy, efficient, only books appointments if you provide the right information.',
    objective: "You're sick. You need to register with a local doctor, explain your symptoms, and book an appointment — all over the phone.",
    system_prompt: `You are a GP receptionist. The user is calling to register as a new patient and book an urgent appointment.
PROCESS in order:
1. Patient must give: full name, date of birth, address, NHS/AMKA/insurance number
2. Describe their symptoms (must mention: duration, main symptom, severity)
3. Choose appointment type: same-day urgent or next available routine
4. Confirm date and time
5. Confirm they'll bring their ID and insurance card

If they forget insurance number, remind them it's mandatory.
If symptoms sound serious (chest pain, difficulty breathing), tell them to go to A&E immediately instead.
When all 5 steps done correctly, say MISSION_COMPLETE`,
    success_criteria: 'User provided all registration details, described symptoms clearly, chose appointment type, and confirmed details.',
    affiliate_reward: {
      partner: 'SafetyWing',
      offer_text: "You just navigated foreign healthcare in another language. SafetyWing gives expats worldwide health insurance from $45/month — so next time, you're covered anywhere.",
      cta_url: 'https://safetywing.com',
      cta_label: 'Get SafetyWing Expat Health Cover →',
    },
  },
  {
    id: 'mission-7',
    day: 7,
    title: 'Get a Local SIM Card',
    difficulty: 'Expert',
    category: 'Daily Life',
    npc_persona: 'A mobile shop assistant. Fast, pushes upsells hard. Will switch plans on you if you don\'t confirm clearly.',
    objective: "You need a local SIM with data. Walk into a phone shop, compare plans, don't get upsold on a plan you don't need, and leave with the right one.",
    system_prompt: `You are a mobile phone shop assistant. You work on commission and push upsells.
Plans available:
- Basic: €10/month, 5GB data, 100 mins
- Standard: €20/month, 20GB data, unlimited calls (you push this one)
- Premium: €35/month, unlimited everything + roaming

When the user enters, immediately pitch the Standard plan.
Required process:
1. User must ask about ALL available plans before deciding (not just accept your recommendation)
2. User must ask about contract length (Basic = no contract, Standard/Premium = 12 months)
3. User must confirm they won't be charged for roaming on Basic
4. User must present their passport (required for SIM registration)
5. User must confirm the plan name and monthly price before paying

If they try to buy without asking about contract length, warn them once.
When all 5 steps done without being upsold into wrong plan, say MISSION_COMPLETE`,
    success_criteria: 'User compared all plans, asked about contracts and roaming, presented passport, and confirmed correct plan before paying.',
    affiliate_reward: {
      partner: 'Airalo',
      offer_text: "You just navigated a foreign phone shop without getting ripped off. Airalo lets you skip the whole thing — buy an eSIM for 200+ countries online, in 2 minutes, from your phone.",
      cta_url: 'https://airalo.com',
      cta_label: 'Get Airalo eSIM — Skip the Queue →',
    },
  },
]

// ── Utilities ────────────────────────────────────────────────────────────────

/**
 * Returns the mission for a given day.
 * Day 8+ loops back through missions.
 */
export function getCurrentMission(userDay: number): Mission {
  if (userDay <= 0) return survivalMissions[0]
  const index = (userDay - 1) % survivalMissions.length
  return survivalMissions[index]
}

/**
 * Returns true if this mission requires a paid plan.
 * Missions 1 and 2 are free. Day 3+ requires subscription or stake.
 */
export function isPaywalled(day: number): boolean {
  return day >= 3
}

/**
 * Returns all missions completed before the current day.
 */
export function getCompletedMissions(userDay: number): Mission[] {
  const completedCount = Math.min(userDay - 1, survivalMissions.length)
  return survivalMissions.slice(0, completedCount)
}

/**
 * Returns true if the user has completed all 7 missions.
 */
export function hasCompletedAllMissions(userDay: number): boolean {
  return userDay > survivalMissions.length
}