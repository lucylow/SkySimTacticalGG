
import { ValorantPlayerAggregate, LolPlayerAggregate } from '../types/scouting';
import { scoreValorantPlayer, scoreLolPlayer } from './playerScoring';

export interface ScoutingReportSection {
  title: string;
  content: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence?: any;
}

export interface AiScoutingReport {
  player: {
    id: string;
    name: string;
    game: 'VALORANT' | 'LOL';
    primaryRole: string;
  };
  overallScore: number;
  sections: ScoutingReportSection[];
  summary: {
    strengths: string[];
    weaknesses: string[];
    recommendation: 'SIGN' | 'TRIAL' | 'PASS' | 'BENCH';
  };
}

export class AiScoutingReportGenerator {
  constructor(private playerData: any, private game: 'VALORANT' | 'LOL') {}

  generate(): AiScoutingReport {
    const score = this.game === 'VALORANT' 
      ? scoreValorantPlayer(this.playerData) 
      : scoreLolPlayer(this.playerData);

    return {
      player: {
        id: this.playerData.playerId,
        name: this.playerData.name,
        game: this.game,
        primaryRole: this.playerData.primaryRole,
      },
      overallScore: score,
      sections: this.game === 'VALORANT' ? this.generateValSections() : this.generateLolSections(),
      summary: {
        strengths: [],
        weaknesses: [],
        recommendation: score >= 92 ? 'SIGN' : score >= 85 ? 'TRIAL' : score >= 75 ? 'BENCH' : 'PASS',
      }
    };
  }

  private generateValSections(): ScoutingReportSection[] {
    const data = this.playerData as ValorantPlayerAggregate;
    const fkRate = data.firstKills / Math.max(1, data.rounds);
    return [
      {
        title: "Entry Fragging",
        priority: fkRate > 0.25 ? 'HIGH' : 'MEDIUM',
        content: fkRate > 0.3 ? "ELITE entry fragger." : "Solid entry threat.",
        evidence: { firstKillRate: fkRate }
      }
    ];
  }

  private generateLolSections(): ScoutingReportSection[] {
    const data = this.playerData as LolPlayerAggregate;
    return [
      {
        title: "Laning Phase",
        priority: data.avgCsAt10 > 75 ? 'HIGH' : 'MEDIUM',
        content: "Strong laning performance.",
        evidence: { cs10: data.avgCsAt10 }
      }
    ];
  }
}
