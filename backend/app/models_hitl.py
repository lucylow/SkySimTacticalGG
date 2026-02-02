# app/models_hitl.py
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .db import Base

class HumanReview(Base):
    __tablename__ = "human_reviews"
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(String(64), unique=True, index=True)  # e.g., uuid
    run_id = Column(String(64), index=True)  # links to AgentRun.run_id
    agent_name = Column(String(128))
    reason = Column(String(256), nullable=True)  # why review was triggered
    status = Column(String(32), index=True, default="pending")  # pending, in_progress, approved, rejected, escalated
    assigned_to = Column(String(128), nullable=True)  # reviewer username
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    metadata = Column(JSON, nullable=True)  # e.g., model_confidence, prompt, artefact pointers
    # Store the final accepted/edited result here
    final_result = Column(JSON, nullable=True)
    # Link to comments / actions
    comments = relationship("HumanReviewComment", back_populates="review", cascade="all, delete-orphan")
    audit_actions = relationship("HumanReviewAction", back_populates="review", cascade="all, delete-orphan")

class HumanReviewComment(Base):
    __tablename__ = "human_review_comments"
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("human_reviews.id", ondelete="CASCADE"))
    author = Column(String(128))  # reviewer id / username
    body = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    review = relationship("HumanReview", back_populates="comments")

class HumanReviewAction(Base):
    __tablename__ = "human_review_actions"
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("human_reviews.id", ondelete="CASCADE"))
    action = Column(String(64))  # approve, reject, request_edit, escalate
    actor = Column(String(128))
    payload = Column(JSON, nullable=True)  # optional details (e.g., edit contents)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    review = relationship("HumanReview", back_populates="audit_actions")


