# app/api_hitl.py
from fastapi import APIRouter, HTTPException, Depends
from .schemas_hitl import ReviewCreate, ReviewOut, CommentCreate, ActionCreate
from .persistence_hitl import create_review, get_review_by_id, list_pending_reviews, add_comment, add_action, set_final_result
from .utils.message_bus import MessageBus
from typing import List
from app.auth import require_role, get_current_user
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/reviews", tags=["human-reviews"])
message_bus = MessageBus()

@router.post("/create", response_model=ReviewOut)
def api_create_review(req: ReviewCreate):
    try:
        r = create_review(req.review_id, req.run_id, req.agent_name, req.reason, req.metadata)
        try:
            message_bus.publish({"event": "review.created", "review_id": r.review_id, "run_id": r.run_id})
        except Exception as e:
            logger.warning(f"Failed to publish review.created event: {e}", exc_info=True)
        return r
    except IntegrityError as e:
        logger.error(f"Integrity error creating review: {e}", exc_info=True)
        raise HTTPException(status_code=409, detail=f"Review with ID {req.review_id} already exists")
    except Exception as e:
        logger.error(f"Error creating review: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create review")

@router.get("/pending", response_model=List[ReviewOut])
def api_list_pending(limit: int = 50):
    try:
        if limit < 1 or limit > 1000:
            raise HTTPException(status_code=400, detail="limit must be between 1 and 1000")
        rows = list_pending_reviews(limit)
        return rows
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error listing pending reviews: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error listing pending reviews: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{review_id}", response_model=ReviewOut)
def api_get_review(review_id: str):
    try:
        if not review_id:
            raise HTTPException(status_code=400, detail="review_id is required")
        r = get_review_by_id(review_id)
        if not r:
            raise HTTPException(status_code=404, detail=f"Review {review_id} not found")
        return r
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error getting review {review_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error getting review {review_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{review_id}/comment")
def api_comment(review_id: str, c: CommentCreate, user = Depends(get_current_user)):
    """
    Any authenticated user may comment (useful for reviewers and requesters).
    """
    try:
        if not review_id:
            raise HTTPException(status_code=400, detail="review_id is required")
        if not c.body or not c.body.strip():
            raise HTTPException(status_code=400, detail="comment body cannot be empty")
        
        r = get_review_by_id(review_id)
        if not r:
            raise HTTPException(status_code=404, detail=f"Review {review_id} not found")
        
        try:
            comment = add_comment(r.id, user.username, c.body)
        except Exception as e:
            logger.error(f"Error adding comment to review {review_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to add comment")
        
        try:
            message_bus.publish({"event": "review.comment", "review_id": review_id, "author": user.username, "body": c.body})
        except Exception as e:
            logger.warning(f"Failed to publish review.comment event: {e}", exc_info=True)
        
        return {"ok": True, "comment_id": comment.id}
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error in comment endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error in comment endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{review_id}/action")
def api_action(review_id: str, action: ActionCreate, user = Depends(require_role("reviewer"))):
    """
    Only users with the 'reviewer' role can take actions (approve/reject/request_edit/escalate).
    The dependency `require_role("reviewer")` validates this.
    """
    try:
        if not review_id:
            raise HTTPException(status_code=400, detail="review_id is required")
        if not action.action:
            raise HTTPException(status_code=400, detail="action is required")
        
        r = get_review_by_id(review_id)
        if not r:
            raise HTTPException(status_code=404, detail=f"Review {review_id} not found")
        
        try:
            act, review = add_action(r.id, user.username, action.action, action.payload)
        except Exception as e:
            logger.error(f"Error adding action to review {review_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to add action")
        
        # if approved and payload contains final_result, persist it
        if action.action == "approve" and action.payload and action.payload.get("final_result"):
            try:
                set_final_result(r.id, action.payload.get("final_result"))
            except Exception as e:
                logger.error(f"Error setting final result for review {review_id}: {e}", exc_info=True)
                # Don't fail the request if this fails, action was already recorded
        
        try:
            message_bus.publish({"event": "review.action", "review_id": review_id, "action": action.action, "actor": user.username})
        except Exception as e:
            logger.warning(f"Failed to publish review.action event: {e}", exc_info=True)
        
        return {"ok": True, "action_id": act.id}
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error in action endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error in action endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


