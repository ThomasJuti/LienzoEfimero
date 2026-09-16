import Phaser from 'phaser';
import { AssetKeys, AudioKeys } from '../config/assetKeys';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { playMusic, playSfx, stopMusic } from '../audio/gameAudio';

const EPILOGUE_TEXT =
  'En el vacío de su bóveda, El Coleccionista comprendió la verdad. El arte no se puede atrapar... solo se puede sentir.';

export class EpilogueScene extends Phaser.Scene {
  constructor() {
    super('EpilogueScene');
  }

  create(): void {
    playMusic(this, AudioKeys.MusicEnding);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, AssetKeys.Vineta5).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 130, GAME_WIDTH - 120, 190, 0x0b0b12, 0.78)
      .setStrokeStyle(2, 0xd8c692, 0.6);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 150, EPILOGUE_TEXT, {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#f4ead2',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 220 },
      })
      .setOrigin(0.5);

    const replay = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 62, 'Volver a jugar', {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: '#0b0b12',
        backgroundColor: '#d8c692',
        padding: { x: 22, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    replay.on('pointerover', () => replay.setScale(1.05));
    replay.on('pointerout', () => replay.setScale(1));
    replay.once('pointerdown', () => {
      playSfx(this, AudioKeys.Click);
      stopMusic();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('TitleScene');
      });
    });

    this.cameras.main.fadeIn(500, 255, 255, 255);
  }
}
