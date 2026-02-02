// src/mocks/generator.ts - Deterministic mock data generator
import { faker } from "@faker-js/faker";
import seedrandom from "seedrandom";

const RNG_SEED = "demo-seed-2026";
const rng = seedrandom(RNG_SEED);
faker.seed(12345);

function randInt(min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  const item = arr[Math.floor(rng() * arr.length)];
  if (item === undefined) throw new Error('Array is empty');
  return item;
}

/* --- Types --- */
export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  rating: number;
  inStock: boolean;
  tags: string[];
  image: string;
  createdAt: string;
  metadata: { weight_g: number; warranty_years: number; hasFreeReturn: boolean };
  description: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "coach" | "analyst";
  avatar: string;
  preferences: { theme: "light" | "dark"; language: string; compactView: boolean };
  createdAt: string;
};

export type ConversationTurn = {
  id: string;
  role: "user" | "assistant" | "tool";
  text: string;
  meta?: Record<string, unknown>;
  createdAt: string;
};

export type AgentSession = {
  id: string;
  title: string;
  userId: string;
  prompt: string;
  messages: ConversationTurn[];
  timeline: { id: string; ts: string; title: string; detail?: string }[];
  memory: { id: string; text: string }[];
  createdAt: string;
  status: "complete" | "running" | "failed";
};

/* --- Generators --- */
const CATEGORIES = ["Electronics", "Home", "Gaming", "Accessories", "Outdoor", "Office", "Health", "Clothing"];
const TAGS = ["popular", "new", "sale", "limited", "eco", "fast-shipping", "editor-pick"];

let productCounter = 0;
function genId() {
  return `${Date.now().toString(36)}-${(++productCounter).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateProducts(count = 120): Product[] {
  const out: Product[] = [];
  for (let i = 0; i < count; i++) {
    const name = faker.commerce.productName();
    const price = parseFloat(faker.commerce.price({ min: 5, max: 1200, dec: 2 }));
    out.push({
      id: genId(),
      name,
      slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`,
      category: pick(CATEGORIES),
      price,
      rating: Math.round((1 + rng() * 4) * 10) / 10,
      inStock: rng() > 0.12,
      tags: Array.from(new Set([pick(TAGS), pick(TAGS)])),
      image: `https://picsum.photos/seed/${encodeURIComponent(name + i)}/600/400`,
      createdAt: new Date(Date.now() - randInt(0, 1000 * 60 * 60 * 24 * 90)).toISOString(),
      metadata: {
        weight_g: randInt(50, 3500),
        warranty_years: pick([0, 1, 2, 3]),
        hasFreeReturn: rng() > 0.3,
      },
      description: faker.commerce.productDescription(),
    });
  }
  return out;
}

const LANGS = ["en-US", "es-ES", "fr-FR", "zh-CN"];

export function generateUsers(count = 12): UserProfile[] {
  const out: UserProfile[] = [];
  const roles: UserProfile["role"][] = ["user", "admin", "coach", "analyst"];
  for (let i = 0; i < count; i++) {
    const name = faker.person.fullName();
    out.push({
      id: genId(),
      name,
      email: faker.internet.email({ firstName: name.split(" ")[0], lastName: name.split(" ")[1] || "" }).toLowerCase(),
      role: pick(roles),
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      preferences: {
        theme: pick(["dark", "light"]),
        language: pick(LANGS),
        compactView: rng() > 0.7,
      },
      createdAt: new Date(Date.now() - randInt(0, 1000 * 60 * 60 * 24 * 365)).toISOString(),
    });
  }
  return out;
}

function genAssistantResponse() {
  const replies = [
    "I analyzed the dataset and found key clusters of user behavior.",
    "Top performing categories are Electronics and Home — consider improving product images.",
    "I recommend adding a lightweight 'quick preview' feature to increase conversions.",
    `Based on the catalog, average price is $${(randInt(20, 500) + rng() * 40).toFixed(2)}.`,
  ];
  return pick(replies) + " " + faker.lorem.paragraph();
}

export function generateAgentSession(user: UserProfile, products: Product[], index = 0): AgentSession {
  const sessionId = genId();
  const samplePrompts = [
    "Please analyze the product catalog for conversion improvements.",
    "Make a scouting report for the opponent team using match logs.",
    "Draft an onboarding flow improvement and generate micro copy.",
    "Create a 3-step plan to increase retention given the catalog.",
  ];
  const prompt = pick(samplePrompts);
  const messages: ConversationTurn[] = [];

  messages.push({
    id: genId(),
    role: "user",
    text: prompt,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  });

  const warmup = [
    "Sure — I will run a quick analysis.",
    "Ingesting catalog and recent purchase telemetry.",
    `Found ${Math.min(products.length, randInt(3, 12))} candidate signals to investigate.`,
  ];
  warmup.forEach((t, i) => {
    messages.push({ id: genId(), role: "assistant", text: t, createdAt: new Date(Date.now() - 1000 * 60 * (11 - i)).toISOString() });
  });

  messages.push({
    id: genId(),
    role: "assistant",
    text: "Calling tool analyze_catalog(top=5).",
    meta: { tool: "analyze_catalog", args: { top: 5 } },
    createdAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
  });

  const topCats = ["Electronics", "Home", "Gaming"].slice(0, randInt(1, 3));
  messages.push({
    id: genId(),
    role: "tool",
    text: `analyze_catalog result: topCategories=${JSON.stringify(topCats)}, avgPrice=${(randInt(20, 350) + rng() * 10).toFixed(2)}`,
    meta: { result: { topCategories: topCats, avgPrice: parseFloat((randInt(20, 350) + rng() * 10).toFixed(2)) } },
    createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  });

  messages.push({
    id: genId(),
    role: "assistant",
    text: genAssistantResponse(),
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  });

  const timeline = [
    { id: genId(), ts: new Date(Date.now() - 1000 * 60 * 6).toISOString(), title: "Tool: analyze_catalog", detail: "Top categories found" },
    { id: genId(), ts: new Date().toISOString(), title: "Plan generated", detail: "3 step roadmap" },
  ];
  const memory = [
    { id: genId(), text: "User prefers minimalist UI with purple accent." },
    { id: genId(), text: `Top categories snapshot: ${topCats.join(", ")}` },
  ];

  return {
    id: sessionId,
    title: `Session ${index + 1} - ${prompt.slice(0, 40)}`,
    userId: user.id,
    prompt,
    messages,
    timeline,
    memory,
    createdAt: new Date().toISOString(),
    status: pick(["complete", "running"]),
  };
}

export function generateDemoPayload() {
  const products = generateProducts(200);
  const users = generateUsers(8);
  const sessions = users.slice(0, 5).map((u, i) => generateAgentSession(u, products, i));
  return { products, users, sessions, seed: RNG_SEED, generatedAt: new Date().toISOString() };
}

export const DEMO = generateDemoPayload();
