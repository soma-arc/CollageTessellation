import MouseState from './mouseState.js';
import SelectionState from './selectionState.js';
import Vec2 from './vec2.js';

export default class Rect{
    constructor(leftBottom, rightBottom, rightTop, leftTop) {
        this.leftBottom = leftBottom;
        this.rightBottom = rightBottom;
        this.rightTop = rightTop;
        this.leftTop = leftTop;

        this.width = rightBottom.x - leftBottom.x;
        this.height = leftTop.y - leftBottom.y;
    }

    static ComputeIntersection(rect1, rect2) {
        // if(rect2.rightBottom.x < rect1.leftBottom.x) return undefined;
        // if(rect2.leftBottom.x > rect1.rightBottom.x) return undefined;
        // if(rect2.rightBottom.y < rect1.leftBottom.y) return undefined;
        // if(rect2.leftBottom.y > rect1.rightBottom.y) return undefined;
        // rect1とrect2は同じ大きさであることを仮定
        return rect2.rightBottom;
    }

    click(x, y) {
        if(this.leftBottom.x < x  && x < this.rightBottom.x &&
           this.leftBottom.y < y && y < this.leftTop.y) {
            return true;
        }
        return false;
    }

    /**
     * @param {MouseState} mouseState
     * @param {Number} sceneScale
     * @returns {SelectionState}
     */
    select(mouseState) {
        const x = mouseState.position.x;
        const y = mouseState.position.y;
        if(this.leftBottom.x < x  && x < this.rightBottom.x &&
           this.leftBottom.y < y && y < this.leftTop.y) {
            const dp = mouseState.position.sub(this.leftBottom);
            return new SelectionState().setObj(this)
                .setComponentId(Rect.COMPONENT_BODY)
                .setDiffObj(dp)
                .setPrevPosition(this.leftBottom.x, this.leftBottom.y);
        }
        return new SelectionState();
    }

    /**
     * @param {MouseState} mouseState
     * @param {SelectionState} selectionState
     * @returns {Boolean}
     */
    move(mouseState, selectionState) {
        if (selectionState.componentId === Rect.COMPONENT_BODY) {
            const mousePos = mouseState.position;
            const newLeftBottom = mousePos.sub(selectionState.diffObj);
            this.leftBottom = newLeftBottom;
            this.rightBottom = this.leftBottom.add(new Vec2(this.width, 0));
            this.rightTop = this.leftBottom.add(new Vec2(this.width, this.height));
            this.leftTop = this.leftBottom.add(new Vec2(0, this.height));
            return true;
        }
        return false;
    }

    render(ctx) {
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'red';
        ctx.lineWidth = 0.01;
        ctx.beginPath();
        ctx.moveTo(this.leftBottom.x, this.leftBottom.y);
        ctx.lineTo(this.rightBottom.x, this.rightBottom.y);
        ctx.lineTo(this.rightTop.x, this.rightTop.y);
        ctx.lineTo(this.leftTop.x, this.leftTop.y);
        ctx.fill();
        ctx.stroke();
    }
    
    /**
     * @returns {Number}
     */
    static get COMPONENT_BODY() {
        return 0;
    }
}
