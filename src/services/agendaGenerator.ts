// Macro Review Agenda Generator
// Generates structured review agendas for post-match analysis

import type { MatchMetadata, RoundData } from '@/types/backend';

// ============= Types =============

export interface MatchInfo {
  match_type: string;
  opponent: string;
  map: string;
  score: string;
  composition: string;
  duration: string;
  date: string;
}

export interface CoachingPoint {
  question: string;
  discussion_prompt: string;
}

export interface ReviewAgendaSection {
  section_title: string;
  priority: string;
  key_findings: string[];
  evidence: Array<{
    type: string;
    description: string;
    timestamp?: string;
    metric?: string;
    pattern?: string;
    our_team?: number;
    their_team?: number;
    differential?: number;
    rounds?: number[];
    impact?: string;
  }>;
  coaching_points: CoachingPoint[];
  recommended_actions: string[];
  time_allocation: string;
  visualization_available: boolean;
}

export interface ReviewAgenda {
  match_info: MatchInfo;
  executive_summary: string;
  review_agenda: ReviewAgendaSection[];
  quick_stats: {
    total_issues_identified: number;
    critical_issues: number;
    estimated_review_time: string;
    key_focus_areas: string[];
  };
  generated_at: string;
  agenda_version: string;
}

interface ReviewSection {
  title: string;
  priority: number;
  findings: string[];
  evidence: Array<{ type: string; description: string; timestamp?: string }>;
  coaching_questions: string[];
  recommended_drills: string[];
  visualization_hook?: string;
}

// ============= Agenda Generator =============

class AgendaGeneratorService {
  /**
   * Generate a comprehensive review agenda from match data
   */
  async generateReviewAgenda(
    match: MatchMetadata,
    rounds: RoundData[],
    teamId: string
  ): Promise<ReviewAgenda> {
    const sections: ReviewSection[] = [];

    // Analyze different aspects
    const pistolAnalysis = await this.analyzePistolRounds(rounds, teamId);
    if (pistolAnalysis) sections.push(pistolAnalysis);

    const economyAnalysis = await this.analyzeEconomyDecisions(rounds, teamId);
    if (economyAnalysis) sections.push(economyAnalysis);

    const positioningAnalysis = await this.analyzePositioning(rounds, teamId);
    if (positioningAnalysis) sections.push(positioningAnalysis);

    const utilityAnalysis = await this.analyzeUtilityUsage(rounds, teamId);
    if (utilityAnalysis) sections.push(utilityAnalysis);

    const mapControlAnalysis = await this.analyzeMapControlTrends(rounds, teamId);
    if (mapControlAnalysis) sections.push(mapControlAnalysis);

    const compositionAnalysis = await this.analyzeTeamComposition(match, rounds, teamId);
    if (compositionAnalysis) sections.push(compositionAnalysis);

    // Sort by priority
    sections.sort((a, b) => b.priority - a.priority);

    // Build final agenda
    return this.buildAgendaDocument(match, rounds, sections, teamId);
  }

  // ============= Analysis Methods =============

  private async analyzePistolRounds(
    rounds: RoundData[],
    teamId: string
  ): Promise<ReviewSection | null> {
    const pistolRounds = rounds.filter(
      (r) => r.round_number === 1 || r.round_number === 13
    );

    if (pistolRounds.length === 0) return null;

    const wins = pistolRounds.filter((r) => r.winning_team_id === teamId).length;
    const losses = pistolRounds.length - wins;

    if (losses === 0) return null;

    const findings: string[] = [];
    const evidence: Array<{ type: string; description: string; timestamp?: string }> = [];

    for (const round of pistolRounds) {
      if (round.winning_team_id !== teamId) {
        const reason = this.analyzePistolLoss(round);
        findings.push(`Round ${round.round_number}: ${reason}`);
        evidence.push({
          type: 'round_outcome',
          description: `Pistol round loss - ${reason}`,
          timestamp: round.round_number.toString(),
        });
      }
    }

    return {
      title: 'Pistol Round Performance',
      priority: losses > 1 ? 5 : 3,
      findings,
      evidence,
      coaching_questions: [
        'What was the buy strategy for each pistol?',
        'Did we win initial duels?',
        'How was utility usage coordinated?',
      ],
      recommended_drills: [
        'Pistol round utility timing drills',
        'Anti-eco hold practice',
      ],
      visualization_hook: 'pistol_round_replay',
    };
  }

