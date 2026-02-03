export async function detectActiveGame(): Promise<'VALORANT' | 'LEAGUE'> {
  // TODO: replace with process detection or backend query. For now, random pick for demo.
  return Math.random() > 0.5 ? 'VALORANT' : 'LEAGUE';
}
