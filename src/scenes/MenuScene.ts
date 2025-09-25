import { ASSET_KEYS } from '../constants/GameConfig';
import { Save, type BestOf } from '../core/Save';
import { ButtonUtils } from '../utils/Button';

export class MenuScene extends Phaser.Scene {
    private bestOf: BestOf = 3;

    constructor() { super('Menu'); }

    async create(_data?: { skinId: string; mode: '1p' | '2p' }) {
        const { width, height } = this.scale;

        // Load save data to get current bestOf setting
        const saveData = await Save.get();
        this.bestOf = saveData.bestOf;

        // Set background
        this.add.image(0, 0, ASSET_KEYS.BACKGROUND).setOrigin(0).setDisplaySize(width, height);

        // Logo/Title
        const logo = this.add.text(width / 2, height * 0.2, 'AIR\nHOCKEY', {
            font: '90px GenosRegular',
            color: '#000',
            align: 'center',
        }).setOrigin(0.5).setDepth(10);

        // Add 3D effect to logo
        this.tweens.add({
            targets: logo,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Best Of selector
        const bestOfLabel = this.add.text(width / 2, height * 0.35, 'Best of:', {
            font: '64px GenosRegular',
            color: '#000',
        }).setOrigin(0.5);

        const bestOfButtons = this.createBestOfSelector(width / 2, height * 0.4);

        // Single Player Button
        const singlePlayerBtn = ButtonUtils.createButton(this, width / 2, height * 0.55, 'Single Player', () => {
            this.scene.start('Customize', {
                mode: '1p',
                skinId: 'classic',
                bestOf: this.bestOf
            });
        });

        // Two Players Button
        const twoPlayersBtn = ButtonUtils.createButton(this, width / 2, height * 0.65, 'Two Players', () => {
            this.scene.start('Customize', {
                mode: '2p',
                skinId: 'classic',
                bestOf: this.bestOf
            });
        });

        // Add subtle animations to buttons
        [singlePlayerBtn.button, twoPlayersBtn.button].forEach((btn, index) => {
            this.tweens.add({
                targets: btn,
                alpha: 0.8,
                duration: 1500 + index * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Power2'
            });
        });
    }


    private createBestOfSelector(x: number, y: number) {
        const options: BestOf[] = [3, 5, 7];
        const spacing = 120;
        const buttons: Phaser.GameObjects.Text[] = [];

        options.forEach((option, index) => {
            const optionX = x - spacing + (index * spacing);
            const isSelected = option === this.bestOf;

            const button = this.add.text(optionX, y, option.toString(), {
                font: '48px GenosRegular',
                color: isSelected ? '#4DD0E1' : '#000',
                backgroundColor: isSelected ? '#000' : 'transparent',
                stroke: '#1565C0',
                strokeThickness: 2
            }).setOrigin(0.5)
                .setPadding(20, 10)
                .setInteractive({ useHandCursor: true });

            button.on('pointerup', async () => {
                this.bestOf = option;
                await Save.set({ bestOf: option });

                // Update all buttons
                buttons.forEach((btn, btnIndex) => {
                    const selected = options[btnIndex] === this.bestOf;
                    btn.setColor(selected ? '#4DD0E1' : '#000');
                    btn.setBackgroundColor(selected ? '#000' : 'transparent');
                });
            });

            buttons.push(button);
        });

        return buttons;
    }
}
