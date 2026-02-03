
export const AGENT_SPECIFIC_COUNTERS: Record<string, string[]> = {
  'Jett': ['Cypher', 'Killjoy', 'Vyse'],
  'Omen': ['Raze', 'Jett', 'Sova'],
  'Sova': ['Killjoy', 'Cypher', 'Chamber'],
  'Killjoy': ['Raze', 'Neon', 'Yoru'],
};

export function suggestValorantCounters(enemyComp: string[]) {
  const counters: string[] = [];
  enemyComp.forEach(agent => {
    if (AGENT_SPECIFIC_COUNTERS[agent]) {
      counters.push(...AGENT_SPECIFIC_COUNTERS[agent]);
    }
  });
  return [...new Set(counters)];
}
