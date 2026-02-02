# app/models.py
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .db import Base
import uuid

class AgentRun(Base):
    __tablename__ = "agent_runs"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(64), unique=True, index=True)  # e.g., uuid
    agent_name = Column(String(128), index=True)
    status = Column(String(32), index=True)  # queued, running, success, failed, cancelled
    input_payload = Column(JSON, nullable=True)
    result_summary = Column(JSON, nullable=True)  # small digest of result for searches
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    duration_s = Column(Integer, nullable=True)
    provenance = Column(JSON, nullable=True)  # model_version, code_version, prompt, seed...
    artifacts = relationship("Artifact", back_populates="agent_run", cascade="all, delete-orphan")
    metrics = relationship("AgentMetric", back_populates="agent_run", cascade="all, delete-orphan")

class Artifact(Base):
    __tablename__ = "artifacts"
    id = Column(Integer, primary_key=True, index=True)
    agent_run_id = Column(Integer, ForeignKey("agent_runs.id", ondelete="CASCADE"))
    name = Column(String(256))  # user-friendly name
    s3_key = Column(String(512), index=True)
    content_type = Column(String(128))
    size_bytes = Column(Integer)
    meta = Column(JSON, nullable=True)  # e.g., joint_format, fps, frames_count
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    agent_run = relationship("AgentRun", back_populates="artifacts")

class AgentMetric(Base):
    __tablename__ = "agent_metrics"
    id = Column(Integer, primary_key=True, index=True)
    agent_run_id = Column(Integer, ForeignKey("agent_runs.id", ondelete="CASCADE"))
    key = Column(String(128), index=True)  # e.g., "confidence", "loss", "n_frames"
    value = Column(String(128))
    numeric_value = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    agent_run = relationship("AgentRun", back_populates="metrics")

class PromptTemplate(Base):
    __tablename__ = "prompt_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True)
    template = Column(Text)
    description = Column(Text, nullable=True)
    created_by = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    version = Column(String(64), nullable=True)

# ============================================================================
# Non-Monetary Prediction & Fantasy System Models
# ============================================================================

class VirtualWallet(Base):
    """Virtual currency wallet for users (non-monetary)"""
    __tablename__ = "virtual_wallets"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(128), unique=True, index=True, nullable=False)
    balance = Column(Integer, default=1000, nullable=False)  # Starting balance
    total_earned = Column(Integer, default=0, nullable=False)
    total_wagered = Column(Integer, default=0, nullable=False)
    daily_wagered = Column(Integer, default=0, nullable=False)
    last_reset_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    transactions = relationship("WalletTransaction", back_populates="wallet", cascade="all, delete-orphan")

class WalletTransaction(Base):
    """Immutable ledger of all wallet operations"""
    __tablename__ = "wallet_transactions"
    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("virtual_wallets.id", ondelete="CASCADE"), nullable=False)
    transaction_type = Column(String(32), nullable=False)  # 'credit', 'debit', 'settlement'
    amount = Column(Integer, nullable=False)
    balance_before = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    reference_type = Column(String(64), nullable=True)  # 'prediction', 'achievement', 'daily_bonus'
    reference_id = Column(String(128), nullable=True)  # ID of related prediction/achievement
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    wallet = relationship("VirtualWallet", back_populates="transactions")

class PredictionMarket(Base):
    """Available prediction markets for matches"""
    __tablename__ = "prediction_markets"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(String(128), index=True, nullable=False)
    market_type = Column(String(64), nullable=False)  # 'match_winner', 'map_winner', 'first_blood', 'mvp', etc.
    market_key = Column(String(128), nullable=True)  # e.g., 'map1_winner', 'round_5_winner'
    status = Column(String(32), default='open', nullable=False)  # 'open', 'closed', 'settled'
    odds_type = Column(String(32), default='fixed', nullable=False)  # 'fixed', 'pool'
    odds = Column(JSON, nullable=True)  # { "TeamA": 1.5, "TeamB": 2.0 } or pool totals
    pool_total = Column(Integer, default=0, nullable=False)  # For pool-based markets
    pool_by_selection = Column(JSON, nullable=True)  # { "TeamA": 1000, "TeamB": 500 }
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)
    settled_at = Column(DateTime(timezone=True), nullable=True)
    
    predictions = relationship("Prediction", back_populates="market", cascade="all, delete-orphan")

class Prediction(Base):
    """User predictions on markets"""
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String(128), unique=True, index=True, nullable=False)  # UUID
    username = Column(String(128), index=True, nullable=False)
    market_id = Column(Integer, ForeignKey("prediction_markets.id", ondelete="CASCADE"), nullable=False)
    selection = Column(String(128), nullable=False)  # e.g., "TeamA", "Player123"
    stake = Column(Integer, nullable=False)  # Virtual coins wagered
    odds = Column(String(32), nullable=True)  # Odds at time of prediction
    potential_payout = Column(Integer, nullable=False)  # stake * odds (rounded)
    status = Column(String(32), default='pending', nullable=False)  # 'pending', 'won', 'lost', 'cancelled'
    payout = Column(Integer, nullable=True)  # Actual payout if won
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    settled_at = Column(DateTime(timezone=True), nullable=True)
    
    market = relationship("PredictionMarket", back_populates="predictions")

class FantasyTeam(Base):
    """User fantasy team rosters"""
    __tablename__ = "fantasy_teams"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(String(128), unique=True, index=True, nullable=False)  # UUID
    username = Column(String(128), index=True, nullable=False)
    match_id = Column(String(128), index=True, nullable=False)
    team_name = Column(String(128), nullable=True)
    players = Column(JSON, nullable=False)  # List of player IDs
    total_points = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Leaderboard(Base):
    """Leaderboard entries for competitions"""
    __tablename__ = "leaderboards"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(128), index=True, nullable=False)
    competition_type = Column(String(64), nullable=False)  # 'overall', 'weekly', 'monthly', 'tournament_123'
    competition_id = Column(String(128), nullable=True)  # Specific tournament/season ID
    score = Column(Integer, default=0, nullable=False)
    rank = Column(Integer, nullable=True)
    wins = Column(Integer, default=0, nullable=False)
    total_predictions = Column(Integer, default=0, nullable=False)
    accuracy = Column(String(16), nullable=True)  # Percentage as string
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )

# ============================================================================
# GRID Data Ingestion Models
# ============================================================================

class RawEvent(Base):
    __tablename__ = "events_raw"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    grid_event_id = Column(String(256), nullable=False, index=True)   # GRID-provided id if present
    source = Column(String(64), nullable=False)                      # "GRID"
    match_id = Column(String(128), index=True)
    received_at = Column(DateTime(timezone=True), server_default=func.now())
    payload = Column(JSON, nullable=False)                       # original GRID JSON
    ingested_by = Column(String(128), nullable=False)                 # settings.INGESTOR_NAME

    __table_args__ = (
        UniqueConstraint("grid_event_id", "source", name="uq_grid_event"),
    )


class CanonicalEventIndex(Base):
    """
    Light summary index to query canonical events quickly.
    Canonical payloads are published to Redis stream; we optionally keep a small relational summary.
    """
    __tablename__ = "events_canonical_index"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(256), nullable=False, unique=True, index=True)
    match_id = Column(String(128), index=True)
    event_type = Column(String(64), index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    payload = Column(JSON, nullable=True)
    enriched = Column(Boolean, default=False)

