import { Save } from '../core/Save';

export class PauseOverlay {
  private container!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Rectangle;
  private visible = false;

  constructor(private scene: Phaser.Scene, private onRestart: () => void) {}

  async create() {
    const { width, height } = this.scene.scale;
    this.bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0).setInteractive();
    const panel = this.scene.add.rectangle(width/2, height/2, 520, 360, 0x0e1320, 0.95).setStrokeStyle(2, 0x334);
    const title = this.scene.add.text(width/2, height/2 - 140, 'Paused', { fontFamily: 'monospace', fontSize: '28px', color: '#fff' }).setOrigin(0.5);

    const s = await Save.get();
    const musicBtn = this.mkToggle(width/2 - 160, height/2 - 70, 'Music', s.music, async (v) => {
      await Save.set({ music: v });
    });
    const sfxBtn = this.mkToggle(width/2 + 40, height/2 - 70, 'SFX', s.sfx, async (v) => {
      await Save.set({ sfx: v });
    });

    const sensLabel = this.scene.add.text(width/2 - 200, height/2 - 10, 'Pointer Sens.', { fontFamily: 'monospace', fontSize: '16px', color: '#9cf' });
    const dec = this.btn(width/2 + -40, height/2 - 10, '–', () => this.bumpSensitivity(-0.1));
    const sensVal = this.scene.add.text(width/2, height/2 - 10, s.pointerSensitivity.toFixed(1),
      { fontFamily: 'monospace', fontSize: '16px', color: '#fff' }).setOrigin(0.5, 0.5);
    const inc = this.btn(width/2 + 40, height/2 - 10, '+', () => this.bumpSensitivity(+0.1, sensVal));

    const resume = this.btn(width/2 - 90, height/2 + 90, 'Resume', () => this.hide());
    const restart = this.btn(width/2 + 90, height/2 + 90, 'Restart', () => { this.hide(); this.onRestart(); });

    this.container = this.scene.add.container(0, 0, [ this.bg, panel, title, musicBtn, sfxBtn, sensLabel, dec, sensVal, inc, resume, restart ]);
    this.container.setDepth(1000);
    this.container.setVisible(false);
  }

  private mkToggle(x: number, y: number, label: string, initial: boolean, onChange: (v: boolean) => void) {
    const t = this.scene.add.text(x, y, `${label}: ${initial ? 'ON' : 'OFF'}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#fff', backgroundColor: '#143'
    }).setPadding(8, 6).setInteractive({ useHandCursor: true });
    t.on('pointerup', () => {
      const now = !/ON$/.test(t.text);
      t.setText(`${label}: ${now ? 'ON' : 'OFF'}`);
      onChange(now);
    });
    return t;
  }

  private btn(x: number, y: number, label: string, onUp: () => void) {
    const b = this.scene.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '18px', color: '#0f0', backgroundColor: '#032'
    }).setPadding(10, 6).setOrigin(0.5).setInteractive({ useHandCursor: true });
    b.on('pointerup', onUp);
    return b;
  }

  private async bumpSensitivity(delta: number, display?: Phaser.GameObjects.Text) {
    const currentSave = await Save.get();
    const s = Phaser.Math.Clamp(currentSave.pointerSensitivity + delta, 0.5, 2.0);
    await Save.set({ pointerSensitivity: s });
    if (display) display.setText(s.toFixed(1));
  }

  show() {
    if (this.visible) return;
    this.visible = true;
    this.scene.scene.pause();
    this.container.setVisible(true);
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    this.container.setVisible(false);
    this.scene.scene.resume();
  }
}
