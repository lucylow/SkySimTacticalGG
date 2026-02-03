// Mechanical Skill Analyst Agent
// Translates player mechanical profile into macro decision guidelines for Valorant and League

import { BaseAgentImpl } from './baseAgent';
import type {
  AgentInput,
  AgentOutput,
  AgentTool,
  AgentInsight,
  MechanicalProfile,
} from '@/types/agents';

export class MechanicalSkillAnalystAgent extends BaseAgentImpl {
  name = 'Mechanical Skill Analyst';
  role = 'mechanical_skill_analyst' as const;
  description = 'Evaluates mechanical skill as a multiplier and outputs mechanics-informed macro rules for Valorant and League.';

  async execute(input: AgentInput): Promise<AgentOutput> {
    const profile = input.mechanical_profile;
    if (!profile) {
      return this.createBaseOutput(
        [
          {
            id: `mech-none-${Date.now()}`,
            type: 'tactical',
            title: 'No mechanical profile provided',
            description: 'Provide a MechanicalProfile to enable mechanics-aware recommendations.',
            severity: 0.1,
            actionable: false,
          },
        ],
        ['Collect aim consistency/input speed metrics to enable mechanics-aware guidance.'],
        0.4
      );
    }

    const { insights, recommendations, confidence, metadata } = this.evaluateProfile(profile);
    return {
      ...this.createBaseOutput(insights, recommendations, confidence),
      metadata,
    };
  }

  private evaluateProfile(profile: MechanicalProfile): {
    insights: AgentInsight[];
    recommendations: string[];
    confidence: number;
    metadata: Record<string, unknown>;
  } {
    if (profile.game === 'valorant') {
      return this.evaluateValorant(profile);
    }
    return this.evaluateLeague(profile);
  }

  private evaluateValorant(profile: MechanicalProfile) {
    const tierLabel = this.tierName(profile.tier);

    const allowedRisk = this.valorantRiskBudget(profile);

    const roleRec = profile.tier === 'tier_3'
      ? ['Prefer Duelist or Aggressive Initiator roles; take first contact with info.']
      : profile.tier === 'tier_2'
      ? ['Anchor or trade setup roles are viable; take isolated, info-backed fights.']
      : ['Favor Controller/Sentinel utility play; avoid dry peeks; hold angles and trade.'];

    const movementAdvice = (profile.movement_quality ?? 0.5) < 0.5
      ? 'If movement is weak, hold tighter angles; avoid wide swings; prioritize counter-strafing drills.'
      : 'With strong movement, mix in off-angles and controlled wide swings on advantage.';

    const peekMatrix = [
      'Low mechanics → jiggle for info, don’t commit without utility.',
      'Medium mechanics → swing with flash or traded contact.',
      'High mechanics → dry/wide peek only with info advantage or timing window.',
    ];

    const insights: AgentInsight[] = [
      {
        id: `val-risk-${Date.now()}`,
        type: 'tactical',
        title: 'Mechanics as Risk Multiplier',
        description: `Tier ${tierLabel} mechanics imply risk budget = ${allowedRisk.toFixed(2)}. Only take fights your mechanics can afford.`,
        severity: 0.6,
        actionable: true,
        related_data: { risk_budget: allowedRisk, tier: profile.tier },
      },
      {
        id: `val-peek-${Date.now()}`,
        type: 'strategy',
        title: 'Peeking Decision Matrix',
        description: peekMatrix.join(' '),
        severity: 0.5,
        actionable: true,
      },
      {
        id: `val-move-${Date.now()}`,
        type: 'strategy',
        title: 'Keyboard & Movement Macro',
        description: movementAdvice,
        severity: 0.45,
        actionable: true,
      },
    ];

    const recommendations: string[] = [
      ...roleRec,
      profile.aim_consistency !== undefined && profile.aim_consistency < 0.6
        ? 'Aim variance detected → slow rounds, hold angles, play for trades, avoid ego peeks.'
        : 'Maintain consistency-first macro; avoid highlight-chasing plays unless EV-positive.',
      'Pair peeks with utility according to tier; treat mechanics as a spendable budget each round.',
    ];

    const confidence = 0.75;
    const metadata = {
      game: 'valorant',
      recommended_playstyle:
        allowedRisk < 0.45
          ? 'Low-risk, utility-first due to current mechanical variance.'
          : allowedRisk < 0.7
          ? 'Balanced risk; take isolated duels with info.'
          : 'High-agency entry/lurk viable with information advantages.',
    };

    return { insights, recommendations, confidence, metadata };
  }

