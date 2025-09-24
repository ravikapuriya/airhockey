import type { BestOf } from './Save';

export class MatchManager {
  private p1Rounds = 0;
  private p2Rounds = 0;
  private toWin: number;

  constructor(bestOf: BestOf) {
    this.toWin = Math.floor(bestOf / 2) + 1;
  }

  awardRound(toPlayer: 1 | 2) {
    if (toPlayer === 1) this.p1Rounds++; else this.p2Rounds++;
  }

  isMatchOver() {
    return this.p1Rounds >= this.toWin || this.p2Rounds >= this.toWin;
  }

  winner(): 1 | 2 | null {
    if (this.p1Rounds >= this.toWin) return 1;
    if (this.p2Rounds >= this.toWin) return 2;
    return null;
  }

  getScore() { return { p1: this.p1Rounds, p2: this.p2Rounds, toWin: this.toWin }; }

  resetForNextRound() {}
}
