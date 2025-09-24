import { TextureFactory } from '../core/TextureFactory';
import { AudioSystem } from '../core/Audio';
import { HUD } from '../ui/HUD';
import { PauseOverlay } from '../ui/PauseOverlay';
import { MatchManager } from '../core/MatchManager';
import { Save, type BestOf, type SaveData } from '../core/Save';
import { PADDLE_OPTIONS, PUCK_OPTIONS } from '../core/Palette';
import { ASSET_KEYS } from '../constants/GameConfig';

type Mode = '1p' | '2p';

// Fixed game constants since we're no longer using dynamic skins
const GAME_CONFIG = {
    table: {
        width: 1080,
        height: 1700,
        wallThickness: 30,
        goalWidth: 280,
        goalDepth: 40,
        edgeHeight: 60
    },
    puck: {
        radius: 16,
        bounce: 1.0,
        maxSpeed: 800
    },
    mallet: {
        radius: 30
    }
};

export class GameScene extends Phaser.Scene {
    private saveData!: SaveData;

    private tf!: TextureFactory;
    private audio!: AudioSystem;
    private hud!: HUD;
    private pauseUI!: PauseOverlay;

    private table!: Phaser.GameObjects.Image;
    private tableEdge!: Phaser.GameObjects.Image;
    private puck!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    private p1!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    private p2!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

    private pointsP1 = 0;
    private pointsP2 = 0;
    private rounds!: MatchManager;

    private mode: Mode = '1p';
    private bestOf: BestOf = 3;

    private tableOrigin!: Phaser.Math.Vector2;
    private bounds!: Phaser.Physics.Arcade.StaticGroup;
    private goals!: { top: Phaser.Physics.Arcade.StaticBody; bottom: Phaser.Physics.Arcade.StaticBody };

    constructor() { super('Game'); }

