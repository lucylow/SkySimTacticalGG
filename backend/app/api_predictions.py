# app/api_predictions.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, date
import uuid
from decimal import Decimal

from .db import SessionLocal
from .auth import get_current_user, User
from .models import (
    VirtualWallet, WalletTransaction, PredictionMarket, Prediction,
    FantasyTeam, Leaderboard
)
from .schemas_predictions import (
    VirtualWalletOut, WalletTransactionOut, WalletTopUp,
    PredictionMarketOut, PredictionMarketCreate,
    PredictionOut, PredictionCreate, PredictionCancel,
    FantasyTeamOut, FantasyTeamCreate,
    LeaderboardOut, MarketSettlement,
    PredictionStats, UserDashboard,
    MarketStatus, PredictionStatus
)

router = APIRouter(prefix="/predictions", tags=["predictions"])

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================================
# Wallet Endpoints
# ============================================================================

@router.get("/wallet", response_model=VirtualWalletOut)
async def get_wallet(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's virtual wallet"""
    wallet = db.query(VirtualWallet).filter(VirtualWallet.username == user.username).first()
    if not wallet:
        # Create wallet if doesn't exist
        wallet = VirtualWallet(username=user.username, balance=1000)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

@router.post("/wallet/topup", response_model=VirtualWalletOut)
async def topup_wallet(
    topup: WalletTopUp,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add virtual currency to wallet (with daily limits)"""
    wallet = db.query(VirtualWallet).filter(VirtualWallet.username == user.username).first()
    if not wallet:
        wallet = VirtualWallet(username=user.username, balance=1000)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    # Reset daily counter if new day
    today = date.today()
    last_reset = wallet.last_reset_date.date() if wallet.last_reset_date else None
    if last_reset != today:
        wallet.daily_wagered = 0
        wallet.last_reset_date = datetime.now()
    
    # Daily limit check (max 1000 per day)
    if wallet.daily_wagered + topup.amount > 1000:
        raise HTTPException(
            status_code=400,
            detail=f"Daily limit exceeded. Already used {wallet.daily_wagered}/1000 today"
        )
    
    # Credit wallet
    old_balance = wallet.balance
    wallet.balance += topup.amount
    wallet.total_earned += topup.amount
    wallet.daily_wagered += topup.amount
    
    # Create transaction record
    transaction = WalletTransaction(
        wallet_id=wallet.id,
        transaction_type="credit",
        amount=topup.amount,
        balance_before=old_balance,
        balance_after=wallet.balance,
        reference_type=topup.reason,
        description=f"Top-up: {topup.reason}"
    )
    db.add(transaction)
    db.commit()
    db.refresh(wallet)
    
    return wallet

@router.get("/wallet/transactions", response_model=List[WalletTransactionOut])
async def get_transactions(
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get wallet transaction history"""
    wallet = db.query(VirtualWallet).filter(VirtualWallet.username == user.username).first()
    if not wallet:
        return []
    
    transactions = db.query(WalletTransaction)\
        .filter(WalletTransaction.wallet_id == wallet.id)\
        .order_by(desc(WalletTransaction.created_at))\
        .limit(limit)\
        .all()
    
    return transactions

# ============================================================================
# Market Endpoints
# ============================================================================

@router.get("/markets", response_model=List[PredictionMarketOut])
async def list_markets(
    match_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List available prediction markets"""
    query = db.query(PredictionMarket)
    
    if match_id:
        query = query.filter(PredictionMarket.match_id == match_id)
    if status:
        query = query.filter(PredictionMarket.status == status)
    else:
        query = query.filter(PredictionMarket.status == "open")
    
    markets = query.order_by(desc(PredictionMarket.created_at)).all()
    return markets

@router.get("/markets/{market_id}", response_model=PredictionMarketOut)
async def get_market(
    market_id: int,
    db: Session = Depends(get_db)
):
    """Get specific market details"""
    market = db.query(PredictionMarket).filter(PredictionMarket.id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    return market

@router.post("/markets", response_model=PredictionMarketOut)
async def create_market(
    market: PredictionMarketCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new prediction market (admin only - simplified for MVP)"""
    # In production, add admin check: if "admin" not in user.roles: raise HTTPException(403)
    
    db_market = PredictionMarket(
        match_id=market.match_id,
        market_type=market.market_type.value,
        market_key=market.market_key,
        odds_type=market.odds_type,
        odds=market.odds,
        status="open"
    )
    db.add(db_market)
    db.commit()
    db.refresh(db_market)
    return db_market

# ============================================================================
# Prediction Endpoints
# ============================================================================

@router.post("/predictions", response_model=PredictionOut)
async def create_prediction(
    prediction: PredictionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Place a prediction"""
    # Get wallet
    wallet = db.query(VirtualWallet).filter(VirtualWallet.username == user.username).first()
    if not wallet:
        wallet = VirtualWallet(username=user.username, balance=1000)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    # Get market
    market = db.query(PredictionMarket).filter(PredictionMarket.id == prediction.market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    if market.status != "open":
        raise HTTPException(status_code=400, detail="Market is not open for predictions")
    
    # Check balance
    if wallet.balance < prediction.stake:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Daily limit check
    today = date.today()
    last_reset = wallet.last_reset_date.date() if wallet.last_reset_date else None
    if last_reset != today:
        wallet.daily_wagered = 0
        wallet.last_reset_date = datetime.now()
    
    if wallet.daily_wagered + prediction.stake > 1000:
        raise HTTPException(
            status_code=400,
            detail=f"Daily wagering limit exceeded. Already used {wallet.daily_wagered}/1000 today"
        )
    
    # Calculate odds and payout
    if market.odds_type == "fixed" and market.odds:
        odds_value = market.odds.get(prediction.selection)
        if not odds_value:
            raise HTTPException(status_code=400, detail="Invalid selection for this market")
        potential_payout = int(prediction.stake * Decimal(str(odds_value)))
    elif market.odds_type == "pool":
        # Pool-based: payout = (total_pool / stake_on_selection) * user_stake
        pool_by_selection = market.pool_by_selection or {}
        current_stake = pool_by_selection.get(prediction.selection, 0)
        total_pool = market.pool_total + prediction.stake
        if current_stake == 0:
            potential_payout = prediction.stake * 2  # First bet gets 2x
        else:
            potential_payout = int((total_pool / (current_stake + prediction.stake)) * prediction.stake)
        
        # Update pool
        pool_by_selection[prediction.selection] = current_stake + prediction.stake
        market.pool_by_selection = pool_by_selection
        market.pool_total = total_pool
    else:
        raise HTTPException(status_code=400, detail="Market odds not configured")
    
    # Debit wallet
    old_balance = wallet.balance
    wallet.balance -= prediction.stake
    wallet.total_wagered += prediction.stake
    wallet.daily_wagered += prediction.stake
    
    # Create transaction
    transaction = WalletTransaction(
        wallet_id=wallet.id,
        transaction_type="debit",
        amount=-prediction.stake,
        balance_before=old_balance,
        balance_after=wallet.balance,
        reference_type="prediction",
        description=f"Prediction on market {market.id}"
    )
    db.add(transaction)
    
    # Create prediction
    prediction_id = str(uuid.uuid4())
    db_prediction = Prediction(
        prediction_id=prediction_id,
        username=user.username,
        market_id=market.id,
        selection=prediction.selection,
        stake=prediction.stake,
        odds=str(market.odds.get(prediction.selection) if market.odds else "pool"),
        potential_payout=potential_payout,
        status="pending"
    )
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    
    return db_prediction

@router.get("/predictions", response_model=List[PredictionOut])
async def list_predictions(
    status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's predictions"""
    query = db.query(Prediction).filter(Prediction.username == user.username)
    if status:
        query = query.filter(Prediction.status == status)
    
    predictions = query.order_by(desc(Prediction.created_at)).limit(100).all()
    return predictions

@router.get("/predictions/{prediction_id}", response_model=PredictionOut)
async def get_prediction(
    prediction_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific prediction"""
    prediction = db.query(Prediction).filter(
        Prediction.prediction_id == prediction_id,
        Prediction.username == user.username
    ).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return prediction

@router.post("/predictions/{prediction_id}/cancel", response_model=PredictionOut)
async def cancel_prediction(
    prediction_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a pending prediction (refund stake)"""
    prediction = db.query(Prediction).filter(
        Prediction.prediction_id == prediction_id,
        Prediction.username == user.username
    ).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    if prediction.status != "pending":
        raise HTTPException(status_code=400, detail="Can only cancel pending predictions")
    
    market = db.query(PredictionMarket).filter(PredictionMarket.id == prediction.market_id).first()
    if market and market.status != "open":
        raise HTTPException(status_code=400, detail="Market is closed, cannot cancel")
    
    # Refund wallet
    wallet = db.query(VirtualWallet).filter(VirtualWallet.username == user.username).first()
    if wallet:
        old_balance = wallet.balance
        wallet.balance += prediction.stake
        wallet.total_wagered -= prediction.stake
        wallet.daily_wagered = max(0, wallet.daily_wagered - prediction.stake)
        
        transaction = WalletTransaction(
            wallet_id=wallet.id,
            transaction_type="credit",
            amount=prediction.stake,
            balance_before=old_balance,
            balance_after=wallet.balance,
            reference_type="prediction_cancel",
            reference_id=prediction_id,
            description=f"Refund for cancelled prediction {prediction_id}"
        )
        db.add(transaction)
    
    # Update prediction
    prediction.status = "cancelled"
    db.commit()
    db.refresh(prediction)
    
    return prediction

# ============================================================================
# Settlement Endpoints (Admin)
# ============================================================================

@router.post("/markets/{market_id}/settle", response_model=PredictionMarketOut)
async def settle_market(
    market_id: int,
    settlement: MarketSettlement,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Settle a market and pay out winners"""
    # In production, add admin check
    
    market = db.query(PredictionMarket).filter(PredictionMarket.id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    if market.status == "settled":
        raise HTTPException(status_code=400, detail="Market already settled")
    
    # Get all pending predictions
    predictions = db.query(Prediction).filter(
        Prediction.market_id == market_id,
        Prediction.status == "pending"
    ).all()
    
    # Settle predictions
    for pred in predictions:
        wallet = db.query(VirtualWallet).filter(VirtualWallet.username == pred.username).first()
        if not wallet:
            continue
        
        if pred.selection == settlement.winning_selection:
            # Winner: credit payout
            old_balance = wallet.balance
            wallet.balance += pred.potential_payout
            wallet.total_earned += pred.potential_payout
            
            transaction = WalletTransaction(
                wallet_id=wallet.id,
                transaction_type="settlement",
                amount=pred.potential_payout,
                balance_before=old_balance,
                balance_after=wallet.balance,
                reference_type="prediction",
                reference_id=pred.prediction_id,
                description=f"Winning prediction payout: {pred.potential_payout}"
            )
            db.add(transaction)
            
            pred.status = "won"
            pred.payout = pred.potential_payout
        else:
            # Loser
            pred.status = "lost"
            pred.payout = 0
        
        pred.settled_at = datetime.now()
    
    # Update market
    market.status = "settled"
    market.settled_at = datetime.now()
    db.commit()
    db.refresh(market)
    
    return market

# ============================================================================
# Analytics Endpoints
# ============================================================================

@router.get("/stats", response_model=PredictionStats)
async def get_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user prediction statistics"""
    predictions = db.query(Prediction).filter(Prediction.username == user.username).all()
    
    total = len(predictions)
    wins = len([p for p in predictions if p.status == "won"])
    losses = len([p for p in predictions if p.status == "lost"])
    accuracy = (wins / total * 100) if total > 0 else 0.0
    
    total_wagered = sum(p.stake for p in predictions)
    total_won = sum(p.payout or 0 for p in predictions)
    net_profit = total_won - total_wagered
    
    # Calculate expected value (simplified)
    ev = None
    if total > 0:
        ev = (total_won - total_wagered) / total
    
    return PredictionStats(
        total_predictions=total,
        wins=wins,
        losses=losses,
        accuracy=round(accuracy, 2),
        total_wagered=total_wagered,
        total_won=total_won,
        net_profit=net_profit,
        expected_value=round(ev, 2) if ev is not None else None
    )

@router.get("/dashboard", response_model=UserDashboard)
async def get_dashboard(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user dashboard data"""
    wallet = db.query(VirtualWallet).filter(VirtualWallet.username == user.username).first()
    if not wallet:
        wallet = VirtualWallet(username=user.username, balance=1000)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    stats = await get_stats(user, db)
    
    recent_predictions = db.query(Prediction)\
        .filter(Prediction.username == user.username)\
        .order_by(desc(Prediction.created_at))\
        .limit(10)\
        .all()
    
    # Get leaderboard position
    leaderboard = db.query(Leaderboard)\
        .filter(Leaderboard.competition_type == "overall")\
        .order_by(desc(Leaderboard.score))\
        .all()
    
    position = None
    for idx, entry in enumerate(leaderboard, 1):
        if entry.username == user.username:
            position = idx
            break
    
    return UserDashboard(
        wallet=wallet,
        stats=stats,
        recent_predictions=recent_predictions,
        leaderboard_position=position
    )

# ============================================================================
# Leaderboard Endpoints
# ============================================================================

@router.get("/leaderboard", response_model=List[LeaderboardOut])
async def get_leaderboard(
    competition_type: str = "overall",
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get leaderboard"""
    entries = db.query(Leaderboard)\
        .filter(Leaderboard.competition_type == competition_type)\
        .order_by(desc(Leaderboard.score))\
        .limit(limit)\
        .all()
    
    # Update ranks
    for idx, entry in enumerate(entries, 1):
        entry.rank = idx
    
    db.commit()
    return entries


