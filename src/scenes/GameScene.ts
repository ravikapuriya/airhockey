import { AudioSystem } from '../core/Audio';
import { HUD } from '../ui/HUD';
import { PauseOverlay } from '../ui/PauseOverlay';
import { MatchManager } from '../core/MatchManager';
import { Save, type BestOf, type SaveData } from '../core/Save';
import { PADDLE_OPTIONS, PUCK_OPTIONS } from '../core/Palette';
import { ASSET_KEYS, GameOptions } from '../constants/GameConfig';

type Mode = '1p' | '2p';

export class GameScene extends Phaser.Scene {
    private saveData!: SaveData;

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

    private bounds!: Phaser.Physics.Arcade.StaticGroup;
    private goals!: { top: Phaser.Physics.Arcade.StaticBody; bottom: Phaser.Physics.Arcade.StaticBody };

    // Touch/Mouse control state
    private isPointerDown = false;
    private tableBounds!: { left: number; right: number; top: number; bottom: number; };
    private p1Zone!: { minY: number; maxY: number; };
    private p2Zone!: { minY: number; maxY: number; };

    constructor() { super('Game'); }

    async create(data: { mode?: Mode; bestOf?: BestOf }) {
        this.saveData = await Save.get();

        this.mode = data.mode ?? '1p';
        this.bestOf = data.bestOf ?? this.saveData.bestOf;

        this.audio = new AudioSystem(this);
        this.hud = new HUD(this);
        this.rounds = new MatchManager(this.bestOf);

        this.cameras.main.setBackgroundColor(0x3FC7EA);
        this.createTableAndWalls();
        this.createActors();
        this.createCollisions();

        this.hud.create(this.mode.toUpperCase() as '1P' | '2P');
        this.hud.setScore(this.pointsP1, this.pointsP2);
        this.showMatchBanner(`Best of ${this.bestOf} - First to ${this.rounds.getScore().toWin} rounds`);

        this.pauseUI = new PauseOverlay(this, () => this.fullRestart());
        await this.pauseUI.create();

        this.input.setPollAlways();
        this.setupInputControls();
        this.input.keyboard?.on('keydown-P', () => this.pauseUI.show());
    }

    private createTableAndWalls() {
        const t = GameOptions.table;
        const { width: screenWidth, height: screenHeight } = this.scale;

        // Calculate proper table dimensions
        const tableWidth = screenWidth - 100; // Leave margin
        const tableHeight = screenHeight - 200; // Leave space for HUD
        const tableY = screenHeight / 2 + 20;

        // Create main table - keeping your fixed dimensions
        this.table = this.add.image(screenWidth / 2, tableY, ASSET_KEYS.TABLE);
        this.table.setDisplaySize(tableWidth - 160, tableHeight - 160);

        // Table edge (decorative) - keeping your fixed dimensions
        this.tableEdge = this.add.image(screenWidth / 2, tableY, ASSET_KEYS.TABLE_EDGE);
        this.tableEdge.setDisplaySize(tableWidth, tableHeight);

        // Calculate actual playable area bounds
        const playAreaPadding = GameOptions.puck.radius + 10; // Padding for puck
        this.tableBounds = {
            left: screenWidth / 2 - tableWidth / 2 + t.wallThickness + playAreaPadding,
            right: screenWidth / 2 + tableWidth / 2 - t.wallThickness - playAreaPadding,
            top: tableY - tableHeight / 2 + t.wallThickness + playAreaPadding,
            bottom: tableY + tableHeight / 2 - t.wallThickness - playAreaPadding
        };

        // Set up player zones with proper spacing
        const midY = tableY;
        const zoneBuffer = 50;
        this.p1Zone = {
            minY: midY + zoneBuffer,
            maxY: this.tableBounds.bottom - GameOptions.mallet.radius - 10
        };
        this.p2Zone = {
            minY: this.tableBounds.top + GameOptions.mallet.radius + 10,
            maxY: midY - zoneBuffer
        };

        // Set physics world bounds to match table bounds exactly
        this.physics.world.setBounds(
            this.tableBounds.left,
            this.tableBounds.top,
            this.tableBounds.right - this.tableBounds.left,
            this.tableBounds.bottom - this.tableBounds.top,
            true, true, true, true
        );

        // Create collision walls
        const goalHalf = t.goalWidth / 2;
        const wallThickness = t.wallThickness;

        const addRect = (x: number, y: number, rw: number, rh: number) => {
            const r = this.add.rectangle(x, y, rw, rh, 0xffffff, 0).setOrigin(0.5);
            this.physics.add.existing(r, true);
            return r.body as Phaser.Physics.Arcade.StaticBody;
        };

        this.bounds = this.physics.add.staticGroup();

        // Top walls (with goal opening)
        const topWallY = this.tableBounds.top - wallThickness / 2;
        const leftTopWallWidth = (this.tableBounds.right - this.tableBounds.left) / 2 - goalHalf;
        const rightTopWallWidth = leftTopWallWidth;

        this.bounds.add(addRect(
            this.tableBounds.left + leftTopWallWidth / 2,
            topWallY,
            leftTopWallWidth,
            wallThickness
        ).gameObject);
        this.bounds.add(addRect(
            this.tableBounds.right - rightTopWallWidth / 2,
            topWallY,
            rightTopWallWidth,
            wallThickness
        ).gameObject);

        // Bottom walls (with goal opening)
        const bottomWallY = this.tableBounds.bottom + wallThickness / 2;
        this.bounds.add(addRect(
            this.tableBounds.left + leftTopWallWidth / 2,
            bottomWallY,
            leftTopWallWidth,
            wallThickness
        ).gameObject);
        this.bounds.add(addRect(
            this.tableBounds.right - rightTopWallWidth / 2,
            bottomWallY,
            rightTopWallWidth,
            wallThickness
        ).gameObject);

        // Side walls
        const sideWallHeight = this.tableBounds.bottom - this.tableBounds.top;
        this.bounds.add(addRect(
            this.tableBounds.left - wallThickness / 2,
            (this.tableBounds.top + this.tableBounds.bottom) / 2,
            wallThickness,
            sideWallHeight
        ).gameObject);
        this.bounds.add(addRect(
            this.tableBounds.right + wallThickness / 2,
            (this.tableBounds.top + this.tableBounds.bottom) / 2,
            wallThickness,
            sideWallHeight
        ).gameObject);

        // Goal detection areas
        const goalDepth = t.goalDepth;
        const topGoal = addRect(
            screenWidth / 2,
            this.tableBounds.top - goalDepth / 2,
            t.goalWidth,
            goalDepth
        );
        const bottomGoal = addRect(
            screenWidth / 2,
            this.tableBounds.bottom + goalDepth / 2,
            t.goalWidth,
            goalDepth
        );
        this.goals = { top: topGoal, bottom: bottomGoal };
    }

