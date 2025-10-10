 // PUBLIC_INTERFACE
export class GameState {
  /** Holds score, lives, pause, and game over state. */
  constructor() {
    this.score = 0;
    this.lives = 3;
    this.paused = false;
    this.gameOver = false;
  }

  // PUBLIC_INTERFACE
  addScore(n = 1) {
    this.score += n;
  }

  // PUBLIC_INTERFACE
  loseLife() {
    this.lives -= 1;
    if (this.lives <= 0) {
      this.lives = 0;
      this.gameOver = true;
    }
  }

  // PUBLIC_INTERFACE
  reset() {
    this.score = 0;
    this.lives = 3;
    this.paused = false;
    this.gameOver = false;
  }
}
