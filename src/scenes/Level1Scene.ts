import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys';
import { GAME_HEIGHT } from '../config/constants';
import { Player } from '../objects/Player';
import { showMessagePanel } from '../objects/MessagePanel';
import { LivesHud } from '../objects/LivesHud';
import { enablePause } from '../objects/Pausable';

const LEVEL_WIDTH = 1900;
const CRATE_SCALE = 0.24;
// Same fix as Levels 2 and 3: pin the walkway near the bottom of the screen
// instead of the shared GROUND_Y, which left a stripe of bare wall showing
// underneath the player.
const LEVEL1_GROUND_Y = GAME_HEIGHT - 20;
// Raw (unscaled) alpha bounding box of the crate art within its 1024x1024 canvas.
const CRATE_RAW_BOX = { x: 323, y: 277, width: 377, height: 427 };
const CRATE_TOP_OFFSET = 512 - CRATE_RAW_BOX.y; // distance from sprite center to visible top, raw px

// Ascending staircase of crates leading up to the raised platform holding the artwork.
// `top` is the desired world Y of the crate's visible top surface.
const CRATE_TOPS: Array<{ x: number; top: number }> = [
  { x: 420, top: LEVEL1_GROUND_Y - 10 },
  { x: 580, top: LEVEL1_GROUND_Y - 90 },
  { x: 740, top: LEVEL1_GROUND_Y - 90 },
  { x: 900, top: LEVEL1_GROUND_Y - 170 },
  { x: 1060, top: LEVEL1_GROUND_Y - 170 },
  { x: 1220, top: LEVEL1_GROUND_Y - 250 },
  { x: 1380, top: LEVEL1_GROUND_Y - 250 },
  { x: 1560, top: LEVEL1_GROUND_Y - 250 },
  { x: 1650, top: LEVEL1_GROUND_Y - 250 },
];

export class Level1Scene extends Phaser.Scene {
  private player!: Player;
  private won = false;

  constructor() {
    super('Level1Scene');
  }

  init(): void {
    this.won = false;
  }

  create(): void {
    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);

    const bgScale = GAME_HEIGHT / 512;
    this.add
      .tileSprite(0, 0, LEVEL_WIDTH, GAME_HEIGHT, AssetKeys.Bg1)
      .setOrigin(0, 0)
      .setTileScale(bgScale, bgScale);

    const ground = this.add.rectangle(LEVEL_WIDTH / 2, LEVEL1_GROUND_Y + 60, LEVEL_WIDTH, 120, 0x000000, 0);
    this.physics.add.existing(ground, true);

    const crates = this.physics.add.staticGroup();
    for (const spot of CRATE_TOPS) {
      const crate = crates.create(spot.x, spot.top + CRATE_TOP_OFFSET * CRATE_SCALE, AssetKeys.Crate) as Phaser.Types.Physics.Arcade.ImageWithStaticBody;
      crate.setScale(CRATE_SCALE);
      const body = crate.body as Phaser.Physics.Arcade.StaticBody;
      // Order matters: refreshBody() recomputes the body from the sprite's
      // full (untrimmed) frame, so it must run BEFORE the custom size/offset
      // — calling it after, as this used to, silently reset the hitbox back
      // to the whole 1024x1024 canvas instead of the crate's tight art box.
      crate.refreshBody();
      body.setSize(CRATE_RAW_BOX.width * CRATE_SCALE, CRATE_RAW_BOX.height * CRATE_SCALE);
      body.setOffset(CRATE_RAW_BOX.x * CRATE_SCALE, CRATE_RAW_BOX.y * CRATE_SCALE);
    }

    this.player = new Player(this, 100, LEVEL1_GROUND_Y);

    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, crates);

    const lastPad = CRATE_TOPS[CRATE_TOPS.length - 1];
    const obra = this.add
      .image(1605, lastPad.top, AssetKeys.ObraMemoriaGris)
      .setOrigin(0.5, 1)
      .setDisplaySize(140, 140)
      .setDepth(8);
    this.physics.add.existing(obra, true);

    this.physics.add.overlap(this.player, obra, () => this.onReachObra(obra));

    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    new LivesHud(this);
    enablePause(this);

    this.player.lock();
    showMessagePanel(
      this,
      'Flechas / WASD: moverse — Espacio: saltar — ESC: pausa.\nSaltá sobre las cajas para llegar al cuadro.',
      () => this.player.unlock(),
    );
  }

  update(): void {
    this.player.update();
  }

  private onReachObra(obra: Phaser.GameObjects.Image): void {
    if (this.won) {
      return;
    }
    this.won = true;

    this.player.cast(600, () => {
      obra.setTexture(AssetKeys.ObraMemoriaColor);
      showMessagePanel(this, 'Has devuelto la Memoria', () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('TransitionScene', {
            texture: AssetKeys.TransitionL1L2,
            text: 'Con la Memoria a salvo, el rastro del Coleccionista sigue: una galería oculta, vigilada por cámaras, guarda la Inspiración.',
            next: 'Level2Scene',
          });
        });
      });
    });
  }

}