    private createActors() {
        const p1Color = PADDLE_OPTIONS.find(o => o.id === this.saveData.playerPaddleId)?.color ?? 0x17c2b8;
        const p2Color = PADDLE_OPTIONS.find(o => o.id === this.saveData.opponentPaddleId)?.color ?? 0xff3a3a;
        const puckColor = PUCK_OPTIONS.find(o => o.id === this.saveData.puckId)?.color ?? 0x1a2a6c;

        // Create puck using actual image with tint
        this.puck = this.physics.add.image(this.table.x, this.table.y, ASSET_KEYS.PUCK);
        this.puck.setTint(puckColor);
        this.puck.setCircle(GameOptions.puck.radius, 0, 0);
        this.puck.setBounce(GameOptions.puck.bounce);
        this.puck.setDamping(true).setDrag(0.001, 0.001);
        this.puck.setMaxVelocity(GameOptions.puck.maxSpeed, GameOptions.puck.maxSpeed);
        this.puck.setMass(0.3);
        this.puck.setDepth(10); // Puck should be above table but below mallets

        const { width: screenWidth, height: screenHeight } = this.scale;

        // Create mallets using actual image with tints
        this.p1 = this.physics.add.image(screenWidth / 2, screenHeight * 0.75, ASSET_KEYS.MALLET)
            .setTint(p1Color)
            .setImmovable(true)
            .setCircle(GameOptions.mallet.radius, 0, 0)
            .setDepth(20); // Mallets should be above puck

        this.p2 = this.physics.add.image(screenWidth / 2, screenHeight * 0.35, ASSET_KEYS.MALLET)
            .setTint(p2Color)
            .setImmovable(true)
            .setCircle(GameOptions.mallet.radius, 0, 0)
            .setDepth(20); // Mallets should be above puck
    }

    private createCollisions() {
        this.physics.add.collider(this.puck, this.bounds, () => this.audio.hit());
        this.physics.add.collider(this.puck, this.p1, () => this.onHit(this.p1));
        this.physics.add.collider(this.puck, this.p2, () => this.onHit(this.p2));
        this.physics.add.overlap(this.puck, this.goals.top.gameObject, () => this.goalFor(1));
        this.physics.add.overlap(this.puck, this.goals.bottom.gameObject, () => this.goalFor(2));
    }

