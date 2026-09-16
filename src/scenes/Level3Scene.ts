import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys';
import { GAME_HEIGHT } from '../config/constants';
import { Player } from '../objects/Player';
import { LaserGate } from '../objects/LaserGate';
import { showMessagePanel, showMessageSequence } from '../objects/MessagePanel';
import { LivesHud } from '../objects/LivesHud';
import { enablePause } from '../objects/Pausable';
import { loseLife } from '../state/gameState';

const LEVEL_WIDTH = 2800;
// Same fix as Level 2: this background has no distinct floor band either, so
// pin the walkway near the bottom of the screen instead of the shared
// GROUND_Y (which leaves ~80px of bare wall showing underneath the player).
const LEVEL3_GROUND_Y = GAME_HEIGHT - 20;
const ANKLE_Y = LEVEL3_GROUND_Y - 40;
// Duck-under beams sit between a crouching player's head (~floorY-80) and a
// standing one's (~floorY-160) — hits standing, clears crouching, with
// margin on both sides.
const DUCK_Y = LEVEL3_GROUND_Y - 110;
// Vertical gates now span the *entire* screen height, not just down to a
// fixed offset. With the player's double jump added after this level was
// first built, a well-timed jump could clear the old 260px-tall gate
// entirely — defeating the "wait for it to turn off" mechanic. Spanning the
// full height makes that geometrically impossible regardless of jump count.
const GATE_TOP_Y = 10;

// Collector art is a 1024 canvas with ~918px of standing figure; this scale
// puts him a head taller than Lienzo so he reads as the adult in the vault.
const COLLECTOR_SCALE = 0.22;
const COLLECTOR_FEET_ORIGIN_Y = 960 / 1024;
const BRIEFCASE_SCALE = 0.12;
const BRIEFCASE_FEET_ORIGIN_Y = 702 / 1024;

export class Level3Scene extends Phaser.Scene {
  private player!: Player;
  private gates: LaserGate[] = [];
  private livesHud!: LivesHud;
  private resetting = false;
  private climaxStarted = false;
  private checkpoint = { x: 100, y: LEVEL3_GROUND_Y };
  private colorBg!: Phaser.GameObjects.TileSprite;

  constructor() {
    super('Level3Scene');
  }

  init(): void {
    this.gates = [];
    this.resetting = false;
    this.climaxStarted = false;
    this.checkpoint = { x: 100, y: LEVEL3_GROUND_Y };
  }

  create(): void {
    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);

    const bgScale = GAME_HEIGHT / 1024;
    this.add.tileSprite(0, 0, LEVEL_WIDTH, GAME_HEIGHT, AssetKeys.Bg3).setOrigin(0, 0).setTileScale(bgScale, bgScale);
    this.colorBg = this.add
      .tileSprite(0, 0, LEVEL_WIDTH, GAME_HEIGHT, AssetKeys.Bg3Color)
      .setOrigin(0, 0)
      .setTileScale(bgScale, bgScale)
      .setAlpha(0);

    const ground = this.add.rectangle(LEVEL_WIDTH / 2, LEVEL3_GROUND_Y + 60, LEVEL_WIDTH, 120, 0x000000, 0);
    this.physics.add.existing(ground, true);

    this.player = new Player(this, this.checkpoint.x, this.checkpoint.y);
    this.physics.add.collider(this.player, ground);

    // Five gates now, alternating three flavors so the rhythm keeps
    // changing: jump-over (low), wait-it-out (full height), duck-under
    // (high) — tightening timing toward the end for a real difficulty ramp
    // into the masterpiece.
    this.gates.push(new LaserGate(this, 550, ANKLE_Y, 750, ANKLE_Y, 'horizontal', { onMs: 1200, offMs: 1100 }));
    this.gates.push(
      new LaserGate(this, 1050, GATE_TOP_Y, 1050, LEVEL3_GROUND_Y, 'vertical', {
        onMs: 1400,
        offMs: 1300,
        startDelayMs: 300,
      }),
    );
    this.gates.push(
      new LaserGate(this, 1350, DUCK_Y, 1550, DUCK_Y, 'horizontal', { onMs: 1300, offMs: 1000, startDelayMs: 600 }),
    );
    this.gates.push(
      new LaserGate(this, 1850, GATE_TOP_Y, 1850, LEVEL3_GROUND_Y, 'vertical', {
        onMs: 1800,
        offMs: 900,
        startDelayMs: 900,
      }),
    );
    this.gates.push(
      new LaserGate(this, 2150, ANKLE_Y, 2350, ANKLE_Y, 'horizontal', { onMs: 1000, offMs: 700, startDelayMs: 1200 }),
    );

    const hazardBodies = this.gates.map((gate) => gate.hazard);
    this.physics.add.overlap(this.player, hazardBodies, () => this.onLaserHit());

    // Spotlight glow behind the masterpiece.
    const spotX = LEVEL_WIDTH - 150;
    const glow = this.add.graphics().setDepth(3);
    glow.fillStyle(0xfff3c4, 0.18);
    glow.fillCircle(spotX, LEVEL3_GROUND_Y - 140, 220);
    glow.fillStyle(0xfff3c4, 0.28);
    glow.fillCircle(spotX, LEVEL3_GROUND_Y - 140, 130);

