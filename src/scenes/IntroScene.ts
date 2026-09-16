import Phaser from 'phaser';
import { AssetKeys } from '../config/assetKeys';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

interface Slide {
  texture: string;
  text: string;
}

const SLIDES: Slide[] = [
  {
    texture: AssetKeys.Vineta1,
    text: 'Durante siglos, el arte ha sido nuestra mayor expresión... contando historias y mostrando la belleza de nuestro mundo.',
  },
  {
    texture: AssetKeys.Vineta2,
    text: 'Pero todo cambió cuando El Coleccionista robó las obras por obsesión al poder, dejando a la humanidad rodeada de copias.',
  },
  {
    texture: AssetKeys.Vineta3,
    text: 'Un héroe emprende una aventura para recuperar las obras perdidas... y recordarles a todos por qué el arte importa.',
  },
  {
    texture: AssetKeys.Vineta4,
    text: 'Porque el arte no tiene valor solamente por lo que cuesta. Tiene valor por lo que nos hace sentir.',
  },
];

/** Four static vignettes that advance on click, then hand off to Level1Scene. */
export class IntroScene extends Phaser.Scene {
  private index = 0;
  private advancing = false;
  private background!: Phaser.GameObjects.Image;
  private caption!: Phaser.GameObjects.Text;

  constructor() {
    super('IntroScene');
  }

  init(): void {
    this.index = 0;
    this.advancing = false;
  }

  create(): void {
    const slide = SLIDES[0];

    this.background = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, slide.texture)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 110, GAME_WIDTH - 120, 160, 0x0b0b12, 0.78)
      .setStrokeStyle(2, 0xd8c692, 0.6);

    this.caption = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 118, slide.text, {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#f4ead2',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 200 },
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH - 60, GAME_HEIGHT - 40, 'Click para continuar ▸', {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#cbb994',
      })
      .setOrigin(1, 0.5)
      .setAlpha(0.8);

    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.input.on('pointerdown', () => this.advance());
  }

  private advance(): void {
    if (this.advancing) {
      return;
    }
    this.advancing = true;

    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.index += 1;
      if (this.index >= SLIDES.length) {
        this.scene.start('Level1Scene');
        return;
      }
      const slide = SLIDES[this.index];
      this.background.setTexture(slide.texture);
      this.caption.setText(slide.text);
      this.cameras.main.fadeIn(250, 0, 0, 0);
      this.advancing = false;
    });
  }
}
