export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type GoalArchetype = 'travel' | 'job' | 'netflix' | 'connect' | 'move' | 'exam' | 'business' | 'study'

const MISSIONS: Record<CEFRLevel, Record<GoalArchetype, string[]>> = {
  A1: {
    travel: ['Order a coffee and ask for the bill', 'Ask where the bathroom is', 'Buy a train ticket'],
    job: ['Introduce yourself professionally', 'Say what you do for work'],
    netflix: ['Describe your favourite film in one sentence', 'Name 5 film genres'],
    connect: ['Introduce yourself at a party', 'Ask someone their name and where they are from'],
    move: ['Ask about the price of a flat', 'Say your address out loud'],
    exam: ['Describe your daily routine', 'Talk about your family'],
    business: ['Greet a client professionally', 'Introduce your company in one sentence'],
    study: ['Describe your field of study', 'Ask a classmate for help'],
  },
  A2: {
    travel: ['Check into a hotel and ask about breakfast', 'Ask for directions to the station'],
    job: ['Describe your job responsibilities', 'Talk about your work schedule'],
    netflix: ['Recommend a show to a friend', 'Describe a character you like'],
    connect: ['Talk about your hobbies', 'Make plans for the weekend'],
    move: ['Describe your ideal neighbourhood', 'Ask about local transport'],
    exam: ['Describe a recent trip', 'Talk about your plans for next year'],
    business: ['Schedule a meeting', 'Confirm an appointment by phone'],
    study: ['Ask about assignment deadlines', 'Discuss your study schedule'],
  },
  B1: {
    travel: ['Handle a complaint at a hotel', 'Negotiate a price at a market'],
    job: ['Explain why you want a job', 'Describe your biggest achievement at work'],
    netflix: ['Compare two films you have watched', 'Argue why a show is worth watching'],
    connect: ['Share your opinion on a current topic', 'Disagree with someone politely'],
    move: ['Discuss pros and cons of living abroad', 'Explain your reasons for moving'],
    exam: ['Argue both sides of a debate', 'Describe a problem and propose a solution'],
    business: ['Pitch a product idea', 'Handle a customer complaint professionally'],
    study: ['Present your research topic', 'Discuss a concept from your course'],
  },
  B2: {
    travel: ['Discuss the ethics of mass tourism', 'Describe a cultural misunderstanding you experienced'],
    job: ['Lead a short team meeting', 'Give constructive feedback to a colleague'],
    netflix: ['Analyse the cultural impact of a series', 'Review a film for a magazine'],
    connect: ['Debate a controversial topic', 'Mediate a disagreement between friends'],
    move: ['Negotiate a rental contract', 'Discuss cultural adaptation challenges'],
    exam: ['Construct a nuanced argument', 'Respond to challenging counter-arguments'],
    business: ['Lead a client presentation', 'Negotiate terms of a contract'],
    study: ['Defend your thesis methodology', 'Critique a research paper'],
  },
  C1: {
    travel: ['Explore cultural identity through travel', 'Discuss geopolitics of a region you visited'],
    job: ['Discuss AI impact on your industry', 'Debate remote work ethics'],
    netflix: ['Analyse symbolism in a film', 'Compare directors styles'],
    connect: ['Explore a philosophical question', 'Discuss a complex social issue with nuance'],
    move: ['Reflect on what home means to you', 'Discuss identity and belonging'],
    exam: ['Use sophisticated connectors naturally', 'Construct multi-layered arguments'],
    business: ['Discuss global economic trends', 'Debate ethical business practices'],
    study: ['Engage in academic debate', 'Discuss interdisciplinary connections in your field'],
  },
  C2: {
    travel: ['Write a travel essay in your head and deliver it', 'Discuss travel literature'],
    job: ['Coach someone else on career strategy', 'Debate the future of your profession'],
    netflix: ['Deconstruct narrative techniques in a series', 'Compare cultural representations across media'],
    connect: ['Explore irony and humor in conversation', 'Discuss abstract concepts of human connection'],
    move: ['Reflect on third culture identity', 'Discuss the sociology of migration'],
    exam: ['Deliver a flawless impromptu speech', 'Debate at native speaker level'],
    business: ['Discuss macroeconomic strategy', 'Analyse global market disruptions'],
    study: ['Present original research findings', 'Engage with cutting edge literature in your field'],
  },
}

export function getDailyMission(level: CEFRLevel, goal: GoalArchetype): string {
  const missions = MISSIONS[level]?.[goal] || MISSIONS[level]?.connect || MISSIONS['A1'].connect
  return missions[Math.floor(Math.random() * missions.length)]
}

export function getLevelName(level: CEFRLevel): string {
  const names: Record<CEFRLevel, string> = {
    A1: 'Complete Beginner',
    A2: 'Elementary',
    B1: 'Intermediate',
    B2: 'Upper Intermediate',
    C1: 'Advanced',
    C2: 'Mastery',
  }
  return names[level]
}