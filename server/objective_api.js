const fastify = require('fastify')({ logger: true });
const { LolObjectiveEngine } = require('../src/services/LolObjectiveEngine');

// Sample database client
const db = {
  async getLatestState(matchId, timestamp) {
    // In a real app, this would query the SQL functions defined in objective_features.sql
    return {
      objective: 'BARON',
      timeToSpawn: 0,
      matchTime: timestamp,
      teamGoldDiff: -900,
      allyCountNear: 4,
      enemyCountNear: 2,
      visionInPit: 3,
      enemyVisionInPit: 0,
      ultimatesUp: 4,
      enemyUltimatesUp: 2,
      smiteReady: true,
      enemySmiteReady: false,
      sidelanePressure: true,
      playerHpPercent: 85
    };
  }
};

const engine = new LolObjectiveEngine();

fastify.get('/api/v1/decision/objective', async (request, reply) => {
  const { matchId, timestamp } = request.query;
  
  if (!matchId || !timestamp) {
    return reply.status(400).send({ error: 'matchId and timestamp are required' });
  }

  try {
    const state = await db.getLatestState(matchId, parseFloat(timestamp));
    let decision;

    if (state.objective === 'BARON') {
      decision = engine.decideBaron(state);
    } else {
      decision = engine.decideDragon(state);
    }

    return {
      matchId,
      timestamp,
      state,
      decision
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Objective Decision API listening on port 3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// start(); // Uncomment to run
module.exports = fastify;

