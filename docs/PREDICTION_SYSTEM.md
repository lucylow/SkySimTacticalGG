# Non-Monetary Esports Prediction System

## Overview

This is a **non-monetary** prediction and fantasy platform for esports matches. Users can:
- Place virtual currency predictions on match outcomes
- Track their prediction accuracy and statistics
- Compete on leaderboards
- Learn about probability and expected value

**Important**: This system uses virtual currency only. No real money is involved.

## Features

### Core Features
- **Virtual Wallet**: Each user starts with 1000 virtual coins
- **Prediction Markets**: Place predictions on match winners, map winners, MVP, etc.
- **Fixed & Pool Odds**: Support for both fixed odds and pool-based markets
- **Daily Limits**: Maximum 1000 coins wagered per day (safety feature)
- **Leaderboards**: Compete with other users
- **Statistics**: Track accuracy, expected value, and performance

### Safety Features
- Daily wagering limits (1000 coins/day)
- Immutable transaction ledger
- Clear disclaimers about non-monetary nature
- Age-appropriate design

## API Endpoints

### Wallet
- `GET /predictions/wallet` - Get user wallet
- `POST /predictions/wallet/topup` - Add virtual currency (max 1000/day)
- `GET /predictions/wallet/transactions` - Transaction history

### Markets
- `GET /predictions/markets` - List available markets
- `GET /predictions/markets/{id}` - Get market details
- `POST /predictions/markets` - Create market (admin)

### Predictions
- `POST /predictions/predictions` - Place a prediction
- `GET /predictions/predictions` - List user predictions
- `GET /predictions/predictions/{id}` - Get prediction details
- `POST /predictions/predictions/{id}/cancel` - Cancel pending prediction

### Analytics
- `GET /predictions/stats` - User statistics
- `GET /predictions/dashboard` - Dashboard data
- `GET /predictions/leaderboard` - Leaderboard

### Admin
- `POST /predictions/markets/{id}/settle` - Settle a market

## Database Schema

### VirtualWallet
- User's virtual currency balance
- Tracks total earned/wagered
- Daily limit tracking

### WalletTransaction
- Immutable ledger of all transactions
- Tracks balance changes
- Reference to related predictions

### PredictionMarket
- Available markets for predictions
- Supports fixed odds and pool-based
- Tracks market status (open/closed/settled)

### Prediction
- User predictions
- Links to markets
- Tracks stake, odds, payout
- Status: pending/won/lost/cancelled

### FantasyTeam
- User fantasy team rosters
- Player selections
- Points tracking

### Leaderboard
- Competition rankings
- Score tracking
- Accuracy metrics

## Usage

### Creating a Market

```python
from app.api_predictions import create_market
from app.schemas_predictions import PredictionMarketCreate, MarketType

market = PredictionMarketCreate(
    match_id="match_123",
    market_type=MarketType.MATCH_WINNER,
    odds_type="fixed",
    odds={"TeamA": 1.5, "TeamB": 2.0}
)
```

### Placing a Prediction

```typescript
import { predictionsApi } from "@/services/predictionsApi";

await predictionsApi.createPrediction({
  market_id: 1,
  selection: "TeamA",
  stake: 100
});
```

### Settling a Market

```python
settlement = MarketSettlement(
    market_id=1,
    winning_selection="TeamA"
)
await settle_market(1, settlement)
```

## Frontend Components

### Pages
- `/app/predictions` - Main predictions page

### Components
- `WalletCard` - Display wallet balance and top-up
- `MarketList` - List available markets
- `PredictionForm` - Form to place predictions
- `PredictionHistory` - User's prediction history
- `PredictionStatsCard` - Statistics display
- `Leaderboard` - Leaderboard component

## Authentication

The system uses the existing auth system. Users need to be authenticated to:
- Place predictions
- View their wallet
- Access leaderboards

Token format: `Bearer <token>` in Authorization header.

## Safety & Legal

### Non-Monetary Design
- All currency is virtual
- No real-world value
- Cannot be exchanged for money
- Educational/entertainment purposes only

### Responsible Features
- Daily limits prevent excessive use
- Clear disclaimers
- Age-appropriate design
- No payment integration

### Future Considerations
If you ever consider adding real-money features:
1. **STOP** and consult legal counsel
2. Gambling laws vary by jurisdiction
3. Requires proper licensing
4. Age verification required
5. Responsible gambling features mandatory

## Development

### Setup

1. Database migrations run automatically on startup
2. Users get 1000 coins on first wallet access
3. Markets can be created via API or admin UI

### Testing

```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# Start frontend
npm run dev
```

### Example Flow

1. User visits `/app/predictions`
2. Wallet is created automatically (1000 coins)
3. User views available markets
4. User places prediction (e.g., 100 coins on TeamA)
5. Wallet debited, prediction created
6. When match ends, admin settles market
7. Winners receive payout, losers lose stake
8. Leaderboard updates

## Integration with Match Data

The system is designed to integrate with your existing match data:
- Use `match_id` from your Grid events
- Create markets when matches start
- Settle markets when matches end
- Link to your existing match analysis

## Future Enhancements

- Fantasy team drafting
- Tournament brackets
- Social features (friend challenges)
- Learning mode with EV explanations
- Achievement system
- WebSocket live updates


