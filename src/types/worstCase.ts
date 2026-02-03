import { AgentOutput } from './agents';

export type GameTitle = 'LoL' | 'Valorant';

export type Role = 
  | 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOT' | 'SUPPORT' // LoL
  | 'DUELIST' | 'INITIATOR' | 'CONTROLLER' | 'SENTINEL' | 'IGL'; // Valorant

export interface WorstCaseState {
  role: Role;
  failureTrigger: string;
  gameTime: number; // seconds
  resources: {
    hp: number; // percentage
    mana?: number; // percentage
    utility: number; // count
    economy: 'eco' | 'half' | 'full';
  };
  teamState: {
    coordination: number; // 0-1
    vision: number; // score
    comms: boolean;
  };
}

export interface RecoveryScript {
  immediate: string[];
  positioning: string[];
  macro: string[];
  mental: string;
}

export interface TrainingDrill {
  name: string;
  hp?: number;
  utility?: number;
  economy?: string;
  objective: string;
  successMetric: string;
}

export interface TrainingSession {
  role: Role;
  sessionTitle: string;
  drills: {
    drill: number;
    scenario: string;
    script: RecoveryScript & Partial<WorstCaseState>;
    practiceMode: 'normals' | 'scrims' | 'ranked';
  }[];
  successCriteria: {
    survivalRate: number;
    csPerMin?: number;
    tiltRecovery: number;
  };
}

export interface WorstCaseAnalysisOutput extends AgentOutput {
  state: WorstCaseState;
  recovery_script: RecoveryScript;
  drills: TrainingDrill[];
  tilt_protocol: string;
}
