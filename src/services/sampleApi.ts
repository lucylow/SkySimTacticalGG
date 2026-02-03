// src/services/SampleApi.ts
import axios from 'axios';
import type { ValorantMatch, LolMatch } from '../types/Sample';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function fetchValorantMatches(): Promise<{ id: string; title: string; map: string; startedAt: number }[]> {
  const r = await axios.get(`${API}/api/valorant/matches`);
  return r.data;
}

export async function fetchValorantMatch(matchId: string): Promise<ValorantMatch> {
  const r = await axios.get(`${API}/api/valorant/match/${matchId}`);
  return r.data;
}

export async function fetchValorantReplayInfo(matchId: string) {
  const r = await axios.get(`${API}/api/valorant/match/${matchId}/replay`);
  return r.data;
}

export function valorantReplayStreamUrl(matchId: string, speed = 1.0) {
  return `${API}/replay/valorant/${matchId}/stream?speed=${speed}`;
}

/* League */

export async function fetchLolMatches(): Promise<{ id: string; title: string }[]> {
  const r = await axios.get(`${API}/api/lol/matches`);
  return r.data;
}

export async function fetchLolMatch(matchId: string): Promise<LolMatch> {
  const r = await axios.get(`${API}/api/lol/match/${matchId}`);
  return r.data;
}

export function lolReplayStreamUrl(matchId: string, speed = 1.0) {
  return `${API}/replay/lol/${matchId}/stream?speed=${speed}`;
}

