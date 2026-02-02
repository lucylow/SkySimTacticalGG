/**
 * Timeline controller for replay scrubbing and playback.
 */
export class Timeline {
  constructor(replay) {
    this.replay = replay;
  }

  seek(percent) {
    const duration = this.replay.getDuration();
    const time = (percent / 100) * duration;
    this.replay.seek(time);
  }

  getProgress() {
    const duration = this.replay.getDuration();
    if (duration === 0) return 0;
    return this.replay.getCurrentTime() / duration;
  }

  getCurrentTime() {
    return this.replay.getCurrentTime();
  }

  getDuration() {
    return this.replay.getDuration();
  }
}


