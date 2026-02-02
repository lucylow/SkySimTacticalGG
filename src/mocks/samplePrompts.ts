// src/mocks/samplePrompts.ts - Curated prompts for demo scenarios

export type SamplePrompt = {
  id: string;
  label: string;
  category: "analysis" | "strategy" | "content" | "comparison" | "report";
  prompt: string;
  expectedTools?: string[];
};

export const samplePrompts: SamplePrompt[] = [
  {
    id: "p1",
    label: "Catalog Analysis",
    category: "analysis",
    prompt: "Analyze the product catalog. Provide top 3 categories by conversion, 3 tactical frontend changes to increase CTR, and a sample hero microcopy. Include expected uplift percentages.",
    expectedTools: ["analyze_catalog", "calculate_metrics"],
  },
  {
    id: "p2",
    label: "Scouting Report (VAL)",
    category: "strategy",
    prompt: "Generate a concise scouting report for 'Team Opp' using last 10 games: common site defaults, player tendencies, and top 2 exploitable patterns.",
    expectedTools: ["search_database", "analyze_patterns"],
  },
  {
    id: "p3",
    label: "Draft Assistant (LoL)",
    category: "strategy",
    prompt: "Given the opponent's champion pool (Aatrox, Orianna, Viego) recommend two bans and three picks that maximize synergy with an Ashe ADC and Braum support.",
    expectedTools: ["search_database", "compare_players"],
  },
  {
    id: "p4",
    label: "Microcopy Rewrite",
    category: "content",
    prompt: "Rewrite product page microcopy for mobile users to be concise and conversion-optimized. Keep CTAs to 3 words maximum.",
    expectedTools: ["analyze_catalog"],
  },
  {
    id: "p5",
    label: "User Persona",
    category: "analysis",
    prompt: "Synthesize a user persona from purchase history focused on audio equipment: include goals, frustrations, top 3 features they care about, and an empathy quote.",
    expectedTools: ["search_database", "analyze_patterns"],
  },
  {
    id: "p6",
    label: "Performance Review",
    category: "report",
    prompt: "Create a weekly performance review for the team. Include win rates, individual KD trends, and areas needing improvement with specific drill recommendations.",
    expectedTools: ["calculate_metrics", "generate_report", "compare_players"],
  },
  {
    id: "p7",
    label: "Match Prediction",
    category: "analysis",
    prompt: "Based on historical data, predict the outcome of our next match against Team Rival. Include confidence levels and key factors that could swing the result.",
    expectedTools: ["search_database", "analyze_patterns", "calculate_metrics"],
  },
  {
    id: "p8",
    label: "Training Plan",
    category: "strategy",
    prompt: "Design a 2-week training plan focusing on our weakest areas. Include daily schedules, specific drills, and measurable goals for each player.",
    expectedTools: ["analyze_patterns", "generate_report"],
  },
  {
    id: "p9",
    label: "Player Comparison",
    category: "comparison",
    prompt: "Compare our top 3 players across all major metrics. Identify synergies and potential roster optimizations for different map pools.",
    expectedTools: ["compare_players", "analyze_patterns"],
  },
  {
    id: "p10",
    label: "Economy Analysis",
    category: "analysis",
    prompt: "Analyze our in-game economy decisions over the last 20 rounds. Identify patterns in buy rounds, eco efficiency, and suggest optimal save thresholds.",
    expectedTools: ["search_database", "calculate_metrics"],
  },
];

export const getPromptsByCategory = (category: SamplePrompt["category"]) => 
  samplePrompts.filter(p => p.category === category);

export const getRandomPrompt = () => 
  samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
