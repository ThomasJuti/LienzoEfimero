import Phaser from 'phaser';
import { AssetKeys, AudioKeys, TitleAnimKey } from '../config/assetKeys';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { resetLives } from '../state/gameState';
import { playMusic, playSfx } from '../audio/gameAudio';

/**
 * Looping title card (GIF converted to a 20-frame spritesheet) with a painted
 * "JUGAR" plaque. An invisible hotspot sits over that plaque so a click
 * starts the intro.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    resetLives();

    this.add
      .sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, AssetKeys.Title)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .play(TitleAnimKey);

    const button = this.add
      .rectangle(640, 690, 240, 56, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => this.tweens.add({ targets: button, scale: 1.04, duration: 120 }));
    button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 120 }));
    button.once('pointerdown', () => {
      playSfx(this, AudioKeys.Click);
      playMusic(this, AudioKeys.MusicTitle);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('IntroScene');
      });
    });
  }
}
