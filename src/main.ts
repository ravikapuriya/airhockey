import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOptions } from './constants/GameConfig';
import { CustomizeScene } from './scenes/CustomizeScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    // backgroundColor: '#3FC7EA',
    transparent: true,
    scale: {
        mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GameOptions.gameWidth,
        height: GameOptions.gameHeight
    },
    physics: {
        default: 'arcade',

        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, CustomizeScene, GameScene]
};

new Phaser.Game(config);
