import { PADDLE_OPTIONS, PUCK_OPTIONS, type PickerItem } from '../core/Palette';
import { TextureFactory } from '../core/TextureFactory';
import { Save, type SaveData, type BestOf } from '../core/Save';

type Mode = '1p' | '2p';

// Fixed preview constants to match game configuration
const PREVIEW_CONFIG = {
    mallet: { radius: 30 },
    puck: { radius: 16 }
};

export class CustomizeScene extends Phaser.Scene {
    private saveData!: SaveData;
    private tf!: TextureFactory;

    private p1Idx!: number;
    private p2Idx!: number;
    private puckIdx!: number;

    private p1Preview!: Phaser.GameObjects.Image;
    private p2Preview!: Phaser.GameObjects.Image;
    private puckPreview!: Phaser.GameObjects.Image;

    private mode: Mode = '1p';
    private bestOf: BestOf = 3;

    constructor() { super('Customize'); }

    async create(data: { mode: Mode; bestOf?: BestOf }) {
        this.mode = data.mode ?? '1p';
        this.bestOf = data.bestOf ?? 3;

        this.saveData = await Save.get();
        this.tf = new TextureFactory(this);

        // read save data → indices
        this.p1Idx = PADDLE_OPTIONS.findIndex(o => o.id === this.saveData.playerPaddleId);
        if (this.p1Idx === -1) this.p1Idx = 0;

        this.p2Idx = PADDLE_OPTIONS.findIndex(o => o.id === this.saveData.opponentPaddleId);
        if (this.p2Idx === -1) this.p2Idx = 2;

        this.puckIdx = PUCK_OPTIONS.findIndex(o => o.id === this.saveData.puckId);
        if (this.puckIdx === -1) this.puckIdx = 0;

        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor('#4DD0E1');

        const modeTitle = this.mode === '1p' ? 'SINGLE PLAYER' : 'TWO PLAYERS';
        this.addTitle(width / 2, 120, modeTitle);

        const yh = 150, oh = 290, ph = 430;

        this.makeRow('Your Paddle', width / 2, yh,
            () => this.bump('p1', -1), () => this.bump('p1', +1),
            () => this.redraw('p1')
        );

        this.makeRow('Opponent Paddle', width / 2, oh,
            () => this.bump('p2', -1), () => this.bump('p2', +1),
            () => this.redraw('p2')
        );

        this.makeRow('Puck', width / 2, ph,
            () => this.bump('puck', -1), () => this.bump('puck', +1),
            () => this.redraw('puck')
        );

        // Next button
        const next = this.add.text(width / 2, height - 60, 'Next ▶', {
            fontFamily: 'monospace', fontSize: '24px', color: '#0f0', backgroundColor: '#032'
        }).setPadding(14, 8).setOrigin(0.5).setInteractive({ useHandCursor: true });
        next.on('pointerup', async () => {
            // persist
            await Save.set({
                playerPaddleId: PADDLE_OPTIONS[this.p1Idx].id,
                opponentPaddleId: PADDLE_OPTIONS[this.p2Idx].id,
                puckId: PUCK_OPTIONS[this.puckIdx].id
            });
            this.scene.start('Game', { mode: this.mode, bestOf: this.bestOf });
        });

        // Initial previews
        this.redraw('p1');
        this.redraw('p2');
        this.redraw('puck');
    }

    private addTitle(x: number, y: number, txt: string) {
        const cap = this.add.text(x, y, txt, {
            fontFamily: 'monospace', fontSize: '32px', color: '#fff'
        }).setOrigin(0.5);
        cap.setShadow(0, 2, '#000', 4, true, true);
    }

    private makeRow(label: string, cx: number, cy: number, onLeft: () => void, onRight: () => void, after: () => void) {
        this.add.text(cx, cy - 40, label, { fontFamily: 'monospace', fontSize: '18px', color: '#9cf' }).setOrigin(0.5);

        const left = this.arrow(cx - 140, cy, '◀', onLeft);
        const right = this.arrow(cx + 140, cy, '▶', onRight);

        // placeholder preview, replaced by redraw()
        const img = this.add.image(cx, cy, '__').setVisible(false);

        if (label.startsWith('Your')) this.p1Preview = img;
        else if (label.startsWith('Opponent')) this.p2Preview = img;
        else this.puckPreview = img;

        after();
    }

    private arrow(x: number, y: number, label: string, onUp: () => void) {
        const t = this.add.text(x, y, label, {
            fontFamily: 'monospace', fontSize: '28px', color: '#fff', backgroundColor: '#021a'
        }).setPadding(10, 6).setOrigin(0.5).setInteractive({ useHandCursor: true });
        t.on('pointerup', onUp);
        return t;
    }

    private bump(which: 'p1' | 'p2' | 'puck', dir: -1 | 1) {
        if (which === 'p1') this.p1Idx = (this.p1Idx + dir + PADDLE_OPTIONS.length) % PADDLE_OPTIONS.length;
        if (which === 'p2') this.p2Idx = (this.p2Idx + dir + PADDLE_OPTIONS.length) % PADDLE_OPTIONS.length;
        if (which === 'puck') this.puckIdx = (this.puckIdx + dir + PUCK_OPTIONS.length) % PUCK_OPTIONS.length;
        this.redraw(which);
    }

    private redraw(which: 'p1' | 'p2' | 'puck') {
        const rPaddle = PREVIEW_CONFIG.mallet.radius;
        const rPuck = PREVIEW_CONFIG.puck.radius;

        if (which === 'p1') {
            const c = PADDLE_OPTIONS[this.p1Idx].color;
            const key = `p1_preview_${c}`;
            this.tf.disc(key, rPaddle, c, true);
            this.p1Preview.setTexture(key).setVisible(true);
        }
        if (which === 'p2') {
            const c = PADDLE_OPTIONS[this.p2Idx].color;
            const key = `p2_preview_${c}`;
            this.tf.disc(key, rPaddle, c, true);
            this.p2Preview.setTexture(key).setVisible(true);
        }
        if (which === 'puck') {
            const c = PUCK_OPTIONS[this.puckIdx].color;
            const key = `puck_preview_${c}`;
            this.tf.disc(key, rPuck, c, true);
            this.puckPreview.setTexture(key).setVisible(true);
        }
    }
}