    const obraMaestra = this.add
      .image(spotX, LEVEL3_GROUND_Y, AssetKeys.ObraMaestraGris)
      .setOrigin(0.5, 1)
      .setDisplaySize(170, 170)
      .setDepth(8);
    this.physics.add.existing(obraMaestra, true);
    this.physics.add.overlap(this.player, obraMaestra, () => this.onReachMasterpiece(obraMaestra));

    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.livesHud = new LivesHud(this);
    enablePause(this);

    this.player.lock();
    showMessagePanel(
      this,
      'Sólido daña, punteado avisa que se está por encender. ESC: pausa.\nSaltá los haces bajos, agachate en los altos, esperá a que se apaguen los verticales — cubren toda la altura.',
      () => this.player.unlock(),
    );
  }

  update(): void {
    this.player.update();

    if (!this.resetting && !this.climaxStarted) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      const onGround = body.blocked.down || body.touching.down;
      if (onGround && this.player.x > this.checkpoint.x + 30) {
        this.checkpoint = { x: this.player.x, y: LEVEL3_GROUND_Y };
      }
    }
  }

  private onLaserHit(): void {
    if (this.resetting || this.climaxStarted || this.player.isLocked) {
      return;
    }
    this.resetting = true;
    const remaining = loseLife();
    this.livesHud.refresh();

    this.player.hurt(() => {
      if (remaining <= 0) {
        this.scene.start('GameOverScene');
        return;
      }
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.reset(this.checkpoint.x, this.checkpoint.y);
      // Brief grace period before hazards can hit again — the checkpoint can
      // land close enough to a gate's column that an immediate re-overlap
      // chained a second life loss out of a single mistake (verified while
      // testing the vertical gates: 2 lives gone from one hit).
      this.time.delayedCall(500, () => {
        this.resetting = false;
      });
    });
  }

  private onReachMasterpiece(obraMaestra: Phaser.GameObjects.Image): void {
    if (this.climaxStarted) {
      return;
    }
    this.climaxStarted = true;

    for (const gate of this.gates) {
      gate.stop();
    }

    this.player.cast(500, () => this.playClimax(obraMaestra));
  }

  private playClimax(obraMaestra: Phaser.GameObjects.Image): void {
    this.player.lock();

    const rainbow = [0xff5da2, 0xffd23f, 0x3fd6ff, 0x7dff6b, 0xb06bff];

    const burst = this.add.particles(obraMaestra.x, obraMaestra.y - 90, AssetKeys.Spark, {
      speed: { min: 120, max: 340 },
      lifespan: 1100,
      scale: { start: 2.4, end: 0 },
      tint: rainbow,
      quantity: 40,
      emitting: false,
    });
    burst.setDepth(20);
    burst.explode(60);

    this.tweens.add({
      targets: this.colorBg,
      alpha: 1,
      duration: 1400,
      delay: 200,
    });

    this.time.delayedCall(500, () => {
      obraMaestra.setTexture(AssetKeys.ObraMaestraColor);
    });

    this.time.delayedCall(1800, () => this.playConfrontation(obraMaestra));
  }

  /** Collector walks in with the briefcase, talks, then drops it before the epilogue. */
  private playConfrontation(obraMaestra: Phaser.GameObjects.Image): void {
    this.player.setFlipX(true);

    const standX = obraMaestra.x - 320;
    const startX = this.cameras.main.worldView.x - 40;

    this.cameras.main.stopFollow();
    this.cameras.main.pan(standX + 160, GAME_HEIGHT / 2, 900, 'Sine.easeInOut');

    const collector = this.add
      .image(startX, LEVEL3_GROUND_Y, AssetKeys.Collector)
      .setOrigin(0.5, COLLECTOR_FEET_ORIGIN_Y)
      .setScale(COLLECTOR_SCALE)
      .setDepth(9)
      .setFlipX(true);

    this.tweens.add({
      targets: collector,
      y: LEVEL3_GROUND_Y - 7,
      duration: 180,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: collector,
      x: standX,
      duration: 2200,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.tweens.killTweensOf(collector);
        collector.y = LEVEL3_GROUND_Y;
        this.openConfrontationDialogue(collector);
      },
    });
  }

  private openConfrontationDialogue(collector: Phaser.GameObjects.Image): void {
    showMessageSequence(
      this,
      [
        'El Coleccionista:\nEsas obras eran mías. Las reuní para que nadie más las tocara.',
        'Lienzo:\nNunca lo fueron. El arte no se puede poseer... solo se puede sentir.',
      ],
      () => this.dropBriefcase(collector),
    );
  }

  private dropBriefcase(collector: Phaser.GameObjects.Image): void {
    collector.setTexture(AssetKeys.CollectorEmpty);

    const briefcase = this.add
      .image(collector.x + 52, collector.y - 118, AssetKeys.Briefcase)
      .setOrigin(0.5, BRIEFCASE_FEET_ORIGIN_Y)
      .setScale(BRIEFCASE_SCALE)
      .setDepth(11)
      .setFlipX(true);

    this.tweens.add({
      targets: briefcase,
      x: collector.x + 118,
      y: LEVEL3_GROUND_Y,
      angle: 16,
      duration: 520,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.time.delayedCall(800, () => {
          this.cameras.main.fadeOut(800, 255, 255, 255);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('EpilogueScene');
          });
        });
      },
    });
  }

}
