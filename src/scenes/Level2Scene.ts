import Phaser from 'phaser';
import { AssetKeys, AudioKeys } from '../config/assetKeys';
import { GAME_HEIGHT } from '../config/constants';
import { Player } from '../objects/Player';
import { SecurityCamera } from '../objects/SecurityCamera';
import { LaserGate } from '../objects/LaserGate';
import { showMessagePanel } from '../objects/MessagePanel';
import { LivesHud } from '../objects/LivesHud';
import { enablePause } from '../objects/Pausable';
import { loseLife } from '../state/gameState';
import { playMusic, playSfx } from '../audio/gameAudio';

const LEVEL_WIDTH = 2600;
// This level's floor sits lower than the shared GROUND_Y — the gallery
// background has no distinct floor band, so the walkway is pinned close to
// the bottom of the screen instead of floating over ~80px of bare wall.
const LEVEL2_GROUND_Y = GAME_HEIGHT - 20;
// The cone originates at this same Y (see SecurityCamera), so it stays low
// enough that a crouching player's detection point (~floorY - 22) never
// falls inside it, while a standing player's (~floorY - 92) does for the
// outer half of the approach — verified against the cone's fixed 20°/340px
// spread (see the git history for the numeric check).
const CAMERA_MOUNT_Y = LEVEL2_GROUND_Y - 160;
const GATE_TOP_Y = LEVEL2_GROUND_Y - 260;

interface CameraSpot {
  x: number;
  facing: 'left' | 'right';
  coneLength: number;
  sweepAmplitudeDeg: number;
}

// Alternating facings and varied cone reach/sweep so each camera reads
// differently instead of four identical copies — two duck zones before the
// gate, two after, ramping up toward the final stretch.
const CAMERA_SPOTS: CameraSpot[] = [
  { x: 450, facing: 'left', coneLength: 340, sweepAmplitudeDeg: 8 },
  { x: 950, facing: 'right', coneLength: 300, sweepAmplitudeDeg: 12 },
  { x: 1900, facing: 'left', coneLength: 380, sweepAmplitudeDeg: 6 },
  { x: 2350, facing: 'right', coneLength: 320, sweepAmplitudeDeg: 14 },
];

const GATE_X = 1400;

export class Level2Scene extends Phaser.Scene {
  private player!: Player;
  private cameras_: SecurityCamera[] = [];
  private gate!: LaserGate;
  private livesHud!: LivesHud;
  private won = false;
  private resetting = false;
  private checkpoint = { x: 100, y: LEVEL2_GROUND_Y };

  constructor() {
    super('Level2Scene');
  }

  init(): void {
    this.won = false;
    this.resetting = false;
    this.cameras_ = [];
    this.checkpoint = { x: 100, y: LEVEL2_GROUND_Y };
  }

  create(): void {
    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);

    const bgScale = GAME_HEIGHT / 512;
    this.add
      .tileSprite(0, 0, LEVEL_WIDTH, GAME_HEIGHT, AssetKeys.Bg2)
      .setOrigin(0, 0)
      .setTileScale(bgScale, bgScale);

    const ground = this.add.rectangle(LEVEL_WIDTH / 2, LEVEL2_GROUND_Y + 60, LEVEL_WIDTH, 120, 0x000000, 0);
    this.physics.add.existing(ground, true);

    this.player = new Player(this, this.checkpoint.x, this.checkpoint.y);
    this.physics.add.collider(this.player, ground);

    for (const spot of CAMERA_SPOTS) {
      this.cameras_.push(
        new SecurityCamera(this, spot.x, CAMERA_MOUNT_Y, spot.facing, {
          coneLength: spot.coneLength,
          sweepAmplitudeDeg: spot.sweepAmplitudeDeg,
        }),
      );
    }

    // The middle checkpoint: a camera-triggered barrier, not a duckable cone
    // — floor-to-ceiling, impassable while lit, blocked longer than it's
    // open so waiting for the safe window is a real decision, not a formality.
    this.add.sprite(GATE_X, CAMERA_MOUNT_Y, AssetKeys.SecurityCamera, 0).setScale(0.24).setDepth(6);
    this.gate = new LaserGate(this, GATE_X, GATE_TOP_Y, GATE_X, LEVEL2_GROUND_Y, 'vertical', {
      onMs: 2200,
      offMs: 1200,
      startDelayMs: 500,
    });
    this.physics.add.overlap(this.player, this.gate.hazard, () => this.onHazardHit());

    const obra = this.add
      .image(LEVEL_WIDTH - 120, LEVEL2_GROUND_Y, AssetKeys.ObraInspiracionGris)
      .setOrigin(0.5, 1)
      .setDisplaySize(150, 150)
      .setDepth(8);
    this.physics.add.existing(obra, true);
    this.physics.add.overlap(this.player, obra, () => this.onReachObra(obra));

    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.livesHud = new LivesHud(this);
    enablePause(this);
    playMusic(this, AudioKeys.MusicGame);

    this.player.lock();
    showMessagePanel(
      this,
      'Las cámaras detectan a la altura del pecho — agachate (ABAJO / S) para esquivarlas. ESC: pausa.\nLa barrera del medio es infranqueable mientras esté encendida: esperá a que se apague.',
      () => this.player.unlock(),
    );
  }

  update(time: number): void {
    this.player.update();

    let detected = false;
    for (const cam of this.cameras_) {
      cam.update(time);
      if (cam.detects(this.player.x, this.player.getDetectionY())) {
        detected = true;
      }
    }

    if (detected && !this.resetting && !this.won && !this.player.isLocked) {
      this.onHazardHit();
      return;
    }

    if (!this.resetting && !this.won) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      const onGround = body.blocked.down || body.touching.down;
      if (onGround && this.player.x > this.checkpoint.x + 30) {
        this.checkpoint = { x: this.player.x, y: LEVEL2_GROUND_Y };
      }
    }
  }

  private onHazardHit(): void {
    if (this.resetting || this.won || this.player.isLocked) {
      return;
    }
    this.resetting = true;
    playSfx(this, AudioKeys.Alert);
    const remaining = loseLife();
    this.livesHud.refresh();

    this.player.hurt(() => {
      if (remaining <= 0) {
        this.scene.start('GameOverScene');
        return;
      }
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.reset(this.checkpoint.x, this.checkpoint.y);
      // Brief grace period before hazards can hit again — see Level3Scene's
      // onLaserHit for why this matters (checkpoint can land close enough
      // to a hazard to chain a second life loss off one mistake).
      this.time.delayedCall(500, () => {
        this.resetting = false;
      });
    });
  }

  private onReachObra(obra: Phaser.GameObjects.Image): void {
    if (this.won) {
      return;
    }
    this.won = true;

    for (const cam of this.cameras_) {
      cam.disable();
    }
    this.gate.stop();

    this.player.cast(600, () => {
      obra.setTexture(AssetKeys.ObraInspiracionColor);
      playSfx(this, AudioKeys.Confirm);
      showMessagePanel(this, 'Has devuelto la Inspiración', () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('TransitionScene', {
            texture: AssetKeys.TransitionL2L3,
            text: 'La Inspiración vuelve a brillar. Pero la obra maestra aún duerme bajo tierra, en una bóveda custodiada por láseres.',
            next: 'Level3Scene',
          });
        });
      });
    });
  }

}
