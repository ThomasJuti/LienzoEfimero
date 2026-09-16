import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys';

export type CameraFacing = 'left' | 'right';

export interface SecurityCameraOptions {
  coneLength?: number;
  halfSpreadDeg?: number;
  sweepAmplitudeDeg?: number;
}

const DEFAULTS: Required<SecurityCameraOptions> = {
  coneLength: 340,
  halfSpreadDeg: 20,
  sweepAmplitudeDeg: 8,
};

/**
 * A wall-mounted security camera with a fan-shaped detection cone drawn at
 * roughly chest height across the walkway. Crouching moves the player's
 * detection point down near their feet, letting them duck under the beam.
 */
export class SecurityCamera {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly cone: Phaser.GameObjects.Graphics;
  private readonly originX: number;
  private readonly originY: number;
  private readonly baseAngleDeg: number;
  private readonly opts: Required<SecurityCameraOptions>;
  private triangle: Phaser.Geom.Triangle | null = null;
  private active = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    facing: CameraFacing,
    options: SecurityCameraOptions = {},
  ) {
    this.opts = { ...DEFAULTS, ...options };
    // The cone must originate at the camera's own sprite position — a separate
    // fixed detection Y previously left the beam floating, disconnected from
    // the icon players actually see on the wall.
    this.originX = x;
    this.originY = y;
    this.baseAngleDeg = facing === 'right' ? 0 : 180;

    const frame = facing === 'right' ? 0 : 1;
    this.sprite = scene.add.sprite(x, y, AssetKeys.SecurityCamera, frame).setScale(0.22).setDepth(6);

    this.cone = scene.add.graphics().setDepth(5);
    this.redrawCone(0);
  }

  disable(): void {
    this.active = false;
    this.cone.clear();
    this.triangle = null;
  }

  update(time: number): void {
    if (!this.active) {
      return;
    }
    this.redrawCone(time);
  }

  detects(px: number, py: number): boolean {
    if (!this.active || !this.triangle) {
      return false;
    }
    return Phaser.Geom.Triangle.Contains(this.triangle, px, py);
  }

  private redrawCone(time: number): void {
    const sweep = Math.sin(time / 900) * this.opts.sweepAmplitudeDeg;
    const angle = this.baseAngleDeg + sweep;
    const a1 = Phaser.Math.DegToRad(angle - this.opts.halfSpreadDeg);
    const a2 = Phaser.Math.DegToRad(angle + this.opts.halfSpreadDeg);

    const p1x = this.originX + Math.cos(a1) * this.opts.coneLength;
    const p1y = this.originY + Math.sin(a1) * this.opts.coneLength;
    const p2x = this.originX + Math.cos(a2) * this.opts.coneLength;
    const p2y = this.originY + Math.sin(a2) * this.opts.coneLength;

    this.triangle = new Phaser.Geom.Triangle(this.originX, this.originY, p1x, p1y, p2x, p2y);

    this.cone.clear();
    this.cone.fillStyle(0xff2b2b, 0.22);
    this.cone.beginPath();
    this.cone.moveTo(this.originX, this.originY);
    this.cone.lineTo(p1x, p1y);
    this.cone.lineTo(p2x, p2y);
    this.cone.closePath();
    this.cone.fillPath();
  }
}
