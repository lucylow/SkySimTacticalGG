# app/persistence_hitl.py
from .db import SessionLocal
from .models_hitl import HumanReview, HumanReviewComment, HumanReviewAction
from sqlalchemy.orm import Session
from datetime import datetime, timezone

def create_review(review_id: str, run_id: str, agent_name: str, reason: str = None, metadata: dict = None):
    db: Session = SessionLocal()
    try:
        r = HumanReview(review_id=review_id, run_id=run_id, agent_name=agent_name, reason=reason, metadata=metadata or {}, status="pending")
        db.add(r)
        db.commit()
        db.refresh(r)
        return r
    finally:
        db.close()

def get_review_by_id(review_id: str):
    db = SessionLocal()
    try:
        return db.query(HumanReview).filter_by(review_id=review_id).first()
    finally:
        db.close()

def list_pending_reviews(limit: int = 50):
    db = SessionLocal()
    try:
        return db.query(HumanReview).filter(HumanReview.status == "pending").order_by(HumanReview.created_at.asc()).limit(limit).all()
    finally:
        db.close()

def add_comment(review_db_id: int, author: str, body: str):
    db = SessionLocal()
    try:
        comment = HumanReviewComment(review_id=review_db_id, author=author, body=body)
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return comment
    finally:
        db.close()

def add_action(review_db_id: int, actor: str, action: str, payload: dict = None):
    db = SessionLocal()
    try:
        act = HumanReviewAction(review_id=review_db_id, actor=actor, action=action, payload=payload or {})
        db.add(act)
        # update review status fields as needed
        review = db.query(HumanReview).filter_by(id=review_db_id).first()
        review.status = {
            "approve": "approved",
            "reject": "rejected",
            "request_edit": "in_progress",
            "escalate": "escalated"
        }.get(action, review.status)
        review.finished_at = datetime.now(timezone.utc) if action in ("approve", "reject") else review.finished_at
        db.commit()
        db.refresh(act)
        db.refresh(review)
        return act, review
    finally:
        db.close()

def set_final_result(review_db_id: int, final_result: dict):
    db = SessionLocal()
    try:
        review = db.query(HumanReview).filter_by(id=review_db_id).first()
        review.final_result = final_result
        db.add(review)
        db.commit()
        db.refresh(review)
        return review
    finally:
        db.close()

