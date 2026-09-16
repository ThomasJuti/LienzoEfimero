export const MAX_LIVES = 3;

let lives = MAX_LIVES;

/** Called when a new playthrough starts (TitleScene) so lives don't carry over from a Game Over. */
export function resetLives(): void {
  lives = MAX_LIVES;
}

/** Returns the remaining life count after the loss. */
export function loseLife(): number {
  lives = Math.max(0, lives - 1);
  return lives;
}

export function getLives(): number {
  return lives;
}
