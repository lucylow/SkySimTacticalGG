// services/predictionsApi.ts
// Legacy wrapper - use unifiedApi directly for new code
// This file maintains backward compatibility for existing code
import { unifiedApi } from './unifiedApi';
import type {
  VirtualWallet,
  WalletTransaction,
  PredictionMarket,
  Prediction,
  LeaderboardEntry,
  PredictionStats,
  UserDashboard,
  PredictionCreate,
  WalletTopUp,
  MarketSettlement,
} from '../types/predictions';

/**
 * PredictionsApi - Legacy wrapper around unifiedApi
 * @deprecated Use unifiedApi directly instead
 */
class PredictionsApi {
  // Wallet endpoints
  async getWallet(): Promise<VirtualWallet> {
    return unifiedApi.getWallet();
  }

  async topUpWallet(topup: WalletTopUp): Promise<VirtualWallet> {
    return unifiedApi.topUpWallet({ amount: topup.amount, reason: topup.reason || 'topup' });
  }

  async getTransactions(limit = 50): Promise<WalletTransaction[]> {
    return unifiedApi.getWalletTransactions(limit);
  }

  // Market endpoints
  async listMarkets(matchId?: string, status?: string): Promise<PredictionMarket[]> {
    return unifiedApi.listMarkets({ match_id: matchId, status });
  }

  async getMarket(marketId: number): Promise<PredictionMarket> {
    return unifiedApi.getMarket(marketId);
  }

  // Prediction endpoints
  async createPrediction(prediction: PredictionCreate): Promise<Prediction> {
    return unifiedApi.createPrediction({
      market_id: prediction.market_id,
      selection: prediction.selection,
      stake: prediction.stake,
    });
  }

  async listPredictions(status?: string): Promise<Prediction[]> {
    return unifiedApi.listPredictions(status);
  }

  async getPrediction(predictionId: string): Promise<Prediction> {
    return unifiedApi.getPrediction(predictionId);
  }

  async cancelPrediction(predictionId: string): Promise<Prediction> {
    return unifiedApi.cancelPrediction(predictionId);
  }

  // Analytics endpoints
  async getStats(): Promise<PredictionStats> {
    return unifiedApi.getPredictionStats();
  }

  async getDashboard(): Promise<UserDashboard> {
    return unifiedApi.getPredictionDashboard();
  }

  // Leaderboard endpoints
  async getLeaderboard(competitionType = 'overall', limit = 100): Promise<LeaderboardEntry[]> {
    return unifiedApi.getLeaderboard(competitionType, limit);
  }

  // Admin endpoints
  async settleMarket(settlement: MarketSettlement): Promise<PredictionMarket> {
    return unifiedApi.settleMarket(settlement.market_id, {
      winning_selection: settlement.winning_selection,
      settle_all: settlement.settle_all,
    });
  }
}

export const predictionsApi = new PredictionsApi();
