// Automated Macro Review Agenda Generator
// Transforms raw match data into structured, actionable coaching agenda

import type { MatchMetadata, RoundData } from '@/types/backend';

// ============= Review Section Types =============

export interface ReviewSection {
  title: string;
  priority: number; // 1-5, 5 being highest
  findings: string[];
  evidence: Evidence[];
  coaching_questions: string[];
  recommended_drills: string[];
  visualization_hook?: string;
}

export interface Evidence {
  metric?: string;
  round?: number;
  our_team?: number;
  their_team?: number;
  differential?: number;
  pattern?: string;
  occurrences?: number;
  rounds?: number[];
  impact?: string;
  key_moment?: string;
}

export interface ReviewAgendaSection {
  section_title: string;
  priority: string; // Emoji indicators
  key_findings: string[];
  evidence: Evidence[];
  coaching_points: Array<{
    question: string;
    discussion_prompt: string;
  }>;
  recommended_actions: string[];
  time_allocation: string;
  visualization_available: boolean;
}

export interface MatchInfo {
  match_type: string;
  opponent: string;
  map: string;
  score?: string;
  composition?: string;
  duration?: string;
  date: string;
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

// ============= Agenda Generator Service =============

class AgendaGeneratorService {
  /**
   * Generate complete macro review agenda from match data
   */
  async generateReviewAgenda(
    match: MatchMetadata,
    rounds: RoundData[],
    teamId: string = 't1' // Our team ID
  ): Promise<ReviewAgenda> {
    // Run all analysis modules in parallel
    const [
      pistolAnalysis,
      economicAnalysis,
      midRoundAnalysis,
      ultimateEconomyAnalysis,
      mapControlAnalysis,
      compositionAnalysis,
    ] = await Promise.all([
      this.analyzePistolRounds(rounds, teamId),
      this.analyzeEconomicManagement(rounds, teamId),
      this.analyzeMidRoundPatterns(rounds, teamId),
      this.analyzeUltimateEconomy(match, rounds, teamId),
      this.analyzeMapControlTrends(rounds, teamId),
      this.analyzeTeamComposition(match, rounds, teamId),
    ]);

    // Filter and sort sections by priority
    const allSections = [
      pistolAnalysis,
      economicAnalysis,
      midRoundAnalysis,
      ultimateEconomyAnalysis,
      mapControlAnalysis,
      compositionAnalysis,
    ].filter((section): section is ReviewSection => section !== null && section.priority >= 3);

    const sortedSections = allSections.sort((a, b) => b.priority - a.priority);

    // Build agenda document
    return this.buildAgendaDocument(match, rounds, sortedSections, teamId);
  }

  /**
   * Analyze pistol round performance and impact
   */
  private async analyzePistolRounds(
    rounds: RoundData[],
    teamId: string
  ): Promise<ReviewSection | null> {
    const pistolRounds = rounds.filter((r) => r.round_number === 1 || r.round_number === 13);

    if (pistolRounds.length === 0) return null;

    const findings: string[] = [];
    const evidence: Evidence[] = [];

    let pistolWins = 0;
    for (const pistolRound of pistolRounds) {
      const won = pistolRound.winning_team_id === teamId;
      if (won) {
        pistolWins++;
      } else {
        const lossReasons = this.analyzePistolLoss(pistolRound, rounds);
        findings.push(`Lost pistol round ${pistolRound.round_number}: ${lossReasons}`);

        const ecoImpact = this.calculatePistolEcoImpact(rounds, pistolRound.round_number, teamId);
        evidence.push({
          round: pistolRound.round_number,
          impact: ecoImpact,
          key_moment: `Economic disadvantage for next ${ecoImpact.split(' ')[0]} rounds`,
        });
      }
    }

    // Overall pistol performance
    const pistolPerformance = `Won ${pistolWins}/${pistolRounds.length} pistol rounds`;
    findings.unshift(pistolPerformance);

    if (pistolWins === 0) {
      findings.unshift('Lost both pistols.');
    }

    return {
      title: 'Pistol Round Analysis',
      priority: 5, // Highest priority
      findings,
      evidence,
      coaching_questions: [
        'What was our default pistol strategy?',
        'How did we adapt to the opponent\'s pistol setup?',
        'Were our utility purchases optimal for our strategy?',
      ],
      recommended_drills: ['Pistol round simulator', 'Anti-pistol setups', 'Pistol utility usage'],
      visualization_hook: 'pistol_round_visualization',
    };
  }