    async create(data: { mode?: Mode; bestOf?: BestOf }) {
        this.saveData = await Save.get();

        this.mode = data.mode ?? '1p';
        this.bestOf = data.bestOf ?? this.saveData.bestOf;

        this.tf = new TextureFactory(this);
        this.audio = new AudioSystem(this);
        this.hud = new HUD(this);
        this.rounds = new MatchManager(this.bestOf);

        this.cameras.main.setBackgroundColor(0x3FC7EA);
        this.createTableAndWalls();
        this.createActors();
        this.createCollisions();

        this.hud.create(this.mode.toUpperCase() as '1P' | '2P');
        this.hud.setScore(this.pointsP1, this.pointsP2);
        this.showMatchBanner(`Best of ${this.bestOf}`);

        this.pauseUI = new PauseOverlay(this, () => this.fullRestart());
        await this.pauseUI.create();

        this.input.setPollAlways();
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.moveP1To(p.worldX, p.worldY));
        this.input.keyboard?.on('keydown-P', () => this.pauseUI.show());
    }

    private createTableAndWalls() {
        const t = GAME_CONFIG.table;
        const { width: screenWidth, height: screenHeight } = this.scale;

        // Make table fill the screen like the reference image
        const actualW = screenWidth;
        const actualH = screenHeight - 120; // Leave space for HUD

        // Position table to fill most of the screen
        const tableY = screenHeight / 2 + 30; // Center with slight offset for HUD

        // Create main table that fills the screen
        this.table = this.add.image(screenWidth / 2, tableY, ASSET_KEYS.TABLE)
            .setDisplaySize(actualW, actualH);

        // Position table edge at the very top of the playable area
        const edgeY = 100; // Just below the HUD area
        this.tableEdge = this.add.image(screenWidth / 2, edgeY, ASSET_KEYS.TABLE_EDGE)
            .setDisplaySize(actualW, t.edgeHeight)
            .setOrigin(0.5, 0.5);

        this.tableOrigin = new Phaser.Math.Vector2(
            this.table.x - actualW / 2,
            edgeY - t.edgeHeight / 2
        );

        // Set physics bounds to the full playable area including edge
        const playableHeight = actualH + t.edgeHeight;
        this.physics.world.setBounds(this.tableOrigin.x, this.tableOrigin.y, actualW, playableHeight, true, true, true, true);

        // Use full screen dimensions for collision boundaries
        const gx = this.table.x;
        const goalHalf = t.goalWidth / 2;
        const leftX = this.tableOrigin.x;
        const rightX = leftX + actualW;
        const topY = this.tableOrigin.y + t.edgeHeight; // Start walls after the edge
        const botY = topY + actualH - t.edgeHeight;
        const WT = t.wallThickness;

        const addRect = (x: number, y: number, rw: number, rh: number) => {
            const r = this.add.rectangle(x, y, rw, rh, 0xffffff, 0).setOrigin(0);
            this.physics.add.existing(r, true);
            return r.body as Phaser.Physics.Arcade.StaticBody;
        };

        this.bounds = this.physics.add.staticGroup();
        // Top wall (with goal opening)
        this.bounds.add(addRect(leftX, topY, (actualW / 2 - goalHalf), WT).gameObject);
        this.bounds.add(addRect(gx + goalHalf, topY, (actualW / 2 - goalHalf), WT).gameObject);

        // Bottom wall (with goal opening)
        this.bounds.add(addRect(leftX, botY - WT, (actualW / 2 - goalHalf), WT).gameObject);
        this.bounds.add(addRect(gx + goalHalf, botY - WT, (actualW / 2 - goalHalf), WT).gameObject);

        // Side walls (full height including edge area)
        this.bounds.add(addRect(leftX, this.tableOrigin.y, WT, actualH + t.edgeHeight).gameObject);
        this.bounds.add(addRect(rightX - WT, this.tableOrigin.y, WT, actualH + t.edgeHeight).gameObject);

        // Table edge barrier (invisible wall at the edge)
        this.bounds.add(addRect(leftX + WT, this.tableOrigin.y + t.edgeHeight - 5, actualW - 2 * WT, 10).gameObject);

        const goalDepth = t.goalDepth;
        const topGoal = addRect(gx - goalHalf, topY + goalDepth, t.goalWidth, 2);
        const bottomGoal = addRect(gx - goalHalf, botY - goalDepth - 2, t.goalWidth, 2);
        this.goals = { top: topGoal, bottom: bottomGoal };
    }

    private createActors() {
        const p1Color = PADDLE_OPTIONS.find(o => o.id === this.saveData.playerPaddleId)?.color ?? 0x17c2b8;
        const p2Color = PADDLE_OPTIONS.find(o => o.id === this.saveData.opponentPaddleId)?.color ?? 0xff3a3a;
        const puckColor = PUCK_OPTIONS.find(o => o.id === this.saveData.puckId)?.color ?? 0x1a2a6c;

        // Generate colored disc textures
        this.tf.disc('puck', GAME_CONFIG.puck.radius, puckColor, true);
        this.tf.disc('mallet1', GAME_CONFIG.mallet.radius, p1Color, true);
        this.tf.disc('mallet2', GAME_CONFIG.mallet.radius, p2Color, true);

        this.puck = this.physics.add.image(this.table.x, this.table.y, 'puck');
        this.puck.setCircle(GAME_CONFIG.puck.radius * 2, 0, 0);
        this.puck.setBounce(GAME_CONFIG.puck.bounce);
        this.puck.setDamping(true).setDrag(0.002, 0.002);
        this.puck.setMaxVelocity(GAME_CONFIG.puck.maxSpeed, GAME_CONFIG.puck.maxSpeed);

        const { width: screenWidth, height: screenHeight } = this.scale;

        // Position mallets in their respective halves
        this.p1 = this.physics.add.image(screenWidth / 2, screenHeight * 0.75, 'mallet1')
            .setImmovable(true).setCircle(GAME_CONFIG.mallet.radius * 2, 0, 0);

        this.p2 = this.physics.add.image(screenWidth / 2, screenHeight * 0.35, 'mallet2')
            .setImmovable(true).setCircle(GAME_CONFIG.mallet.radius * 2, 0, 0);
    }

    private createCollisions() {
        this.physics.add.collider(this.puck, this.bounds, () => this.audio.hit());
        this.physics.add.collider(this.puck, this.p1, () => this.onHit(this.p1));
        this.physics.add.collider(this.puck, this.p2, () => this.onHit(this.p2));
        this.physics.add.overlap(this.puck, this.goals.top.gameObject, () => this.goalFor(1));
        this.physics.add.overlap(this.puck, this.goals.bottom.gameObject, () => this.goalFor(2));
    }

    private onHit(_: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
        this.audio.hit();
        const v = this.puck.body.velocity.length();
        if (v < 80) this.puck.body.velocity.normalize().scale(150);
    }

    private goalFor(player: 1 | 2) {
        this.audio.goal();
        if (player === 1) this.pointsP1++; else this.pointsP2++;
        this.hud.setScore(this.pointsP1, this.pointsP2);

        this.rounds.awardRound(player);
        this.showRoundToast(`Round to Player ${player}`);

        if (this.rounds.isMatchOver()) {
            const w = this.rounds.winner()!;
            this.showMatchBanner(`Player ${w} wins the match!`);
            this.time.delayedCall(1500, () => this.fullRestartToMenu());
        } else {
            this.time.delayedCall(600, () => this.startNextRound(player));
        }
    }

    private startNextRound(lastWinner: 1 | 2) {
        this.pointsP1 = 0;
        this.pointsP2 = 0;
        this.hud.setScore(this.pointsP1, this.pointsP2);
        this.resetPuck(lastWinner === 1);
    }

    private resetPuck(scoredForP1: boolean) {
        this.puck.setPosition(this.table.x, this.table.y);
        this.puck.setVelocity(0, scoredForP1 ? -250 : 250);
    }

    private moveP1To(x: number, y: number) {
        const sens = this.saveData.pointerSensitivity;
        const nx = Phaser.Math.Linear(this.p1.x, x, 0.25 * sens);
        const ny = Phaser.Math.Linear(this.p1.y, y, 0.25 * sens);

        const t = GAME_CONFIG.table;
        const { width: screenWidth, height: screenHeight } = this.scale;
        const minX = t.wallThickness + GAME_CONFIG.mallet.radius * 2;
        const maxX = screenWidth - t.wallThickness - GAME_CONFIG.mallet.radius * 2;
        const minY = screenHeight / 2 + 20; // Middle line + buffer
        const maxY = screenHeight - 50 - GAME_CONFIG.mallet.radius * 2; // Bottom - buffer

        this.p1.setPosition(Phaser.Math.Clamp(nx, minX, maxX), Phaser.Math.Clamp(ny, minY, maxY));
    }

    update(_: number, dt: number) {
        if (this.mode === '1p') this.aiUpdate(dt);
        this.lockMalletsToHalves();
    }

    private aiUpdate(_: number) {
        if (!this.tableOrigin || !this.table || !this.puck || !this.p2) return;

        const t = GAME_CONFIG.table;
        const { width: screenWidth, height: screenHeight } = this.scale;
        const minX = t.wallThickness + GAME_CONFIG.mallet.radius * 2;
        const maxX = screenWidth - t.wallThickness - GAME_CONFIG.mallet.radius * 2;
        const minY = 120 + GAME_CONFIG.mallet.radius * 2; // Below edge + buffer
        const maxY = screenHeight / 2 - 20; // Above middle line
        const targetX = Phaser.Math.Clamp(this.puck.x, minX, maxX);
        const defendY = Phaser.Math.Clamp(this.puck.y - 40, minY, maxY - 10);
        const lerp = 0.12;
        this.p2.x = Phaser.Math.Linear(this.p2.x, targetX, lerp);
        this.p2.y = Phaser.Math.Linear(this.p2.y, defendY, lerp);
    }

    private lockMalletsToHalves() {
        if (!this.tableOrigin || !this.table || !this.p1 || !this.p2) return;

        const t = GAME_CONFIG.table;
        const { width: screenWidth, height: screenHeight } = this.scale;
        const midY = screenHeight / 2;

        // Player 1 (bottom half) - constrain to bottom area
        const p1MinY = midY + 20;
        const p1MaxY = screenHeight - 50 - GAME_CONFIG.mallet.radius * 2;
        this.p1.y = Phaser.Math.Clamp(this.p1.y, p1MinY, p1MaxY);

        // Player 2 (top half) - constrain to top area
        const p2MinY = 120 + GAME_CONFIG.mallet.radius * 2;
        const p2MaxY = midY - 20;
        this.p2.y = Phaser.Math.Clamp(this.p2.y, p2MinY, p2MaxY);

        // Constrain both to screen width
        const minX = t.wallThickness + GAME_CONFIG.mallet.radius * 2;
        const maxX = screenWidth - t.wallThickness - GAME_CONFIG.mallet.radius * 2;
        this.p1.x = Phaser.Math.Clamp(this.p1.x, minX, maxX);
        this.p2.x = Phaser.Math.Clamp(this.p2.x, minX, maxX);
    }

    private showRoundToast(text: string) {
        const t = this.add.text(this.scale.width / 2, this.table.y, text, {
            fontFamily: 'monospace', fontSize: '20px', color: '#fff', backgroundColor: '#021a'
        }).setPadding(10, 6).setOrigin(0.5).setDepth(900);
        this.tweens.add({ targets: t, alpha: 0, y: t.y - 40, duration: 900, onComplete: () => t.destroy() });
    }

    private showMatchBanner(text: string) {
        const b = this.add.text(this.scale.width / 2, this.scale.height * 0.1, text, {
            fontFamily: 'monospace', fontSize: '22px', color: '#0f0'
        }).setOrigin(0.5).setDepth(900);
        this.tweens.add({ targets: b, alpha: 0.0, duration: 1400, delay: 600, onComplete: () => b.destroy() });
    }

    private fullRestart() {
        this.scene.restart({ skinId: 'classic', mode: this.mode, bestOf: this.bestOf });
    }
    private fullRestartToMenu() {
        this.scene.start('Menu', { skinId: 'classic', mode: this.mode });
    }
}
