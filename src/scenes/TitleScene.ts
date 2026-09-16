import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { resetLives } from '../state/gameState';

/**
 * Static title card with the "LIENZO EFÍMERO" logo and a painted "JUGAR"
 * plaque. An invisible hotspot sits over that plaque so a click starts
 * the intro.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    resetLives();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, AssetKeys.Title).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    const button = this.add
      .rectangle(640, 690, 240, 56, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => this.tweens.add({ targets: button, scale: 1.04, duration: 120 }));
    button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 120 }));
    button.once('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('IntroScene');
      });
    });
  }
}
