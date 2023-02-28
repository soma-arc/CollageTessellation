import Vec2 from './vec2.js';
import Point from './point.js';
import Tile from './tile.js';

export default class Tiles {
    constructor(intersection) {
        this.points = [];
        // this.points.push(new Point(new Vec2(0, 0)));
        // this.points.push(new Point(new Vec2(1, 0)));
        // this.points.push(new Point(new Vec2(1, 1)));
        // this.points.push(new Point(new Vec2(0.2, 1)));
        // this.points.push(new Point(new Vec2(0.2, 0.2)));
        // this.points.push(new Point(new Vec2(0, 0.2)));
        this.maxLevel = 4;

        this.points.push(new Point(new Vec2(0, 0)));
        this.points.push(new Point(new Vec2(1, 0)));
        this.points.push(new Point(new Vec2(1, 1)));
        this.points.push(new Point(new Vec2(intersection.x, 1)));
        this.points.push(new Point(new Vec2(intersection.x, intersection.y)));
        this.points.push(new Point(new Vec2(0, intersection.y)));

        // 右下
        this.translation1 = new Vec2(1 - intersection.x, -intersection.y);
        // 右
        this.translation2 = new Vec2(1, (1 - intersection.y));
        // 下
        this.translation3 = new Vec2(-intersection.x, -1);


        this.tiles = [];
        this. originalTile = new Tile(this.points);
        this.translations = [this.translation1, this.translation2, this.translation3,
                             this.translation1.scale(-1),
                             this.translation2.scale(-1),
                             this.translation3.scale(-1)];
        this.search();
    }

    search() {
        this.tiles = [];
        this.tiles.push([this.originalTile]);
        let level = 0;
        for(level = 0; level < this.maxLevel; level++) {
            this.tiles.push([]);
            for(const tile of this.tiles[level]) {
                for(let i = 0; i < this.translations.length; i++) {
                    if(tile.tag === (i + 3) % 6 ) continue;
                    const newTile = tile.translate(this.translations[i]);
                    newTile.tag = i;
                    this.tiles[level + 1].push(newTile);
                }
            }
        }
    }

    hsvToRgb(H, S, V) {
        //https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV

        const C = V * S;
        const Hp = H / 60;
        const X = C * (1 - Math.abs(Hp % 2 - 1));

        let R, G, B;
        if (0 <= Hp && Hp < 1) { [R, G, B] = [C, X, 0]; }
        if (1 <= Hp && Hp < 2) { [R, G, B] = [X, C, 0]; }
        if (2 <= Hp && Hp < 3) { [R, G, B] = [0, C, X]; }
        if (3 <= Hp && Hp < 4) { [R, G, B] = [0, X, C]; }
        if (4 <= Hp && Hp < 5) { [R, G, B] = [X, 0, C]; }
        if (5 <= Hp && Hp < 6) { [R, G, B] = [C, 0, X]; }

        const m = V - C;
        [R, G, B] = [R + m, G + m, B + m];

        R = Math.floor(R * 255);
        G = Math.floor(G * 255);
        B = Math.floor(B * 255);

        return [R, G, B];
    }

    render(ctx) {
        let level = 0;
        for(const tileArray of this.tiles) {
            console.log(this.tiles[level]);
            const [r, g, b] = this.hsvToRgb(100 * level, 1.0, 1.0);
            console.log(`rgb(${r},${g},${b})`);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            for(const tile of tileArray) {
                tile.render(ctx);
            }
            level++;
        }
    }
}
