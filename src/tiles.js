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
        const maxLevel = 4;
        for(level = 0; level < maxLevel; level++) {
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

    render(ctx) {
        ctx.fillStyle = 'red';
        for(const tileArray of this.tiles) {
            for(const tile of tileArray) {
                tile.render(ctx);
            }
        }
    }
}
