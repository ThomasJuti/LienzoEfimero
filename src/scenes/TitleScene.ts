import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { resetLives } from '../state/gameState';

/**
 * The title background is a looping ambient video (trimmed to the clean
 * loop before its source clip's cursor/click overlay kicks in) with the
 * "LIENZO EFÍMERO" logo and a "JUGAR" button painted into the footage. This
 * scene just overlays an invisible, interactive hotspot over that button's
 * on-frame position (measured by eye against the 1280x720 source) so a
 * click starts the intro.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    resetLives();

    const bgVideo = this.add.video(GAME_WIDTH / 2, GAME_HEIGHT / 2, AssetKeys.TitleVideo);
    // Video dimensions aren't known until the first real frame arrives —
    // Phaser resets the GameObject's size to the native frame size right
    // before firing VIDEO_CREATED, so setDisplaySize() called any earlier
    // (e.g. right after add.video()) computes its scale against a stale
    // placeholder size and renders zoomed/cropped once the real size lands.
    bgVideo.once(Phaser.GameObjects.Events.VIDEO_CREATED, () => {
      bgVideo.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    });
    bgVideo.play(true);

    const button = this.add
      .rectangle(640, 690, 320, 70, 0x000000, 0)
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
