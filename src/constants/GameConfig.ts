export const IS_BUILD = import.meta.env.PROD;

export const SCENE_KEYS = Object.freeze({
    BOOT: 'Boot',
    MENU: 'Menu',
    GAME: 'Game',
});

export const GameOptions = {
    preloadBar: {
        size: {
            width: 200,
            height: 20,
            border: 3,
        },
        color: {
            fill: 0x6AF3FD,
            container: 0x1A2548,
        },
    },
    gameWidth: 1080,
    gameHeight: 1920,
    table: {
        width: 1080,
        height: 1700,
        wallThickness: 30,
        goalWidth: 280,
        goalDepth: 40,
        edgeHeight: 60
    },
    puck: {
        radius: 30,
        bounce: 1.0,
        maxSpeed: 1200
    },
    mallet: {
        radius: 50
    }
};

export const EVENT_KEYS = Object.freeze({
    GAME_START: 'gameStart',
    GAME_OVER: 'gameOver',
    GAME_PAUSED: 'gamePaused',
    GAME_RESUMED: 'gameResumed',
});

export const ASSET_KEYS = Object.freeze({
    // Images
    COMMON_BUTTON: 'COMMON_BUTTON',
    TABLE: 'TABLE',
    TABLE_EDGE: 'TABLE_EDGE',
    BACKGROUND: 'BACKGROUND',
    MALLET: 'MALLET',
    PUCK: 'PUCK',

    // Audio
    SFX_BTN_CLICK: 'SFX_BTN_CLICK',
    GAME_MUSIC_LOOP: 'GAME_MUSIC_LOOP',
});

export const IMAGE_ASSETS = [
    {
        assetKey: ASSET_KEYS.COMMON_BUTTON,
        path: 'assets/images/button.png'
    },
    {
        assetKey: ASSET_KEYS.TABLE,
        path: 'assets/images/table.png'
    },
    {
        assetKey: ASSET_KEYS.TABLE_EDGE,
        path: 'assets/images/table-edge.png'
    },
    {
        assetKey: ASSET_KEYS.BACKGROUND,
        path: 'assets/images/bg.jpg'
    },
    {
        assetKey: ASSET_KEYS.MALLET,
        path: 'assets/skins/mallet/mallet.png'
    },
    {
        assetKey: ASSET_KEYS.PUCK,
        path: 'assets/skins/puck/puck.png'
    }
];

export const AUDIO_ASSETS = [
    {
        assetKey: ASSET_KEYS.GAME_MUSIC_LOOP,
        path: 'assets/sounds/game-music-loop.mp3',
        loop: true,
        volume: 0.3,
    },
    {
        assetKey: ASSET_KEYS.SFX_BTN_CLICK,
        path: 'assets/sounds/click-sfx.ogg',
        loop: false,
        volume: 0.8,
    },
];
