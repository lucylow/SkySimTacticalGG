# app/schemas_predictions.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

# ============================================================================
# Enums
# ============================================================================

class MarketType(str, Enum):
    MATCH_WINNER = "match_winner"
    MAP_WINNER = "map_winner"
    FIRST_BLOOD = "first_blood"
    MVP = "mvp"
    ROUND_WINNER = "round_winner"
    OBJECTIVE = "objective"

class PredictionStatus(str, Enum):
    PENDING = "pending"
    WON = "won"
    LOST = "lost"
    CANCELLED = "cancelled"

class MarketStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    SETTLED = "settled"

# ============================================================================
# Wallet Schemas
# ============================================================================

class VirtualWalletOut(BaseModel):
    username: str
    balance: int
    total_earned: int
    total_wagered: int
    daily_wagered: int
    last_reset_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WalletTransactionOut(BaseModel):
    id: int
    transaction_type: str
    amount: int
    balance_before: int
    balance_after: int
    reference_type: Optional[str]
    reference_id: Optional[str]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class WalletTopUp(BaseModel):
    amount: int = Field(..., gt=0, le=1000, description="Amount to add (max 1000 per day)")
    reason: Optional[str] = "daily_bonus"

# ============================================================================
# Market Schemas
# ============================================================================

class PredictionMarketOut(BaseModel):
    id: int
    match_id: str
    market_type: str
    market_key: Optional[str]
    status: str
    odds_type: str
    odds: Optional[Dict[str, Any]]
    pool_total: int
    pool_by_selection: Optional[Dict[str, int]]
    created_at: datetime
    closed_at: Optional[datetime]
    settled_at: Optional[datetime]

    class Config:
        from_attributes = True

class PredictionMarketCreate(BaseModel):
    match_id: str
    market_type: MarketType
    market_key: Optional[str] = None
    odds_type: str = "fixed"
    odds: Optional[Dict[str, float]] = None  # For fixed odds: {"TeamA": 1.5, "TeamB": 2.0}

# ============================================================================
# Prediction Schemas
# ============================================================================

class PredictionOut(BaseModel):
    id: int
    prediction_id: str
    username: str
    market_id: int
    selection: str
    stake: int
    odds: Optional[str]
    potential_payout: int
    status: str
    payout: Optional[int]
    created_at: datetime
    settled_at: Optional[datetime]
    market: Optional[PredictionMarketOut] = None

    class Config:
        from_attributes = True

class PredictionCreate(BaseModel):
    market_id: int
    selection: str
    stake: int = Field(..., gt=0, le=1000, description="Virtual coins to wager (max 1000)")

class PredictionCancel(BaseModel):
    prediction_id: str
    reason: Optional[str] = None

# ============================================================================
# Fantasy Team Schemas
# ============================================================================

class FantasyTeamOut(BaseModel):
    id: int
    team_id: str
    username: str
    match_id: str
    team_name: Optional[str]
    players: List[str]
    total_points: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FantasyTeamCreate(BaseModel):
    match_id: str
    team_name: Optional[str] = None
    players: List[str] = Field(..., min_items=1, max_items=10)

# ============================================================================
# Leaderboard Schemas
# ============================================================================

class LeaderboardOut(BaseModel):
    id: int
    username: str
    competition_type: str
    competition_id: Optional[str]
    score: int
    rank: Optional[int]
    wins: int
    total_predictions: int
    accuracy: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# Settlement Schemas
# ============================================================================

class MarketSettlement(BaseModel):
    market_id: int
    winning_selection: str
    settle_all: bool = True

# ============================================================================
# Analytics Schemas
# ============================================================================

class PredictionStats(BaseModel):
    total_predictions: int
    wins: int
    losses: int
    accuracy: float
    total_wagered: int
    total_won: int
    net_profit: int
    expected_value: Optional[float] = None

class UserDashboard(BaseModel):
    wallet: VirtualWalletOut
    stats: PredictionStats
    recent_predictions: List[PredictionOut]
    leaderboard_position: Optional[int] = None