    private onHit(mallet: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
        this.audio.hit();
        const v = this.puck.body.velocity.length();

        // Calculate direction from mallet to puck for more realistic physics
        const angle = Phaser.Math.Angle.Between(mallet.x, mallet.y, this.puck.x, this.puck.y);

        // More natural force calculation based on current velocity and distance
        const distance = Phaser.Math.Distance.Between(mallet.x, mallet.y, this.puck.x, this.puck.y);
        const baseForce = Math.max(200, v * 0.8); // Base minimum force
        const distanceMultiplier = Math.max(0.5, (GameOptions.mallet.radius + GameOptions.puck.radius - distance) / 30);
        const force = baseForce + (baseForce * distanceMultiplier * 1.5);

        // Apply force in the direction away from mallet with some variation
        const finalForce = Math.min(force, GameOptions.puck.maxSpeed * 0.8); // Cap the force
        this.puck.body.setVelocity(
            Math.cos(angle) * finalForce,
            Math.sin(angle) * finalForce
        );
    }

    private goalFor(player: 1 | 2) {
        this.audio.goal();
        if (player === 1) this.pointsP1++; else this.pointsP2++;
        this.hud.setScore(this.pointsP1, this.pointsP2);

        // Check if player reached the goal score for this round
        const roundWinScore = 3; // Each round is first to 3 goals
        if (this.pointsP1 >= roundWinScore || this.pointsP2 >= roundWinScore) {
            // Determine round winner
            const roundWinner = this.pointsP1 >= roundWinScore ? 1 : 2;

            this.rounds.awardRound(roundWinner as 1 | 2);
            const roundsScore = this.rounds.getScore();
            this.showRoundToast(`Round ${roundsScore.p1 + roundsScore.p2} to Player ${roundWinner}! (${roundsScore.p1}-${roundsScore.p2})`);

            // Check if match is over (best of X rounds)
            if (this.rounds.isMatchOver()) {
                const matchWinner = this.rounds.winner()!;
                this.showMatchBanner(`Player ${matchWinner} wins the match!`);
                this.time.delayedCall(3000, () => this.fullRestartToMenu());
            } else {
                // Start next round after a delay
                this.time.delayedCall(1500, () => this.startNextRound(roundWinner as 1 | 2));
            }
        } else {
            // Goal scored but round not over, just reset puck
            this.time.delayedCall(1000, () => this.resetPuck(player === 1));
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
        // Give puck more initial velocity for natural gameplay
        const initialSpeed = 300;
        const direction = scoredForP1 ? -1 : 1;
        // Add slight random angle for variety
        const angle = (Math.random() - 0.5) * 0.3; // Small random angle
        this.puck.setVelocity(
            Math.sin(angle) * initialSpeed * 0.3,
            direction * initialSpeed * Math.cos(angle)
        );
    }

    private setupInputControls() {
        this.input.on('pointerdown', () => {
            this.isPointerDown = true;
        });

        this.input.on('pointerup', () => {
            this.isPointerDown = false;
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isPointerDown) {
                this.moveP1To(pointer.worldX, pointer.worldY);
            }
        });
    }

    private moveP1To(x: number, y: number) {
        if (!this.isPointerDown) return;

        const sens = this.saveData.pointerSensitivity;
        const nx = Phaser.Math.Linear(this.p1.x, x, 0.35 * sens);
        const ny = Phaser.Math.Linear(this.p1.y, y, 0.35 * sens);

        const malletRadius = GameOptions.mallet.radius;
        const buffer = 5;

        // Constrain to table bounds and player zone with proper mallet radius
        const clampedX = Phaser.Math.Clamp(
            nx,
            this.tableBounds.left + malletRadius + buffer,
            this.tableBounds.right - malletRadius - buffer
        );
        const clampedY = Phaser.Math.Clamp(
            ny,
            this.p1Zone.minY,
            this.p1Zone.maxY
        );

        this.p1.setPosition(clampedX, clampedY);
    }

    update(_: number, dt: number) {
        if (this.mode === '1p') this.aiUpdate(dt);
        this.lockMalletsToHalves();
        this.constrainPuckToTable();
    }

    private aiUpdate(_: number) {
        if (!this.puck || !this.p2) return;

        const malletRadius = GameOptions.mallet.radius;

        // AI follows puck horizontally but stays in its zone
        const targetX = Phaser.Math.Clamp(
            this.puck.x,
            this.tableBounds.left + malletRadius,
            this.tableBounds.right - malletRadius
        );

        // AI defensive positioning - stay between puck and goal
        let targetY = this.p2Zone.minY + (this.p2Zone.maxY - this.p2Zone.minY) * 0.3; // Default defensive position

        // If puck is in AI's half, be more aggressive
        if (this.puck.y < (this.tableBounds.top + this.tableBounds.bottom) / 2) {
            targetY = Phaser.Math.Clamp(
                this.puck.y + 30, // Stay slightly behind puck
                this.p2Zone.minY,
                this.p2Zone.maxY
            );
        }

        // If puck is moving towards AI goal, intercept
        if (this.puck.body.velocity.y < -100) {
            const interceptX = this.puck.x + (this.puck.body.velocity.x * 0.3);
            const clampedInterceptX = Phaser.Math.Clamp(
                interceptX,
                this.tableBounds.left + malletRadius,
                this.tableBounds.right - malletRadius
            );

            // Use interpolation for smoother movement
            const lerp = 0.08;
            this.p2.x = Phaser.Math.Linear(this.p2.x, clampedInterceptX, lerp);
        } else {
            const lerp = 0.05;
            this.p2.x = Phaser.Math.Linear(this.p2.x, targetX, lerp);
        }

        // Vertical movement
        const lerpY = 0.06;
        this.p2.y = Phaser.Math.Linear(this.p2.y, targetY, lerpY);
    }

