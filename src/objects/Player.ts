import Phaser from 'phaser';
import { AssetKeys, WalkAnimKey, CrouchWalkAnimKey } from '../config/assetKeys';
import {
  GRAVITY_Y,
  JUMP_VELOCITY,
  MOVE_SPEED,
  PLAYER_BODY_FRAME_HEIGHT,
  PLAYER_BODY_FRAME_WIDTH,
  PLAYER_CROUCH_BODY_HEIGHT,
  PLAYER_SCALE,
} from '../config/constants';

// Walk spritesheet frame indices (row0: walk cycle, row1: crouch/takeoff/apex/land).
const FRAME_CROUCH = 4;
const FRAME_TAKEOFF = 5;
const FRAME_APEX = 6;
const FRAME_LAND = 7;

interface PlayerKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  altLeft: Phaser.Input.Keyboard.Key;
  altRight: Phaser.Input.Keyboard.Key;
  altUp: Phaser.Input.Keyboard.Key;
  altDown: Phaser.Input.Keyboard.Key;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly keys: PlayerKeys;
  private crouching = false;
  private locked = false;
  private facingLeft = false;
  private jumpsUsed = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKeys.LienzoActions, 'idle');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.setScale(PLAYER_SCALE);
    this.setDepth(10);
    this.setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.applyBodySize();
    body.setGravityY(GRAVITY_Y);
    body.setMaxVelocityY(1400);
    // The body's dynamic scale sync only kicks in starting from the physics
    // step after creation — a same-tick re-call (or a delayedCall(0), which
    // Phaser also resolves within the current tick) still sees the stale,
    // unscaled size. Hooking the scene's own per-frame 'update' event is the
    // first point guaranteed to run on a later tick.
    scene.events.once(Phaser.Scenes.Events.UPDATE, () => this.applyBodySize());

    // Keyboard input is enabled in the game config, so this plugin always exists.
    const keyboard = scene.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin;
    const codes = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: keyboard.addKey(codes.LEFT),
      right: keyboard.addKey(codes.RIGHT),
      up: keyboard.addKey(codes.UP),
      down: keyboard.addKey(codes.DOWN),
      jump: keyboard.addKey(codes.SPACE),
      altLeft: keyboard.addKey(codes.A),
      altRight: keyboard.addKey(codes.D),
      altUp: keyboard.addKey(codes.W),
      altDown: keyboard.addKey(codes.S),
    };
  }

  get isCrouching(): boolean {
    return this.crouching;
  }

  /** A point roughly at chest height (or near the feet while crouching), used by camera cones. */
  getDetectionY(): number {
    return this.y - (this.crouching ? 22 : 92);
  }

  get isLocked(): boolean {
    return this.locked;
  }

  lock(): void {
    this.locked = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
  }

  unlock(): void {
    this.locked = false;
  }

  /**
   * setSize() takes raw, frame-local pixels and multiplies by the
   * GameObject's current scale internally; `true` recenters the resulting
   * box on whichever frame is active. Shrinks to PLAYER_CROUCH_BODY_HEIGHT
   * while crouching so the SecurityCamera duck-under actually has a smaller
   * target to miss; every other pose uses the standing box.
   */
  private applyBodySize(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const height = this.crouching ? PLAYER_CROUCH_BODY_HEIGHT : PLAYER_BODY_FRAME_HEIGHT;
    body.setSize(PLAYER_BODY_FRAME_WIDTH, height, true);
  }

  update(): void {
    if (this.locked) {
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    const left = this.keys.left.isDown || this.keys.altLeft.isDown;
    const right = this.keys.right.isDown || this.keys.altRight.isDown;
    const down = this.keys.down.isDown || this.keys.altDown.isDown;
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
      Phaser.Input.Keyboard.JustDown(this.keys.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.altUp);

    // Sticky on purpose: resizing the body for the crouch pose can cost it
    // ground contact for a single physics step (onGround flickers false),
    // which — if crouching un-set itself from that alone — snaps the body
    // back to full height while still low against the floor, gets shoved
    // out by the overlap, and immediately re-triggers crouch since `down`
    // is still held. That loop is what looked like crouch+jump firing
    // together. Requiring onGround only to *start* crouching, not to hold
    // it, breaks the feedback loop.
    this.crouching = down && (onGround || this.crouching);

    // Crouching no longer locks horizontal movement — it's a smaller
    // profile you can shuffle around in, not a stationary pose.
    if (left && !right) {
      body.setVelocityX(-MOVE_SPEED);
      this.facingLeft = true;
    } else if (right && !left) {
      body.setVelocityX(MOVE_SPEED);
      this.facingLeft = false;
    } else {
      body.setVelocityX(0);
    }

    if (onGround) {
      this.jumpsUsed = 0;
    }

    // Ground jump (jumpsUsed 0→1) plus one air jump (1→2); crouching still
    // blocks jumping outright, same as before.
    if (jumpPressed && !this.crouching && this.jumpsUsed < 2) {
      body.setVelocityY(JUMP_VELOCITY);
      this.jumpsUsed += 1;
    }

    this.setFlipX(this.facingLeft);
    this.updateVisual(onGround);
  }

  private updateVisual(onGround: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.crouching) {
      if (Math.abs(body.velocity.x) > 5) {
        if (this.texture.key !== AssetKeys.LienzoCrouchWalk || !this.anims.isPlaying) {
          this.setTexture(AssetKeys.LienzoCrouchWalk);
          this.play(CrouchWalkAnimKey, true);
          this.applyBodySize();
        }
      } else {
        this.setPose(AssetKeys.LienzoWalk, FRAME_CROUCH);
      }
      return;
    }

    if (!onGround) {
      if (body.velocity.y < -180) {
        this.setPose(AssetKeys.LienzoWalk, FRAME_TAKEOFF);
      } else if (body.velocity.y < 180) {
        this.setPose(AssetKeys.LienzoWalk, FRAME_APEX);
      } else {
        this.setPose(AssetKeys.LienzoWalk, FRAME_LAND);
      }
      return;
    }

    if (Math.abs(body.velocity.x) > 5) {
      if (this.texture.key !== AssetKeys.LienzoWalkV2 || !this.anims.isPlaying) {
        this.setTexture(AssetKeys.LienzoWalkV2);
        this.play(WalkAnimKey, true);
        this.applyBodySize();
      }
      return;
    }

    this.setPose(AssetKeys.LienzoActions, 'idle');
  }

  private setPose(textureKey: string, frame: string | number): void {
    if (this.anims.isPlaying) {
      this.anims.stop();
    }
    if (this.texture.key !== textureKey || this.frame.name !== String(frame)) {
      this.setTexture(textureKey, frame);
      this.applyBodySize();
    }
  }

  /** Plays the "restaurar" (paintbrush cast) pose, locking input for `holdMs`. */
  cast(holdMs: number, onComplete?: () => void): void {
    this.locked = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.anims.stop();
    this.setTexture(AssetKeys.LienzoActions, 'cast');
    this.applyBodySize();
    this.scene.time.delayedCall(holdMs, () => {
      this.locked = false;
      if (onComplete) {
        onComplete();
      }
    });
  }

  /** Plays the hurt pose, briefly locks input, and calls back once the flinch ends. */
  hurt(onComplete?: () => void): void {
    this.locked = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.anims.stop();
    this.setTexture(AssetKeys.LienzoActions, 'hurt');
    this.applyBodySize();
    this.setTint(0xff8888);
    this.scene.time.delayedCall(450, () => {
      this.clearTint();
      this.locked = false;
      if (onComplete) {
        onComplete();
      }
    });
  }
}