  private evaluateLeague(profile: MechanicalProfile) {
    const tierLabel = this.tierName(profile.tier);

    const executionBandwidth = this.leagueExecutionBandwidth(profile);

    const roleAdvice = executionBandwidth < 0.5
      ? 'Prefer Jungle/Support/Tank champions to emphasize macro while reducing execution burden.'
      : 'Mid/ADC or mechanically demanding tops are viable if picks match your bandwidth.';

    const champBudgetAdvice = executionBandwidth < 0.5
      ? 'Avoid high-skill champs (Yasuo/Lee/Akali/Aphelios) when input speed/camera control are inconsistent.'
      : 'High-skill champ budget available; ensure clean combos and camera control under pressure.';

    const teamfightAdvice = executionBandwidth < 0.5
      ? 'Teamfights: play front-to-back, peel carries, avoid flanks.'
      : 'Teamfights: look for flanks/picks or high-risk engages if vision and timers favor it.';

    const insights: AgentInsight[] = [
      {
        id: `lol-band-${Date.now()}`,
        type: 'tactical',
        title: 'Mechanics as Execution Bandwidth',
        description: `Tier ${tierLabel} with bandwidth ${executionBandwidth.toFixed(2)}. If you can’t execute it, it isn’t a good macro play.`,
        severity: 0.6,
        actionable: true,
        related_data: { bandwidth: executionBandwidth, tier: profile.tier },
      },
      {
        id: `lol-wave-${Date.now()}`,
        type: 'strategy',
        title: 'Wave & Fight Decisions',
        description:
          executionBandwidth < 0.5
            ? 'Freeze waves and avoid trades when mechanics are unreliable.'
            : 'Push pressure and take trades when inputs are clean and reliable.',
        severity: 0.45,
        actionable: true,
      },
      {
        id: `lol-cam-${Date.now()}`,
        type: 'pattern',
        title: 'Camera Control Impact',
        description:
          (profile.camera_control ?? 0.5) < 0.5
            ? 'Bad camera control likely causing missed roams and late TPs.'
            : 'Good camera control enabling faster rotations and better map reads.',
        severity: 0.4,
        actionable: true,
      },
    ];

    const recommendations: string[] = [
      roleAdvice,
      champBudgetAdvice,
      teamfightAdvice,
      'Itemization: pick reliability over theoretical DPS (e.g., Everfrost over Luden’s if execution is shaky).',
    ];

    const confidence = 0.75;
    const metadata = {
      game: 'lol',
      recommended_playstyle:
        executionBandwidth < 0.45
          ? 'Low-risk, macro-first due to current mechanical variance.'
          : executionBandwidth < 0.7
          ? 'Balanced plan complexity; take skirmishes with setup.'
          : 'High-complexity plays viable; consider flanks and picks with vision.',
    };

    return { insights, recommendations, confidence, metadata };
  }

  private tierName(tier: MechanicalProfile['tier']): string {
    switch (tier) {
      case 'tier_1':
        return '1 — Developing';
      case 'tier_2':
        return '2 — Reliable';
      case 'tier_3':
        return '3 — High-Level';
    }
  }

  private valorantRiskBudget(p: MechanicalProfile): number {
    const aim = p.aim_consistency ?? 0.5;
    const move = p.movement_quality ?? 0.5;
    const stress = p.stress_decay ?? 0.2; // higher = worse under pressure
    // Risk budget: weighted mechanics reduced by stress
    const base = 0.6 * aim + 0.4 * move;
    const penalty = 0.3 * stress;
    return Math.max(0, Math.min(1, base - penalty));
  }

  private leagueExecutionBandwidth(p: MechanicalProfile): number {
    const input = p.input_speed ?? 0.5;
    const cam = p.camera_control ?? 0.5;
    const stress = p.stress_decay ?? 0.2;
    const base = 0.65 * input + 0.35 * cam;
    const penalty = 0.25 * stress;
    return Math.max(0, Math.min(1, base - penalty));
  }

  getTools(): AgentTool[] {
    return [
      {
        name: 'estimate_mechanical_profile',
        description: 'Given simple metrics, estimate a MechanicalProfile with tier.',
        input_schema: {
          game: 'valorant|lol',
          aim_consistency: '0-1 (valorant)',
          movement_quality: '0-1 (valorant)',
          input_speed: '0-1 (lol)',
          camera_control: '0-1 (lol)',
          stress_decay: '0-1',
        },
        execute: async (args: Record<string, unknown>) => {
          const game = (args.game as 'valorant' | 'lol') || 'valorant';
          const profile: MechanicalProfile = {
            game,
            tier: 'tier_2',
            aim_consistency: (args.aim_consistency as number) ?? 0.6,
            movement_quality: (args.movement_quality as number) ?? 0.6,
            input_speed: (args.input_speed as number) ?? 0.6,
            camera_control: (args.camera_control as number) ?? 0.6,
            stress_decay: (args.stress_decay as number) ?? 0.2,
          };
          // Simple tiering heuristic
          const score = game === 'valorant'
            ? 0.6 * (profile.aim_consistency ?? 0.5) + 0.4 * (profile.movement_quality ?? 0.5)
            : 0.65 * (profile.input_speed ?? 0.5) + 0.35 * (profile.camera_control ?? 0.5);
          profile.tier = score < 0.45 ? 'tier_1' : score < 0.7 ? 'tier_2' : 'tier_3';
          return profile;
        },
      },
    ];
  }
}
