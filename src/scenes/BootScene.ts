import { AUDIO_ASSETS, GameOptions, IMAGE_ASSETS } from '../constants/GameConfig';

export class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }

    init(): void {
        const barX: number = (this.game.config.width as number - GameOptions.preloadBar.size.width) / 2;
        const barY: number = (this.game.config.height as number - GameOptions.preloadBar.size.height) / 2;
        const bar: Phaser.GameObjects.Rectangle = this.add.rectangle(barX, barY, 1, GameOptions.preloadBar.size.height, GameOptions.preloadBar.color.fill);
        bar.setOrigin(0);

        const loadingText = this.add.text(this.game.config.width as number / 2, barY - 30, 'Loading...', {
            font: '800 24px system-ui',
            color: '#6AF3FD'
        }).setOrigin(0.5);
        loadingText.setDepth(1);

        this.add.rectangle(barX, barY, GameOptions.preloadBar.size.width, GameOptions.preloadBar.size.height).setStrokeStyle(GameOptions.preloadBar.size.border, GameOptions.preloadBar.color.container).setOrigin(0);

        this.load.on('progress', (progress: number) => {
            bar.width = GameOptions.preloadBar.size.width * progress;
        });

        this.load.on('complete', () => {
            bar.destroy();
            loadingText.destroy();
        });
    }


    preload() {
        const allAssetUrls = import.meta.glob('/assets/**/*', {
            eager: true,
            query: '?url',
            import: 'default'
        }) as Record<string, string>;
        const toUrl = (path: string) => {
            const normalized = path.startsWith('/') ? path : `/${path}`;
            return allAssetUrls[normalized] ?? normalized;
        };

        // for (const a of ATLAS_ASSETS) {
        //     this.load.atlas(a.assetKey, toUrl(a.path), toUrl(a.jsonPath));
        // }

        for (const i of IMAGE_ASSETS) {
            this.load.image(i.assetKey, toUrl(i.path));
        }

        for (const au of AUDIO_ASSETS) {
            this.load.audio(au.assetKey, toUrl(au.path));
        }

        // for (const j of JSON_ASSETS) {
        //     this.load.json(j.assetKey, toUrl(j.path));
        // }
    }

    async create() {
        const params = new URLSearchParams(window.location.search);
        const mode = (params.get('mode') ?? '1p').toLowerCase() === '2p' ? '2p' : '1p';

        this.scene.start('Menu', { mode });
    }
}
