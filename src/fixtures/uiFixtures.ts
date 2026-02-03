// src/mocks/uiFixtures.ts - UI fixture examples for demos

export const microcopySuggestions = [
  { id: "m1", location: "hero", text: "Get the gear pros trust — fast shipping, no fuss." },
  { id: "m2", location: "productCard", text: "See it in 3D — quick look" },
  { id: "m3", location: "checkout", text: "Secure Checkout — 30-day returns" },
  { id: "m4", location: "cta", text: "Start Winning Today" },
  { id: "m5", location: "empty", text: "No matches yet — let's change that" },
];

export const heroVariants = [
  { id: "h1", title: "Performance gear for creators", subtitle: "Designed for speed, built for comfort" },
  { id: "h2", title: "Tools that work like magic", subtitle: "Built for pros who want results" },
  { id: "h3", title: "Level up your game", subtitle: "AI-powered insights for competitive edge" },
  { id: "h4", title: "Win more. Learn faster.", subtitle: "Your personal esports analyst" },
];

export const ctaVariants = [
  { id: "c1", primary: "Get Started Free", secondary: "Watch Demo" },
  { id: "c2", primary: "Start Analyzing", secondary: "See Examples" },
  { id: "c3", primary: "Try Now", secondary: "Learn More" },
  { id: "c4", primary: "Begin Free Trial", secondary: "View Pricing" },
];

export const errorMessages = {
  network: "Connection lost. Retrying in 5 seconds...",
  timeout: "Request timed out. Please try again.",
  rateLimit: "Too many requests. Please wait a moment.",
  auth: "Session expired. Please sign in again.",
  notFound: "Resource not found. It may have been moved or deleted.",
  generic: "Something went wrong. Our team has been notified.",
};

export const loadingStates = {
  initial: "Preparing your workspace...",
  connecting: "Connecting to AI agent...",
  streaming: "Generating response...",
  processing: "Processing your request...",
  analyzing: "Analyzing data patterns...",
  complete: "Analysis complete!",
};

export const accessibilityLabels = {
  streamStart: "Agent response streaming started",
  token: (t: string) => `Agent says: ${t}`,
  toolCall: (tool: string) => `Agent invoked tool ${tool}`,
  toolResult: (tool: string, summary: string) => `Tool ${tool} returned result: ${summary}`,
  done: "Agent finished generating the response",
  error: (msg: string) => `Error occurred: ${msg}`,
};

export const demoScenarios = [
  {
    id: "catalog-audit",
    name: "Catalog Audit",
    description: "Run analysis on product catalog to identify conversion improvements",
    steps: ["Select catalog analysis prompt", "Watch SSE stream analysis", "Review timeline and memory"],
  },
  {
    id: "tool-interaction",
    name: "Tool-driven Interaction",
    description: "Demonstrate tool calling with instant results",
    steps: ["Press Analyze Catalog in Toolbox", "View tool result message", "Reference result in follow-up"],
  },
  {
    id: "replay-mode",
    name: "Replay Mode",
    description: "Play back a recorded session without SSE",
    steps: ["Navigate to Session list", "Click Replay on session", "Watch playback with timing"],
  },
  {
    id: "team-analysis",
    name: "Team Performance Analysis",
    description: "Generate comprehensive team performance report",
    steps: ["Select performance review prompt", "View multi-tool execution", "Export generated report"],
  },
];

export const keyboardShortcuts = [
  { key: "⌘+Enter", action: "Submit prompt" },
  { key: "⌘+K", action: "Open command palette" },
  { key: "⌘+/", action: "Toggle sidebar" },
  { key: "Esc", action: "Cancel current operation" },
  { key: "⌘+Shift+R", action: "Replay last session" },
  { key: "⌘+S", action: "Save to memory" },
];
