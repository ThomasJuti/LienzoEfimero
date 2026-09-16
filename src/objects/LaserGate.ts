import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys';

export type LaserOrientation = 'horizontal' | 'vertical';

export interface LaserGateOptions {
  onMs?: number;
  offMs?: number;
  startDelayMs?: number;
  thickness?: number;
}

const DEFAULTS: Required<LaserGateOptions> = {
  onMs: 1500,
  offMs: 1100,
  startDelayMs: 0,
  thickness: 16,
};

/**
 * A laser hazard between two points. When "on" it renders as a solid beam and
 * carries a static overlap body; when "off" it renders as a dotted telegraph
 * line and the body is disabled, so the gap is safe to cross.
 */
export class LaserGate {
  readonly hazard: Phaser.GameObjects.Rectangle;
  private readonly scene: Phaser.Scene;
  private readonly beamOn: Phaser.GameObjects.Sprite;
  private readonly beamOff: Phaser.GameObjects.Sprite;
  private readonly emitterA: Phaser.GameObjects.Sprite;
  private readonly emitterB: Phaser.GameObjects.Sprite;
  private readonly opts: Required<LaserGateOptions>;
  private on = true;
  private stopped = false;

  constructor(
    scene: Phaser.Scene,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    orientation: LaserOrientation,
    options: LaserGateOptions = {},
  ) {
    this.scene = scene;
    this.opts = { ...DEFAULTS, ...options };

    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const length = orientation === 'horizontal' ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
    const thickness = this.opts.thickness;

    this.beamOn = scene.add.sprite(cx, cy, AssetKeys.LaserHazards, 'beam-h').setDepth(4);
    this.beamOff = scene.add.sprite(cx, cy, AssetKeys.LaserHazards, 'beam-dotted').setDepth(4);

    if (orientation === 'horizontal') {
      this.beamOn.setDisplaySize(length, thickness);
      this.beamOff.setDisplaySize(length, thickness);
    } else {
      // Rotate the horizontal beam/dotted art 90deg to span a vertical gap.
      this.beamOn.setRotation(Phaser.Math.DegToRad(90)).setDisplaySize(length, thickness);
      this.beamOff.setRotation(Phaser.Math.DegToRad(90)).setDisplaySize(length, thickness);
    }

    this.emitterA = scene.add.sprite(x1, y1, AssetKeys.LaserHazards, 'emitter').setDepth(5).setScale(0.11);
    this.emitterB = scene.add.sprite(x2, y2, AssetKeys.LaserHazards, 'emitter').setDepth(5).setScale(0.11);
    if (orientation === 'vertical') {
      // Default art points right (+x); rotate to point into the beam at each end.
      this.emitterA.setRotation(Phaser.Math.DegToRad(90)); // top emitter points down
      this.emitterB.setRotation(Phaser.Math.DegToRad(-90)); // bottom emitter points up
    } else {
      this.emitterB.setFlipX(true); // right-hand emitter points left, into the beam
    }

    const hazardW = orientation === 'horizontal' ? length : thickness;
    const hazardH = orientation === 'horizontal' ? thickness : length;
    this.hazard = scene.add.rectangle(cx, cy, hazardW, hazardH, 0xffffff, 0).setVisible(false);
    scene.physics.add.existing(this.hazard, true);

    this.applyState();
    this.scene.time.delayedCall(this.opts.startDelayMs, () => this.scheduleNext());
  }

  /** Forces the laser off and stops future toggling (used for the climax freeze). */
  stop(): void {
    this.stopped = true;
    this.on = false;
    this.applyState();
  }

  private scheduleNext(): void {
    if (this.stopped) {
      return;
    }
    const delay = this.on ? this.opts.onMs : this.opts.offMs;
    this.scene.time.delayedCall(delay, () => {
      if (this.stopped) {
        return;
      }
      this.on = !this.on;
      this.applyState();
      this.scheduleNext();
    });
  }

  private applyState(): void {
    this.beamOn.setVisible(this.on);
    this.beamOff.setVisible(!this.on);
    const body = this.hazard.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = this.on;
  }
}