  private async analyzeEconomyDecisions(
    rounds: RoundData[],
    teamId: string
  ): Promise<ReviewSection | null> {
    const economicIssues: string[] = [];
    const evidence: Array<{ type: string; description: string; timestamp?: string }> = [];

    for (let i = 1; i < rounds.length; i++) {
      const prevRound = rounds[i - 1];
      const currentRound = rounds[i];

      if (!prevRound || !currentRound) continue;

      const decision = this.classifyEconomicDecision(prevRound, currentRound, teamId);

      if (decision.type === 'force_buy' && !decision.success) {
        economicIssues.push(
          `Round ${currentRound.round_number}: Unsuccessful force buy after pistol loss`
        );
        evidence.push({
          type: 'economy',
          description: 'Force buy failed',
          timestamp: currentRound.round_number.toString(),
        });
      }
    }

    if (economicIssues.length === 0) return null;

    return {
      title: 'Economy Management',
      priority: economicIssues.length > 3 ? 4 : 2,
      findings: economicIssues,
      evidence,
      coaching_questions: [
        'Were force buys coordinated?',
        'Should we have saved instead?',
      ],
      recommended_drills: ['Economy decision tree review'],
      visualization_hook: 'economy_timeline',
    };
  }

  private async analyzePositioning(
    rounds: RoundData[],
    teamId: string
  ): Promise<ReviewSection | null> {
    const positioningIssues: string[] = [];
    const evidence: Array<{ type: string; description: string; timestamp?: string }> = [];

    for (const round of rounds) {
      if (round.winning_team_id !== teamId) {
        const phaseStats = round.round_phase_stats;
        if (phaseStats.first_contact_time && phaseStats.first_contact_time < 10) {
          positioningIssues.push(
            `Round ${round.round_number}: Early death in first ${phaseStats.first_contact_time}s`
          );
          evidence.push({
            type: 'positioning',
            description: 'Exposed position led to early death',
            timestamp: round.round_number.toString(),
          });
        }
      }
    }

    if (positioningIssues.length < 2) return null;

    return {
      title: 'Positioning Issues',
      priority: positioningIssues.length > 5 ? 5 : 3,
      findings: positioningIssues,
      evidence,
      coaching_questions: [
        'Are players using off-angles?',
        'Is positioning predictable?',
      ],
      recommended_drills: [
        'Off-angle positioning practice',
        'Jiggle peek timing drills',
      ],
      visualization_hook: 'position_heatmap',
    };
  }

  private async analyzeUtilityUsage(
    rounds: RoundData[],
    teamId: string
  ): Promise<ReviewSection | null> {
    const utilityIssues: string[] = [];
    const evidence: Array<{ type: string; description: string; timestamp?: string }> = [];

    for (const round of rounds) {
      if (round.winning_team_id !== teamId) {
        const phaseStats = round.round_phase_stats;
        if (phaseStats.utility_used_early && phaseStats.utility_used_early > 3) {
          utilityIssues.push(
            `Round ${round.round_number}: ${phaseStats.utility_used_early} utility used too early`
          );
          evidence.push({
            type: 'utility',
            description: 'Wasted utility before execute',
            timestamp: round.round_number.toString(),
          });
        }
      }
    }

    if (utilityIssues.length === 0) return null;

    return {
      title: 'Utility Timing',
      priority: utilityIssues.length > 4 ? 4 : 2,
      findings: utilityIssues,
      evidence,
      coaching_questions: [
        'Are smokes timed with entry?',
        'Is flash usage coordinated?',
      ],
      recommended_drills: ['Execute timing practice', 'Utility coordination drills'],
      visualization_hook: 'utility_timeline',
    };
  }

