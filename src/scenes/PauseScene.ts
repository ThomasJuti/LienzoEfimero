import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { setMusicPaused } from '../audio/gameAudio';

interface PauseSceneData {
  parentKey: string;
}

/** Overlay launched on top of a paused level scene; ESC or click resumes it. */
export class PauseScene extends Phaser.Scene {
  private parentKey!: string;

  constructor() {
    super('PauseScene');
  }

  init(data: PauseSceneData): void {
    this.parentKey = data.parentKey;
  }

  create(): void {
    setMusicPaused(true);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'PAUSADO', {
        fontFamily: 'Georgia, serif',
        fontSize: '40px',
        color: '#f4ead2',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'ESC o click para continuar', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#cbb994',
      })
      .setOrigin(0.5);

    const resume = (): void => {
      setMusicPaused(false);
      this.scene.stop();
      this.scene.resume(this.parentKey);
    };

    this.input.once('pointerdown', resume);
    this.input.keyboard?.once('keydown-ESC', resume);
  }
}
