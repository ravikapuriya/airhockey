import { ASSET_KEYS } from '../constants/GameConfig';

export interface ButtonConfig {
    width?: number;
    height?: number;
    fontSize?: string;
    fontColor?: string;
    strokeColor?: string;
    strokeThickness?: number;
    scaleOnHover?: number;
    scaleOnPress?: number;
}

export interface ButtonElements {
    button: Phaser.GameObjects.NineSlice;
    text: Phaser.GameObjects.Text;
}

export class ButtonUtils {
    static createButton(
        scene: Phaser.Scene,
        x: number,
        y: number,
        text: string,
        onClick: () => void,
        config?: ButtonConfig
    ): ButtonElements {
        const buttonWidth = config?.width ?? 400;
        const buttonHeight = config?.height ?? 80;
        const fontSize = config?.fontSize ?? '48px GenosRegular';
        const fontColor = config?.fontColor ?? '#000';
        const strokeColor = config?.strokeColor ?? '#1565C0';
        const strokeThickness = config?.strokeThickness ?? 3;
        const scaleOnHover = config?.scaleOnHover ?? 1.05;
        const scaleOnPress = config?.scaleOnPress ?? 0.95;

        // Create nineslice button background
        const button = scene.add.nineslice(
            x, y,
            ASSET_KEYS.COMMON_BUTTON,
            0,
            buttonWidth,
            buttonHeight,
            20, 20, 20, 20
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Add button text
        const buttonText = scene.add.text(x, y, text, {
            font: fontSize,
            color: fontColor,
            stroke: strokeColor,
            strokeThickness: strokeThickness
        }).setOrigin(0.5).setDepth(1);

        // Button interactions
        button.on('pointerover', () => {
            button.setScale(scaleOnHover);
            buttonText.setScale(scaleOnHover);
        });

        button.on('pointerout', () => {
            button.setScale(1);
            buttonText.setScale(1);
        });

        button.on('pointerdown', () => {
            button.setScale(scaleOnPress);
            buttonText.setScale(scaleOnPress);
        });

        button.on('pointerup', () => {
            button.setScale(scaleOnHover);
            buttonText.setScale(scaleOnHover);
            onClick();
        });

        return { button, text: buttonText };
    }
}
