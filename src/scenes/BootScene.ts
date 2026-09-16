import Phaser from 'phaser';
import { AssetKeys, WalkAnimKey, CrouchWalkAnimKey } from '../config/assetKeys';

import titleVideoUrl from '../assets/cinematics/titulo-video.mp4';
import vineta1Url from '../assets/cinematics/vineta1-museo.png';
import vineta2Url from '../assets/cinematics/vineta2-sombra.png';
import vineta3Url from '../assets/cinematics/vineta3-porton.png';
import vineta4Url from '../assets/cinematics/vineta4-lienzo.png';
import vineta5Url from '../assets/cinematics/vineta5-redencion.png';
import transitionL1L2Url from '../assets/cinematics/transicion-nivel1-a-2.png';
import transitionL2L3Url from '../assets/cinematics/transicion-nivel2-a-3.png';

import bg1Url from '../assets/backgrounds/nivel1-almacen.png';
import bg2Url from '../assets/backgrounds/nivel2-galeria.png';
import bg3Url from '../assets/backgrounds/nivel3-coleccion.png';
import bg3ColorUrl from '../assets/backgrounds/nivel3-coleccion-color.png';

import obraMemoriaGrisUrl from '../assets/obras/obra-memoria-gris.png';
import obraMemoriaColorUrl from '../assets/obras/obra-memoria-color.png';
import obraInspiracionGrisUrl from '../assets/obras/obra-inspiracion-gris.png';
import obraInspiracionColorUrl from '../assets/obras/obra-inspiracion-color.png';
import obraMaestraGrisUrl from '../assets/obras/obra-maestra-gris.png';
import obraMaestraColorUrl from '../assets/obras/obra-maestra-color.png';

import lienzoWalkUrl from '../assets/sprites/lienzo-spritesheet.png';
import lienzoWalkV2Url from '../assets/sprites/lienzo-walk-cycle-v2.png';
import lienzoCrouchWalkUrl from '../assets/sprites/lienzo-crouch-walk.png';
import lienzoActionsUrl from '../assets/sprites/lienzo-idle-restaurar-hurt.png';
import collectorUrl from '../assets/sprites/the-collector-sprite.png';

import crateUrl from '../assets/sprites/props/caja-madera.png';
import securityCameraUrl from '../assets/sprites/props/camara-seguridad.png';
import laserHazardsUrl from '../assets/sprites/props/laser-hazards.png';

import messageFrameUrl from '../assets/ui/marco-mensaje.png';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.video(AssetKeys.TitleVideo, titleVideoUrl, true);
    this.load.image(AssetKeys.Vineta1, vineta1Url);
    this.load.image(AssetKeys.Vineta2, vineta2Url);
    this.load.image(AssetKeys.Vineta3, vineta3Url);
    this.load.image(AssetKeys.Vineta4, vineta4Url);
    this.load.image(AssetKeys.Vineta5, vineta5Url);
    this.load.image(AssetKeys.TransitionL1L2, transitionL1L2Url);
    this.load.image(AssetKeys.TransitionL2L3, transitionL2L3Url);

    this.load.image(AssetKeys.Bg1, bg1Url);
    this.load.image(AssetKeys.Bg2, bg2Url);
    this.load.image(AssetKeys.Bg3, bg3Url);
    this.load.image(AssetKeys.Bg3Color, bg3ColorUrl);

    this.load.image(AssetKeys.ObraMemoriaGris, obraMemoriaGrisUrl);
    this.load.image(AssetKeys.ObraMemoriaColor, obraMemoriaColorUrl);
    this.load.image(AssetKeys.ObraInspiracionGris, obraInspiracionGrisUrl);
    this.load.image(AssetKeys.ObraInspiracionColor, obraInspiracionColorUrl);
    this.load.image(AssetKeys.ObraMaestraGris, obraMaestraGrisUrl);
    this.load.image(AssetKeys.ObraMaestraColor, obraMaestraColorUrl);

    this.load.spritesheet(AssetKeys.LienzoWalk, lienzoWalkUrl, { frameWidth: 256, frameHeight: 512 });
    this.load.spritesheet(AssetKeys.LienzoWalkV2, lienzoWalkV2Url, { frameWidth: 256, frameHeight: 512 });
    this.load.spritesheet(AssetKeys.LienzoCrouchWalk, lienzoCrouchWalkUrl, { frameWidth: 256, frameHeight: 512 });
    this.load.image(AssetKeys.LienzoActions, lienzoActionsUrl);
    this.load.image(AssetKeys.Collector, collectorUrl);

    this.load.image(AssetKeys.Crate, crateUrl);
    this.load.spritesheet(AssetKeys.SecurityCamera, securityCameraUrl, { frameWidth: 512, frameHeight: 512 });
    this.load.image(AssetKeys.LaserHazards, laserHazardsUrl);

    this.load.image(AssetKeys.MessageFrame, messageFrameUrl);
  }

  create(): void {
    this.buildCustomFrames();
    this.buildAnimations();
    this.buildParticleTexture();
    this.scene.start('TitleScene');
  }

  /**
   * lienzo-idle-restaurar-hurt.png is a 3x2 grid (top row only: idle, cast, hurt)
   * whose 1024px width doesn't divide evenly by 3, so it's loaded as a plain
   * image and sliced into named frames here instead of as a spritesheet.
   *
   * laser-hazards.png bundles modular pieces (h-beam, v-beam, dotted telegraph,
   * emitter node) at hand-measured positions rather than a uniform grid.
   */
  private buildCustomFrames(): void {
    const actions = this.textures.get(AssetKeys.LienzoActions);
    const sourceWidth = actions.source[0].width;
    const sourceHeight = actions.source[0].height;
    const cellW = Math.floor(sourceWidth / 3);
    const cellH = sourceHeight / 2; // only the top row is used

    actions.add('idle', 0, 0, 0, cellW, cellH);
    actions.add('cast', 0, cellW, 0, cellW, cellH);
    actions.add('hurt', 0, cellW * 2, 0, sourceWidth - cellW * 2, cellH);

    const laser = this.textures.get(AssetKeys.LaserHazards);
    laser.add('beam-h', 0, 68, 236, 396, 40);
    laser.add('beam-v', 0, 733, 83, 40, 348);
    laser.add('beam-dotted', 0, 68, 700, 396, 22);
    laser.add('emitter', 0, 552, 656, 178, 118);
  }

  private buildAnimations(): void {
    // lienzo-walk-cycle-v2.png replaces the original walk-row frames here —
    // the original's stride contrast read as sliding at in-game scale.
    // AssetKeys.LienzoWalk (row 0) itself is unused now; its row 1 frames
    // (crouch/takeoff/apex/land) are still used directly via setPose().
    if (!this.anims.exists(WalkAnimKey)) {
      this.anims.create({
        key: WalkAnimKey,
        frames: this.anims.generateFrameNumbers(AssetKeys.LienzoWalkV2, { start: 0, end: 3 }),
        frameRate: 9,
        repeat: -1,
      });
    }
    if (!this.anims.exists(CrouchWalkAnimKey)) {
      this.anims.create({
        key: CrouchWalkAnimKey,
        frames: this.anims.generateFrameNumbers(AssetKeys.LienzoCrouchWalk, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  /** A tiny white square used as the climax particle-burst texture. */
  private buildParticleTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 8, 8);
    g.generateTexture(AssetKeys.Spark, 8, 8);
    g.destroy();
  }
}
