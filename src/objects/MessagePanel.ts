import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys';

/**
 * Shows a full-screen dim overlay with the marco-mensaje frame and a centered
 * message. Fixed to the camera (ignores scroll) so it works in scrolling
 * levels. Dismisses on click/tap, then calls `onDismiss`.
 */
export function showMessagePanel(scene: Phaser.Scene, message: string, onDismiss: () => void): void {
  const width = scene.scale.width;
  const height = scene.scale.height;
  const cx = width / 2;
  const cy = height / 2;

  const overlay = scene.add
    .rectangle(cx, cy, width, height, 0x000000, 0.5)
    .setDepth(90)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

  const frame = scene.add.image(cx, cy, AssetKeys.MessageFrame).setDepth(91).setScrollFactor(0);
  frame.setDisplaySize(Math.min(720, width * 0.65), Math.min(405, height * 0.65));

  const text = scene.add
    .text(cx, cy - 10, message, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '26px',
      color: '#f2e6c8',
      align: 'center',
      wordWrap: { width: frame.displayWidth * 0.72 },
    })
    .setOrigin(0.5)
    .setDepth(92)
    .setScrollFactor(0);

  const hint = scene.add
    .text(cx, cy + frame.displayHeight * 0.32, 'Click para continuar', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#cbb994',
    })
    .setOrigin(0.5)
    .setDepth(92)
    .setScrollFactor(0)
    .setAlpha(0.85);

  const dismiss = (): void => {
    overlay.destroy();
    frame.destroy();
    text.destroy();
    hint.destroy();
    onDismiss();
  };

  overlay.once('pointerdown', dismiss);
}