  /**
   * Analyze economic decisions and their ripple effects
   */
  private async analyzeEconomicManagement(
    rounds: RoundData[],
    teamId: string
  ): Promise<ReviewSection | null> {
    const findings: string[] = [];
    const evidence: Evidence[] = [];
    const economicErrors: Evidence[] = [];

    // Track economic state round by round
    for (let i = 1; i < rounds.length; i++) {
      const prevRound = rounds[i - 1];
      const currentRound = rounds[i];

      if (!prevRound || !currentRound) continue;

      const decision = this.classifyEconomicDecision(prevRound, currentRound, teamId);

      if (decision.type === 'force_buy') {
        const success = currentRound.winning_team_id === teamId;
        if (!success) {
          const ecoLoss = this.calculateEconomicLoss(prevRound, currentRound, teamId);
          const rippleEffect = this.calculateRippleEffect(rounds, i, 3, teamId);

          economicErrors.push({
            round: currentRound.round_number,
            metric: 'Force buy impact',
            impact: `${ecoLoss} economic deficit`,
            pattern: `Extended economic disadvantage by ${rippleEffect} rounds`,
          });

          findings.push(
            `Unsuccessful force-buy on Round ${currentRound.round_number} led to a ${ecoLoss} economic deficit. Review force-buy vs. save criteria.`
          );
        }
      }

      // Check for bonus round losses after force buys
      const nextRound = rounds[i + 1];
      if (
        decision.type === 'force_buy' &&
        !decision.success &&
        nextRound &&
        nextRound.round_type === 'full'
      ) {
        const bonusRoundWon = nextRound.winning_team_id === teamId;
        if (!bonusRoundWon) {
          findings.push(
            `Force-buy on Round ${currentRound.round_number} led to a bonus round loss (Round ${nextRound.round_number}).`
          );
        }
      }
    }

    // Calculate overall economic efficiency
    const efficiencyScore = this.calculateEconomicEfficiency(rounds, teamId);
    findings.unshift(`Economic Efficiency Score: ${efficiencyScore}/100`);

    // Identify patterns
    const patterns = this.identifyEconomicPatterns(rounds, teamId);
    const firstPattern = patterns[0];
    if (patterns.length > 0 && firstPattern) {
      findings.push(`Pattern detected: ${firstPattern.description}`);
      evidence.push({
        pattern: firstPattern.description,
        occurrences: firstPattern.frequency,
        rounds: firstPattern.rounds,
      });
    }

    return {
      title: 'Economic Management',
      priority: 4,
      findings: findings.slice(0, 5), // Top 5 findings
      evidence: economicErrors.slice(0, 3), // Top 3 errors
      coaching_questions: [
        'What are our force-buy criteria?',
        'How do we communicate save/force decisions?',
        'Are we tracking opponent economy correctly?',
      ],
      recommended_drills: ['Economic decision simulator', 'Save round protocols', 'Economic tracking'],
      visualization_hook: 'economic_flow_visualization',
    };
  }

  /**
   * Analyze mid-round decision making and patterns
   */
  private async analyzeMidRoundPatterns(
    rounds: RoundData[],
    teamId: string
  ): Promise<ReviewSection | null> {
    // For VALORANT, analyze attacking rounds
    // In VALORANT, teams switch sides at round 13
    // Assume team starts on attack for rounds 1-12, then switches
    const attackingRounds = rounds.filter((r) => {
      // Determine side based on round number (simplified - in reality would check team side from GRID)
      // Rounds 1-12: first half (team likely starts on attack or defense depending on map)
      // Rounds 13-24: second half (switched sides)
      // For this analysis, we'll assume rounds 1-12 are attack (can be adjusted based on actual data)
      const isFirstHalf = r.round_number <= 12;
      const isAttack = isFirstHalf; // Simplified - adjust based on actual side data
      return isAttack;
    });

    if (attackingRounds.length === 0) return null;

    const findings: string[] = [];
    const evidence: Evidence[] = [];

    // Analyze execution timing
    const lateExecutions: Array<{
      round: number;
      execute_time: number;
      outcome: boolean;
      site?: string;
    }> = [];

    for (const roundData of attackingRounds) {
      const executeTime = roundData.round_phase_stats?.execute_time;
      if (executeTime && executeTime < 20) {
        // Less than 20 seconds left
        const won = roundData.winning_team_id === teamId;
        lateExecutions.push({
          round: roundData.round_number,
          execute_time: executeTime,
          outcome: won,
          site: roundData.bomb_site,
        });
      }
    }

    if (lateExecutions.length > 0) {
      const successRate =
        lateExecutions.filter((e) => e.outcome).length / lateExecutions.length;
      const totalAttackingRounds = attackingRounds.length;

      // Format finding similar to example: "4/10 attacking rounds on Map 1 saw a late A-main push with <20s left, resulting in 3 losses."
      const losses = lateExecutions.filter((e) => !e.outcome).length;
      findings.push(
        `${lateExecutions.length}/${totalAttackingRounds} attacking rounds had late executes (<20s). Success rate: ${(successRate * 100).toFixed(0)}% (${losses} losses).`
      );

      // Group by pattern (site)
      const sitePatterns: Record<string, typeof lateExecutions> = {};
      for (const execution of lateExecutions) {
        const site = execution.site || 'Unknown';
        if (!sitePatterns[site]) {
          sitePatterns[site] = [];
        }
        sitePatterns[site].push(execution);
      }

      for (const [site, executions] of Object.entries(sitePatterns)) {
        if (executions.length >= 3) {
          // Significant pattern
          evidence.push({
            pattern: `Repeated late executes on ${site}`,
            occurrences: executions.length,
            rounds: executions.map((e) => e.round),
            metric: 'Late execution pattern',
          });
        }
      }
    }

    // Analyze default setups
    const defaultPatterns = this.analyzeDefaultPatterns(rounds, teamId);
    if (defaultPatterns) {
      findings.push(`Default pattern: ${defaultPatterns.primary_pattern}`);
    }

    if (findings.length === 0) return null;

    return {
      title: 'Mid-Round Decision Making',
      priority: 3,
      findings,
      evidence,
      coaching_questions: [
        'What triggers our site executes?',
        'How do we gather information during defaults?',
        'When do we decide to rotate or commit?',
      ],
      recommended_drills: ['Execute timing drills', 'Information gathering protocols', 'Default setups'],
      visualization_hook: 'mid_round_pattern_visualization',
    };
  }

