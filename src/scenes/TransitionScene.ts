import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { AudioKeys } from '../config/assetKeys';
import { playSfx } from '../audio/gameAudio';

export interface TransitionSceneData {
  texture: string;
  text: string;
  next: string;
}

/**
 * One-shot narrative beat shown between levels: a single illustration with a
 * caption, advancing to `next` on click. Mirrors IntroScene's slide styling
 * so the two feel like the same storytelling device.
 */
export class TransitionScene extends Phaser.Scene {
  private data_!: TransitionSceneData;
  private advancing = false;

  constructor() {
    super('TransitionScene');
  }

  init(data: TransitionSceneData): void {
    this.data_ = data;
    this.advancing = false;
  }

  create(): void {
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.data_.texture)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 110, GAME_WIDTH - 120, 160, 0x0b0b12, 0.78)
      .setStrokeStyle(2, 0xd8c692, 0.6);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 118, this.data_.text, {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#f4ead2',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 200 },
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH - 60, GAME_HEIGHT - 40, 'Click para continuar ▸', {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#cbb994',
      })
      .setOrigin(1, 0.5)
      .setAlpha(0.8);

    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.input.once('pointerdown', () => this.advance());
  }

  private advance(): void {
    if (this.advancing) {
      return;
    }
    this.advancing = true;
    playSfx(this, AudioKeys.Click);

    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(this.data_.next);
    });
  }
}
