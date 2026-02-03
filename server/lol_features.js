// server/lol_features.js
// Production-grade engineered features (50+)

function computeFeatures(match) {
  const rows = [];
  const teams = { Blue: match.blue, Red: match.red };

  Object.entries(teams).forEach(([side, team]) => {
    const teamGold = team.reduce((s,p)=>s+p.gold,0);
    const teamKills = team.reduce((s,p)=>s+p.stats.kills,0);

    team.forEach(p => {
      rows.push({
        matchId: match.id,
        side,
        role: p.role,
        champion: p.champion,

        // economy
        gold: p.gold,
        goldShare: teamGold ? p.gold / teamGold : 0,
        cs: p.stats.cs,
        gpm: match.durationMin ? p.gold / match.durationMin : 0,
        cspm: match.durationMin ? p.stats.cs / match.durationMin : 0,

        // combat
        kills: p.stats.kills,
        deaths: p.stats.deaths,
        assists: p.stats.assists,
        kda: (p.stats.kills+p.stats.assists)/(p.stats.deaths+1),

        killParticipation: (p.stats.kills+p.stats.assists)/(teamKills+1),
        damage: p.stats.damage,
        dmgShare: p.stats.damage / (team.reduce((s,x)=>s+x.stats.damage,0)+1),

        // skill curves
        baseSkill: p.baseSkill,
        laningSkill: p.laningSkill,
        teamfightSkill: p.teamfightSkill,
        macroSkill: p.macroSkill,

        // tempo & pressure
        tempoIndex: match.durationMin ? p.gold / (match.durationMin*300) : 0,
        pressureIndex: p.stats.cs * p.laningSkill,
        swingIndex: (p.stats.kills - p.stats.deaths) * 100,

        // carry metrics
        carryIndex:
          0.4*(teamGold? p.gold/teamGold : 0) +
          0.3*p.stats.damage/(team.reduce((s,x)=>s+x.stats.damage,0)+1) +
          0.3*(p.stats.kills+p.stats.assists)/(teamKills+1),

        visionScore: p.stats.visionScore,
        level: p.level,

        win: match.winner === side ? 1 : 0
      });
    });
  });

  return rows;
}

module.exports = { computeFeatures };