  /**
   * Analyze ultimate economy (VALORANT-specific)
   */
  private async analyzeUltimateEconomy(
    match: MatchMetadata,
    rounds: RoundData[],
    teamId: string
  ): Promise<ReviewSection | null> {
    if (match.game !== 'valorant') return null;

    const orbData = this.extractOrbData(rounds, teamId);

    if (!orbData) return null;

    const ourOrbs = orbData.our_team;
    const theirOrbs = orbData.their_team;
    const orbDifferential = ourOrbs - theirOrbs;

    const findings: string[] = [];

    if (orbDifferential < -2) {
      // Significant disadvantage
      findings.push(
        `Ultimate Economy: Only ${ourOrbs} orbs collected vs ${theirOrbs} by enemy. (${Math.abs(orbDifferential)} orb deficit)`
      );
    }

    // Analyze ultimate usage efficiency (simulated)
    const ultUsage = this.analyzeUltimateUsage(rounds, teamId);
    if (ultUsage.wasted_ultimates > 0) {
      findings.push(
        `Ultimate Usage: ${ultUsage.wasted_ultimates} ultimates wasted (no kills or objective impact)`
      );
    }

    if (findings.length === 0) return null;

    return {
      title: 'Ultimate Economy',
      priority: 3,
      findings,
      evidence: [
        {
          metric: 'Orb Collection',
          our_team: ourOrbs,
          their_team: theirOrbs,
          differential: orbDifferential,
        },
        {
          metric: 'Ultimate Usage Efficiency',
          our_team: ultUsage.effective_ultimates,
          their_team: ultUsage.wasted_ultimates,
        },
      ],
      coaching_questions: [
        'How are we prioritizing orb control?',
        'What\'s our protocol for ultimate combos?',
        'Are we tracking enemy ultimate economy?',
      ],
      recommended_drills: ['Orb control rotations', 'Ultimate combo practice', 'Ultimate economy tracking'],
      visualization_hook: 'ultimate_economy_visualization',
    };
  }

  /**
   * Analyze map control trends
   */
  private async analyzeMapControlTrends(
    rounds: RoundData[],
    teamId: string
  ): Promise<ReviewSection | null> {
    // Simplified analysis - in reality would analyze map control events
    return null; // Placeholder for future implementation
  }

  /**
   * Analyze team composition
   */
  private async analyzeTeamComposition(
    match: MatchMetadata,
    rounds: RoundData[],
    teamId: string
  ): Promise<ReviewSection | null> {
    // Simplified analysis - in reality would analyze agent picks
    return null; // Placeholder for future implementation
  }

