import { LiveGameState, CoachCall } from '../../types/liveIntel';
import { MemoryReader } from './memoryReaders';
import { LivePlaystyleClassifier } from './classifier';
import { LiveCoach } from './coach';

export class LiveIntelligenceEngine {
  private overlayCallback?: (state: LiveGameState & { coachCalls: CoachCall[] }) => void;
  private memoryReader?: MemoryReader;
  private classifier = new LivePlaystyleClassifier();
  private coach = new LiveCoach();
  private timer?: number;

  async startLiveAnalysis(game: 'VALORANT' | 'LEAGUE', onUpdate?: (state: LiveGameState & { coachCalls: CoachCall[] }) => void): Promise<void> {
    this.memoryReader = new MemoryReader(game);
    await this.memoryReader.hookEvents();
    this.overlayCallback = onUpdate;
    this.startLoop();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer as any);
      this.timer = undefined;
    }
  }

  private startLoop() {
    this.timer = setInterval(async () => {
      if (!this.memoryReader) return;
      const rawState = await this.memoryReader.readLiveState();

      // Enrich with live classification where needed
      const state: LiveGameState = {
        ...rawState,
        enemyPlayers: rawState.enemyPlayers.map((p: any) => {
          if (rawState.game === 'VALORANT') {
            const ps = this.classifier.classifyValorant(p);
            return { ...p, playstyle: ps, confidence: p.confidence ?? 0.7 };
          }
          if (rawState.game === 'LEAGUE') {
            const ps = this.classifier.classifyLeague(p, rawState.mapState.gameTime ?? 0);
            return { ...p, playstyle: ps, confidence: p.confidence ?? 0.7 };
          }
          return p;
        })
      };

      const coachCalls = this.coach.generateCalls(state);
      this.overlayCallback?.({ ...state, coachCalls });
    }, 1000 / 30) as any; // ~30fps
  }
}
