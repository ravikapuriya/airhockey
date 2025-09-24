export class HUD {
    private p1ScoreText!: Phaser.GameObjects.Text;
    private p2ScoreText!: Phaser.GameObjects.Text;

    constructor(private scene: Phaser.Scene) { }

    create(_: '1P' | '2P') {
        const { width } = this.scene.scale;

        // Position scores in corner boxes like the reference image
        // Player 1 score (bottom player) - top left corner box with pink background
        this.scene.add.rectangle(100, 50, 140, 70, 0x000000)
            .setStrokeStyle(4, 0xffffff)
            .setDepth(99);

        this.p1ScoreText = this.scene.add.text(100, 50, '001', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '36px',
            color: '#ff1744',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);

        // Player 2 score (top player) - top right corner box with cyan background
        this.scene.add.rectangle(width - 100, 50, 140, 70, 0x000000)
            .setStrokeStyle(4, 0xffffff)
            .setDepth(99);

        this.p2ScoreText = this.scene.add.text(width - 100, 50, '000', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '36px',
            color: '#00e5ff',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);

        // Pause button (top center) - yellow rounded rectangle like reference
        const pauseBox = this.scene.add.rectangle(width / 2, 50, 80, 70, 0xFFD700)
            .setStrokeStyle(4, 0x000000)
            .setDepth(99)
            .setInteractive({ useHandCursor: true });

        this.scene.add.text(width / 2, 50, '⏸⏸', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '24px',
            color: '#E91E63',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(100);

        pauseBox.on('pointerup', () => {
            this.scene.scene.pause();
            this.scene.events.emit('showPause');
        });
    }

    setScore(p1: number, p2: number) {
        this.p1ScoreText.setText(p1.toString().padStart(3, '0'));
        this.p2ScoreText.setText(p2.toString().padStart(3, '0'));
    }
}