    private lockMalletsToHalves() {
        if (!this.p1 || !this.p2) return;

        const malletRadius = GameOptions.mallet.radius;
        const buffer = 5; // Small buffer for smooth movement

        // Constrain P1 (player) to bottom half with proper boundaries
        this.p1.x = Phaser.Math.Clamp(
            this.p1.x,
            this.tableBounds.left + malletRadius + buffer,
            this.tableBounds.right - malletRadius - buffer
        );
        this.p1.y = Phaser.Math.Clamp(
            this.p1.y,
            this.p1Zone.minY,
            this.p1Zone.maxY
        );

        // Constrain P2 (AI) to top half with proper boundaries
        this.p2.x = Phaser.Math.Clamp(
            this.p2.x,
            this.tableBounds.left + malletRadius + buffer,
            this.tableBounds.right - malletRadius - buffer
        );
        this.p2.y = Phaser.Math.Clamp(
            this.p2.y,
            this.p2Zone.minY,
            this.p2Zone.maxY
        );

        // Prevent mallets from going outside table bounds entirely
        if (this.p1.x - malletRadius < this.tableBounds.left) {
            this.p1.setX(this.tableBounds.left + malletRadius);
        }
        if (this.p1.x + malletRadius > this.tableBounds.right) {
            this.p1.setX(this.tableBounds.right - malletRadius);
        }
        if (this.p2.x - malletRadius < this.tableBounds.left) {
            this.p2.setX(this.tableBounds.left + malletRadius);
        }
        if (this.p2.x + malletRadius > this.tableBounds.right) {
            this.p2.setX(this.tableBounds.right - malletRadius);
        }
    }

    private constrainPuckToTable() {
        if (!this.puck || !this.puck.body) return;

        const puckRadius = GameOptions.puck.radius;
        const buffer = 3; // Smaller buffer for more natural movement

        // Check bounds and adjust position if needed
        let needsReposition = false;
        let newX = this.puck.x;
        let newY = this.puck.y;

        if (this.puck.x - puckRadius < this.tableBounds.left + buffer) {
            newX = this.tableBounds.left + puckRadius + buffer;
            needsReposition = true;
        } else if (this.puck.x + puckRadius > this.tableBounds.right - buffer) {
            newX = this.tableBounds.right - puckRadius - buffer;
            needsReposition = true;
        }

        if (this.puck.y - puckRadius < this.tableBounds.top + buffer) {
            newY = this.tableBounds.top + puckRadius + buffer;
            needsReposition = true;
        } else if (this.puck.y + puckRadius > this.tableBounds.bottom - buffer) {
            newY = this.tableBounds.bottom - puckRadius - buffer;
            needsReposition = true;
        }

        if (needsReposition) {
            this.puck.setPosition(newX, newY);
            // Preserve more velocity for natural movement
            if (Math.abs(this.puck.body.velocity.x) > 300 || Math.abs(this.puck.body.velocity.y) > 300) {
                this.puck.body.setVelocity(
                    this.puck.body.velocity.x * 0.85,
                    this.puck.body.velocity.y * 0.85
                );
            }
        }
    }

    private showRoundToast(text: string) {
        const t = this.add.text(this.scale.width / 2, this.scale.height * 0.4, text, {
            fontFamily: 'Arial Black', fontSize: '24px', color: '#fff', backgroundColor: '#00000080'
        }).setPadding(20, 10).setOrigin(0.5).setDepth(900);
        this.tweens.add({ targets: t, alpha: 0, y: t.y - 50, duration: 1500, onComplete: () => t.destroy() });
    }

    private showMatchBanner(text: string) {
        const b = this.add.text(this.scale.width / 2, this.scale.height * 0.15, text, {
            fontFamily: 'Arial Black', fontSize: '28px', color: '#0f0', backgroundColor: '#00000080'
        }).setPadding(15, 8).setOrigin(0.5).setDepth(900);
        this.tweens.add({ targets: b, alpha: 0.0, duration: 2000, delay: 800, onComplete: () => b.destroy() });
    }

    private fullRestart() {
        this.scene.restart({ skinId: 'classic', mode: this.mode, bestOf: this.bestOf });
    }
    private fullRestartToMenu() {
        this.scene.start('Menu', { skinId: 'classic', mode: this.mode });
    }
}
