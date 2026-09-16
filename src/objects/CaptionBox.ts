import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { AudioKeys } from '../config/assetKeys';
import { playSfx } from '../audio/gameAudio';

/**
 * Bottom caption bar matching IntroScene / TransitionScene: a dim gold-stroked
 * box over the live scene, camera-fixed so it works in scrolling levels.
 * Click advances through `messages`, then calls `onDone`.
 */
export function showCaptionSequence(scene: Phaser.Scene, messages: string[], onDone: () => void): void {
  const box = scene.add
    .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 110, GAME_WIDTH - 120, 160, 0x0b0b12, 0.78)
    .setStrokeStyle(2, 0xd8c692, 0.6)
    .setDepth(90)
    .setScrollFactor(0);

  const caption = scene.add
    .text(GAME_WIDTH / 2, GAME_HEIGHT - 118, messages[0], {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#f4ead2',
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 200 },
    })
    .setOrigin(0.5)
    .setDepth(91)
    .setScrollFactor(0);

  const hint = scene.add
    .text(GAME_WIDTH - 60, GAME_HEIGHT - 40, 'Click para continuar ▸', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#cbb994',
    })
    .setOrigin(1, 0.5)
    .setAlpha(0.8)
    .setDepth(91)
    .setScrollFactor(0);

  const hit = scene.add
    .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
    .setDepth(89)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

  let index = 0;
  let locked = false;

  hit.on('pointerdown', () => {
    if (locked) {
      return;
    }
    playSfx(scene, AudioKeys.Click);
    locked = true;
    index += 1;
    if (index >= messages.length) {
      hit.destroy();
      box.destroy();
      caption.destroy();
      hint.destroy();
      onDone();
      return;
    }
    caption.setText(messages[index]);
    scene.time.delayedCall(90, () => {
      locked = false;
    });
  });
}
