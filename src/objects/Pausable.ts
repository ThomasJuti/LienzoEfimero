import Phaser from 'phaser';

/**
 * Wires ESC to pause `scene` and launch the shared PauseScene overlay on top
 * of it. The local `paused` flag (reset on this scene's own 'resume' event,
 * fired when PauseScene resumes it) guards against re-triggering regardless
 * of whether Phaser still delivers keyboard events to a paused scene.
 */
export function enablePause(scene: Phaser.Scene): void {
  let paused = false;

  scene.input.keyboard?.on('keydown-ESC', () => {
    if (paused) {
      return;
    }
    paused = true;
    scene.scene.pause();
    scene.scene.launch('PauseScene', { parentKey: scene.scene.key });
  });

  scene.events.on('resume', () => {
    paused = false;
  });
}
