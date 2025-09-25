export class TextureFactory {
    constructor(private scene: Phaser.Scene) { }

    table(key: string, w: number, h: number, r: number = 20, fill?: number, line?: number) {
        // Check if we already have an image texture loaded
        if (this.scene.textures.exists('table')) {
            // Use the preloaded image texture instead of generating one
            return;
        }

        // Fallback to procedural generation if no image is available
        const g = this.scene.add.graphics({ x: 0, y: 0 });
        g.fillStyle(fill || 0x2d4a2b, 1);
        g.lineStyle(4, line || 0x4d6a4b, 1);
        this.roundRect(g, 0, 0, w, h, r, true, true);
        g.lineBetween(w / 2, 20, w / 2, h - 20);
        g.strokeCircle(w / 2, h / 4, 36);
        g.strokeCircle(w / 2, 3 * h / 4, 36);
        g.generateTexture(key, w, h);
        g.destroy();
    }

    disc(key: string, radius: number, color?: number, glow = false) {
        // Check if we already have an image texture loaded
        if (this.scene.textures.exists(key)) {
            // Use the preloaded image texture instead of generating one
            return;
        }

        // Fallback to procedural generation if no image is available
        const size = radius * 4;
        const g = this.scene.add.graphics({ x: 0, y: 0 });
        const finalColor = color || 0xffffff;

        if (glow) {
            g.fillStyle(finalColor, 0.15);
            g.fillCircle(size / 2, size / 2, radius * 1.6);
        }
        g.fillStyle(finalColor, 1).fillCircle(size / 2, size / 2, radius);
        g.lineStyle(4, 0x000000, 0.15).strokeCircle(size / 2, size / 2, radius * 0.65);
        g.generateTexture(key, size, size);
        g.destroy();
    }

    private roundRect(
        g: Phaser.GameObjects.Graphics,
        x: number, y: number, w: number, h: number, r: number,
        doFill: boolean, doStroke: boolean
    ) {
        const min = Math.min(w, h) / 2;
        if (r > min) r = min;
        g.beginPath();
        g.moveTo(x + r, y);
        g.lineTo(x + w - r, y);
        g.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
        g.lineTo(x + w, y + h - r);
        g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
        g.lineTo(x + r, y + h);
        g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
        g.lineTo(x, y + r);
        g.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI);
        g.closePath();
        if (doFill) g.fillPath();
        if (doStroke) g.strokePath();
    }
}
