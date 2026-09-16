import Phaser from 'phaser';
import { getLives, MAX_LIVES } from '../state/gameState';

const FULL = '♥';
const EMPTY = '♡';

/** Fixed top-left heart readout. Call `refresh()` after loseLife(). */
export class LivesHud {
  private readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(24, 24, LivesHud.render(), {
        fontFamily: 'Georgia, serif',
        fontSize: '26px',
        color: '#ff5da2',
      })
      .setScrollFactor(0)
      .setDepth(60);
  }

  refresh(): void {
    this.text.setText(LivesHud.render());
  }

  private static render(): string {
    const lives = getLives();
    return FULL.repeat(lives) + EMPTY.repeat(Math.max(0, MAX_LIVES - lives));
  }
}
