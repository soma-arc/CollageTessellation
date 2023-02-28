import Tiles from './tiles.js';
import Rect from './rect.js';
import Vec2 from './vec2.js';
import MouseState from './mouseState.js';

export default class CTX2dCanvas {
    constructor() {
        this.canvas = document.getElementById('ctx2dcanvas');
        this.canvasAspectRatio = this.canvas.width / this.canvas.height / 2;
        this.ctx = this.canvas.getContext('2d');

        this.originRect = new Rect(new Vec2(0, 0), new Vec2(1, 0), new Vec2(1, 1), new Vec2(0, 1));
        this.rect = new Rect(new Vec2(-0.6, 0.4), new Vec2(0.4, 0.4), new Vec2(0.4, 1.4), new Vec2(-0.6, 1.4));
        const intersection = Rect.ComputeIntersection(this.originRect, this.rect);
        console.log(intersection);
        this.tiles = new Tiles(intersection);

        this.canvas.addEventListener('mousedown', this.#onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.#onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.#onMouseUp.bind(this));
        this.canvas.addEventListener('keydown', this.#onKeyDown.bind(this));

        this.scale = 0.1;
        this.translation = new Vec2(0.5, 0.5);

        this.mouseState = new MouseState();
    }

    /**
     * Calculate screen coordinates from mouse position
     * scale * [-width/2, width/2]x[-height/2, height/2]
     * @param {number} mx
     * @param {number} my
     * @returns {Vec2}
     */
    calcCanvasCoord(mx, my) {
        const rect = this.canvas.getBoundingClientRect();
        return new Vec2(((mx - rect.left) / this.canvas.width - this.translation.x) / this.scale,
                        ((this.canvas.height - (my - rect.top)) / this.canvas.height - this.translation.y) / this.scale);
    }

    /**
     * Calculate coordinates on scene (consider translation) from mouse position
     * @param {number} mx
     * @param {number} my
     * @returns {Vec2}
     */
    calcSceneCoord(mx, my) {
        return this.calcCanvasCoord(mx, my);
    }

    #onMouseDown(event) {
        event.preventDefault();
        this.canvas.focus();

        this.mouseState.setPosition(this.calcSceneCoord(event.clientX, event.clientY))
            .setButton(event.button)
            .setIsPressing(true);

        if (event.button === MouseState.BUTTON_LEFT) {
            this.selectionState = this.rect.select(this.mouseState);
            console.log(this.selectionState);
        }
    }

    #onMouseMove(event) {
        event.preventDefault();
        this.mouseState.setPosition(this.calcSceneCoord(event.clientX, event.clientY));
        if (!this.mouseState.isPressing) return;
        if (this.mouseState.button === MouseState.BUTTON_LEFT) {
            if (this.selectionState.isSelectingObj()) {
                const moved = this.rect.move(this.mouseState, this.selectionState);
                if (moved) {
                    const intersection = Rect.ComputeIntersection(this.originRect, this.rect);
                    const maxLevel = this.tiles.maxLevel;
                    this.tiles = new Tiles(intersection);
                    this.tiles.maxLevel = maxLevel;
                    this.tiles.search();
                    this.render();
                }
            }
        }
    }

    #onMouseUp() {
        this.mouseState = new MouseState();
    }

    #onKeyDown(event) {
        console.log('keydown');
        if (event.key === '+') {
            this.tiles.maxLevel++;
            this.tiles.search();
            this.render();
        } else if (event.key === '-') {
            this.tiles.maxLevel--;
            this.tiles.search();
            this.render();
        }
    }

    render() {
        this.ctx.save();

        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 左下原点, y+を上にする.
        this.ctx.translate(0, this.canvas.height);
        this.ctx.scale(this.canvas.width, -this.canvas.height);
        // キャンバスの中心を原点にする.
        this.ctx.translate(this.translation.x, this.translation.y);
        this.ctx.scale(this.scale, this.scale);

        this.tiles.render(this.ctx);
        //this.originRect.render(this.ctx);
        //this.rect.render(this.ctx);

        // Draw axis
        this.ctx.strokeStyle = 'blue';
        this.ctx.lineWidth = 0.02;
        this.ctx.beginPath();
        this.ctx.moveTo(-100, 0);
        this.ctx.lineTo(100, 0);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(0, -100);
        this.ctx.lineTo(0, 100);
        this.ctx.stroke();

        this.ctx.setLineDash([0.1, 0.1]);
        this.ctx.strokeStyle = 'blue';
        this.ctx.lineWidth = 0.01;
        // x = 1
        this.ctx.beginPath();
        this.ctx.moveTo(1, -100);
        this.ctx.lineTo(1, 100);
        this.ctx.stroke();
        // x = 0.5
        this.ctx.beginPath();
        this.ctx.moveTo(0.5, -100);
        this.ctx.lineTo(0.5, 100);
        this.ctx.stroke();
        // y = 1
        this.ctx.beginPath();
        this.ctx.moveTo(-100, 1);
        this.ctx.lineTo(100, 1);
        this.ctx.stroke();

        this.ctx.strokeStyle = 'yellow';
        // x = 0.25
        this.ctx.beginPath();
        this.ctx.moveTo(0.25, -100);
        this.ctx.lineTo(0.25, 100);
        this.ctx.stroke();
        // x = 0.75
        this.ctx.beginPath();
        this.ctx.moveTo(0.75, -100);
        this.ctx.lineTo(0.75, 100);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        this.ctx.restore();
    }
}