  private async analyzeMapControlTrends(
    _rounds: RoundData[],
    _teamId: string
  ): Promise<ReviewSection | null> {
    // Simplified analysis - in reality would analyze map control events
    return null;
  }

  private async analyzeTeamComposition(
    _match: MatchMetadata,
    _rounds: RoundData[],
    _teamId: string
  ): Promise<ReviewSection | null> {
    // Simplified analysis - in reality would analyze agent picks
    return null;
  }

  // ============= Build Agenda Document =============

  private buildAgendaDocument(
    match: MatchMetadata,
    rounds: RoundData[],
    sections: ReviewSection[],
    teamId: string
  ): ReviewAgenda {
    const ourTeamWins = rounds.filter((r) => r.winning_team_id === teamId).length;
    const theirTeamWins = rounds.length - ourTeamWins;
    const score = `${ourTeamWins}-${theirTeamWins}`;

    const matchInfo: MatchInfo = {
      match_type: 'BO1',
      opponent: match.team_b_id,
      map: match.map_name,
      score,
      composition: '1-3-1',
      duration: this.calculateMatchDuration(rounds),
      date: match.start_time,
    };

    const reviewAgenda: ReviewAgendaSection[] = sections.map((section) => ({
      section_title: section.title,
      priority: '🔥'.repeat(section.priority),
      key_findings: section.findings,
      evidence: section.evidence.slice(0, 2),
      coaching_points: section.coaching_questions.map((q) => ({
        question: q,
        discussion_prompt: this.generateDiscussionPrompt(q),
      })),
      recommended_actions: section.recommended_drills,
      time_allocation: `${section.priority * 5} minutes`,
      visualization_available: !!section.visualization_hook,
    }));

    const executiveSummary = this.generateExecutiveSummary(sections);

    return {
      match_info: matchInfo,
      executive_summary: executiveSummary,
      review_agenda: reviewAgenda,
      quick_stats: {
        total_issues_identified: sections.reduce((sum, s) => sum + s.findings.length, 0),
        critical_issues: sections.filter((s) => s.priority >= 4).length,
        estimated_review_time: `${sections.reduce((sum, s) => sum + s.priority * 5, 0)} minutes`,
        key_focus_areas: sections
          .filter((s) => s.priority >= 4)
          .slice(0, 3)
          .map((s) => s.title),
      },
      generated_at: new Date().toISOString(),
      agenda_version: '1.0',
    };
  }

  // ============= Helper Methods =============

  private analyzePistolLoss(_round: RoundData): string {
    return 'Economic disadvantage impact';
  }

  private classifyEconomicDecision(
    prevRound: RoundData,
    currentRound: RoundData,
    teamId: string
  ): { type: string; success?: boolean } {
    const prevWon = prevRound.winning_team_id === teamId;
    const currentWon = currentRound.winning_team_id === teamId;

    if (!prevWon && currentRound.round_type === 'force') {
      return { type: 'force_buy', success: currentWon };
    }

    return { type: 'normal' };
  }

  private calculateMatchDuration(rounds: RoundData[]): string {
    const totalSeconds = rounds.reduce((sum, r) => sum + r.duration_seconds, 0);
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes} minutes`;
  }

  private generateDiscussionPrompt(question: string): string {
    return `Discuss: ${question}`;
  }

  private generateExecutiveSummary(sections: ReviewSection[]): string {
    const criticalIssues = sections.filter((s) => s.priority >= 4);
    if (criticalIssues.length === 0) {
      return 'No critical issues identified. Focus on maintaining current performance levels.';
    }

    const issueNames = criticalIssues.map((s) => s.title).join(', ');
    return `Critical areas requiring attention: ${issueNames}. Review these sections first.`;
  }
}

export const agendaGenerator = new AgendaGeneratorService();
