import Point from './point.js';

export default class Tile {
    constructor(points) {
        this.points = points;
        this.tag = -1;
    }

    render(ctx) {
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'red';
        ctx.lineWidth = 0.01;
        if(this.points.length < 3) return;
        ctx.beginPath();
        ctx.moveTo(this.points[0].p.x, this.points[0].p.y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].p.x, this.points[i].p.y);
        }
        ctx.fill();
        ctx.stroke();
    }

    translate(v) {
        const translatedPoints = [];
        for(const p of this.points) {
            translatedPoints.push(new Point(p.p.add(v)));
        }
        return new Tile(translatedPoints);
    }
}
