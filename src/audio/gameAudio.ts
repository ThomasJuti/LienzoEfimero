import Phaser from 'phaser';

/**
 * Game-level music + SFX helper. Sounds live on the Phaser Sound Manager
 * (not a scene), so a looping bed survives scene.start(). Music is started
 * from the first click (JUGAR) because browsers block autoplay.
 *
 * Assets: Kenney CC0 (RPG / Digital / UI / Interface) and Maximiliano
 * Stradex Ambient CC0, mirrored at cc0-sounds.exi.software.
 */

let music: Phaser.Sound.BaseSound | null = null;
let musicKey: string | null = null;

function whenUnlocked(scene: Phaser.Scene, fn: () => void): void {
  if (scene.sound.locked) {
    scene.sound.once('unlocked', fn);
    return;
  }
  fn();
}

export function playSfx(
  scene: Phaser.Scene,
  key: string,
  extra: Phaser.Types.Sound.SoundConfig = {},
): void {
  whenUnlocked(scene, () => {
    scene.sound.play(key, { volume: 0.28, ...extra });
  });
}

export function playMusic(scene: Phaser.Scene, key: string, volume = 0.22): void {
  whenUnlocked(scene, () => {
    if (musicKey === key && music && (music.isPlaying || music.isPaused)) {
      if (music.isPaused) {
        music.resume();
      }
      return;
    }
    music?.stop();
    music = scene.sound.add(key, { loop: true, volume });
    music.play();
    musicKey = key;
  });
}

export function stopMusic(): void {
  music?.stop();
  music = null;
  musicKey = null;
}

export function setMusicPaused(paused: boolean): void {
  if (!music) {
    return;
  }
  if (paused && music.isPlaying) {
    music.pause();
  } else if (!paused && music.isPaused) {
    music.resume();
  }
}
