import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { resetLives } from '../state/gameState';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b0b12');

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'Sin vidas', {
        fontFamily: 'Georgia, serif',
        fontSize: '44px',
        color: '#f4ead2',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, 'El Coleccionista guarda sus secretos... por ahora.', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#cbb994',
      })
      .setOrigin(0.5);

    const retry = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'Reintentar', {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: '#0b0b12',
        backgroundColor: '#d8c692',
        padding: { x: 22, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    retry.on('pointerover', () => retry.setScale(1.05));
    retry.on('pointerout', () => retry.setScale(1));
    retry.once('pointerdown', () => {
      resetLives();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('Level1Scene');
      });
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}
