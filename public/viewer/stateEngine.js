/**
 * Replay state engine - processes events and updates player state.
 * Time-based, not frame-based, for accurate replay.
 */
export class ReplayState {
  constructor(players) {
    this.players = players;
    this.events = [];
    this.processedEvents = new Set();
    this.currentTime = 0;
    this.paused = false;
    this.playbackSpeed = 1.0;
  }

  load(events) {
    this.events = events.sort((a, b) => {
      const tA = this.getEventTime(a);
      const tB = this.getEventTime(b);
      return tA - tB;
    });
    this.currentTime = 0;
    this.processedEvents.clear();
  }

  getEventTime(event) {
    if (event.timestamp) {
      return new Date(event.timestamp).getTime() / 1000;
    }
    if (event.time !== undefined) {
      return event.time;
    }
    return 0;
  }

  update(dt) {
    if (this.paused || this.events.length === 0) return;

    this.currentTime += dt * this.playbackSpeed;
    const maxTime = this.getEventTime(this.events[this.events.length - 1]);

    // Process events up to current time
    for (const event of this.events) {
      const eventTime = this.getEventTime(event);
      const eventId = event.event_id || `${event.type}_${eventTime}`;

      if (eventTime <= this.currentTime && !this.processedEvents.has(eventId)) {
        this.apply(event);
        this.processedEvents.add(eventId);
      }
    }

    // Reset if we've passed the end
    if (this.currentTime > maxTime) {
      this.currentTime = maxTime;
    }
  }

  apply(event) {
    const type = event.event_type || event.type;
    const payload = event.payload || {};

    switch (type) {
      case "ROUND_START":
        // Reset players for new round
        this.players.getAllPlayers().forEach((p, i) => {
          const team = i < 5 ? "teamA" : "teamB";
          const spawnPos = team === "teamA" 
            ? [-80 + (i % 5) * 5, 0, -80]
            : [80 - (i % 5) * 5, 0, 80];
          this.players.spawn(`player_${i}`, spawnPos, team);
        });
        break;

      case "KILL":
        const killer = payload.killer || event.actor;
        const victim = payload.victim || event.target;
        if (victim) {
          this.players.kill(victim);
        }
        break;

      case "MOVE":
      case "POSITION_UPDATE":
        const playerId = event.actor || payload.player_id;
        const pos = payload.position || [0, 0, 0];
        if (playerId && pos) {
          this.players.move(playerId, pos);
        }
        break;

      case "SPAWN":
        const spawnId = event.actor || payload.player_id;
        const spawnPos = payload.position || [0, 0, 0];
        const team = payload.team || event.team || "teamA";
        if (spawnId) {
          this.players.spawn(spawnId, spawnPos, team);
        }
        break;

      case "ROUND_END":
        // Could add round end effects here
        break;
    }
  }

  seek(time) {
    this.currentTime = time;
    this.processedEvents.clear();
    
    // Replay all events up to this time
    for (const event of this.events) {
      const eventTime = this.getEventTime(event);
      if (eventTime <= time) {
        this.apply(event);
      } else {
        break;
      }
    }
  }

  togglePause() {
    this.paused = !this.paused;
  }

  reset() {
    this.currentTime = 0;
    this.processedEvents.clear();
    // Clear all players
    this.players.getAllPlayers().forEach((p, i) => {
      this.players.remove(`player_${i}`);
    });
  }

  getCurrentTime() {
    return this.currentTime;
  }

  getDuration() {
    if (this.events.length === 0) return 0;
    const lastTime = this.getEventTime(this.events[this.events.length - 1]);
    const firstTime = this.getEventTime(this.events[0]);
    return lastTime - firstTime;
  }
}