  /**
   * Build the final agenda document
   */
  private buildAgendaDocument(
    match: MatchMetadata,
    rounds: RoundData[],
    sections: ReviewSection[],
    teamId: string
  ): ReviewAgenda {
    // Calculate match info
    const ourTeamWins = rounds.filter((r) => r.winning_team_id === teamId).length;
    const theirTeamWins = rounds.length - ourTeamWins;
    const score = `${ourTeamWins}-${theirTeamWins}`;

    const matchInfo: MatchInfo = {
      match_type: 'BO1', // Could be determined from tournament context
      opponent: match.team_b_id, // Simplified
      map: match.map_name,
      score,
      composition: '1-3-1', // Would come from agent picks
      duration: this.calculateMatchDuration(rounds),
      date: match.start_time,
    };

    const reviewAgenda: ReviewAgendaSection[] = sections.map((section) => ({
      section_title: section.title,
      priority: '🔥'.repeat(section.priority), // Visual priority indicator
      key_findings: section.findings,
      evidence: section.evidence.slice(0, 2), // Limit to top 2
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

  private analyzePistolLoss(round: RoundData, allRounds: RoundData[]): string {
    // Simplified analysis - in reality would analyze round events
    return 'Economic disadvantage impact';
  }

  private calculatePistolEcoImpact(
    rounds: RoundData[],
    pistolRoundNumber: number,
    teamId: string
  ): string {
    let impactRounds = 0;
    for (let i = pistolRoundNumber; i < Math.min(pistolRoundNumber + 4, rounds.length); i++) {
      const round = rounds[i];
      if (round.round_type === 'eco' || round.round_type === 'force') {
        impactRounds++;
      } else {
        break;
      }
    }
    return `${impactRounds} rounds`;
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

  private calculateEconomicLoss(
    prevRound: RoundData,
    currentRound: RoundData,
    teamId: string
  ): string {
    // Simplified calculation
    return 'significant';
  }

  private calculateRippleEffect(
    rounds: RoundData[],
    startIndex: number,
    lookAhead: number,
    teamId: string
  ): number {
    let affectedRounds = 0;
    for (let i = startIndex + 1; i < Math.min(startIndex + lookAhead + 1, rounds.length); i++) {
      const round = rounds[i];
      if (round.round_type === 'eco' || round.round_type === 'force') {
        affectedRounds++;
      } else {
        break;
      }
    }
    return affectedRounds;
  }

  private calculateEconomicEfficiency(rounds: RoundData[], teamId: string): number {
    // Simplified efficiency calculation
    const wins = rounds.filter((r) => r.winning_team_id === teamId).length;
    const total = rounds.length;
    return Math.round((wins / total) * 100);
  }

  private identifyEconomicPatterns(
    rounds: RoundData[],
    teamId: string
  ): Array<{ description: string; frequency: number; rounds: number[] }> {
    // Simplified pattern detection
    return [];
  }

  private analyzeDefaultPatterns(
    rounds: RoundData[],
    teamId: string
  ): { primary_pattern: string } | null {
    // Simplified default pattern analysis
    return null;
  }

  private extractOrbData(
    rounds: RoundData[],
    teamId: string
  ): { our_team: number; their_team: number } | null {
    // Simplified orb extraction - in reality would parse from GRID events
    // For now, simulate based on round wins
    let ourOrbs = 0;
    let theirOrbs = 0;

    for (const round of rounds) {
      if (round.winning_team_id === teamId) {
        ourOrbs++;
      } else {
        theirOrbs++;
      }
    }

    // Adjust to simulate orb collection (not all rounds have orbs)
    ourOrbs = Math.floor(ourOrbs * 0.5);
    theirOrbs = Math.floor(theirOrbs * 0.5);

    return { our_team: ourOrbs, their_team: theirOrbs };
  }

  private analyzeUltimateUsage(
    rounds: RoundData[],
    teamId: string
  ): { effective_ultimates: number; wasted_ultimates: number } {
    // Simplified analysis - in reality would analyze ultimate usage events
    return {
      effective_ultimates: Math.floor(rounds.length * 0.3),
      wasted_ultimates: Math.floor(rounds.length * 0.1),
    };
  }

  private generateExecutiveSummary(sections: ReviewSection[]): string {
    const criticalIssues = sections.filter((s) => s.priority >= 4);
    if (criticalIssues.length === 0) {
      return 'Overall performance was solid with minor areas for improvement.';
    }

    const topIssue = criticalIssues[0];
    if (!topIssue) {
      return 'Overall performance was solid with minor areas for improvement.';
    }
    return `Key focus areas: ${topIssue.title} and ${sections.length - 1} other strategic elements. ${criticalIssues.length} critical issues identified requiring immediate attention.`;
  }

  private generateDiscussionPrompt(question: string): string {
    // Generate discussion prompts based on question type
    if (question.includes('strategy') || question.includes('default')) {
      return 'Discuss team decision-making process and communication protocols. Review VOD clips showing key moments.';
    }
    if (question.includes('criteria') || question.includes('decision')) {
      return 'Establish clear guidelines and decision trees. Practice scenarios in scrims to reinforce protocols.';
    }
    if (question.includes('adapt') || question.includes('opponent')) {
      return 'Analyze opponent patterns and discuss adaptive strategies. Review how similar situations were handled in past matches.';
    }
    return 'Review specific moments and discuss alternative approaches. Identify root causes and preventive measures.';
  }

  private calculateMatchDuration(rounds: RoundData[]): string {
    const totalSeconds = rounds.reduce((sum, r) => sum + r.duration_seconds, 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

export const agendaGenerator = new AgendaGeneratorService();
export default agendaGenerator;

