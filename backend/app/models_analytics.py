# app/models_analytics.py
"""
Database models for Macro-Strategy Correlation analytics system.
Stores rounds, micro_actions, macro_outcomes, and correlation_results.
"""
from sqlalchemy import Column, String, Integer, Boolean, Float, DateTime, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .db import Base
import uuid


class Round(Base):
    """Macro-level round data with metadata."""
    __tablename__ = "rounds"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    match_id = Column(String(128), nullable=False, index=True)
    map_id = Column(String(128), nullable=True, index=True)
    round_no = Column(Integer, nullable=False)
    round_start = Column(DateTime(timezone=True), nullable=True)
    round_end = Column(DateTime(timezone=True), nullable=True)
    winner_team = Column(String(128), nullable=True)
    site_executed = Column(Boolean, nullable=True)
    economy_snapshot = Column(JSON, nullable=True)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint("match_id", "round_no", name="uq_round_match_round"),
    )


class MicroAction(Base):
    """Micro-level signals: intents, synthesized motions, agent signals."""
    __tablename__ = "micro_actions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    signal_id = Column(String(256), unique=True, nullable=True, index=True)  # agent signal id
    match_id = Column(String(128), nullable=False, index=True)
    round_id = Column(String(36), ForeignKey("rounds.id", ondelete="SET NULL"), nullable=True, index=True)
    player_id = Column(String(128), nullable=True, index=True)
    team = Column(String(128), nullable=True, index=True)
    intent = Column(String(128), nullable=True, index=True)  # advance, hold, plant, engage, etc.
    confidence = Column(Float, nullable=True)
    features = Column(JSON, nullable=True)  # serialized feature vector
    artifact_url = Column(String(512), nullable=True)
    generated_at = Column(DateTime(timezone=True), nullable=True)
    ingestion_meta = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MacroOutcome(Base):
    """Materialized per-round/team macro outcomes."""
    __tablename__ = "macro_outcomes"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    round_id = Column(String(36), ForeignKey("rounds.id", ondelete="CASCADE"), nullable=False, index=True)
    match_id = Column(String(128), nullable=True, index=True)
    team = Column(String(128), nullable=True, index=True)
    round_win = Column(Boolean, nullable=True)
    econ_delta = Column(Integer, nullable=True)  # economy change
    site_executed = Column(Boolean, nullable=True)
    outcome_meta = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint("round_id", "team", name="uq_macro_round_team"),
    )


class CorrelationResult(Base):
    """Store computed correlations, p-values, effect sizes."""
    __tablename__ = "correlation_results"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    metric_name = Column(String(128), nullable=True, index=True)  # point_biserial, logistic, chi2, etc.
    feature_name = Column(String(128), nullable=True, index=True)
    outcome_name = Column(String(128), nullable=True, index=True)
    correlation = Column(Float, nullable=True)  # r, coef, chi2, etc.
    p_value = Column(Float, nullable=True, index=True)
    p_value_bh = Column(Float, nullable=True)  # Benjamini-Hochberg corrected
    effect_size = Column(Float, nullable=True)  # odds_ratio, r^2, etc.
    direction = Column(String(16), nullable=True)  # pos, neg
    method = Column(String(64), nullable=True)  # point_biserial, logistic, chi2, etc.
    sample_size = Column(Integer, nullable=True)
    significant = Column(Boolean, nullable=True, index=True)
    extra = Column(JSON, nullable=True)  # additional metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


