import Point from './point';
import SelectionState from './selectionState';
import MouseState from './mouseState';

/**
 * @module {FundamentalDomain}
 */
export default class FundamentalDomain {
    /** @type {Point} */
    leftBottom = new Point(0, 0);
    /** @type {Point} */
    leftTop = new Point(0, 0);
    /** @type {Point} */
    rightTop = new Point(0, 0);
    /** @type {Point} */
    rightBottom = new Point(0, 0);
    /** @type {Array.<WebGLUniformLocation>} */
    uniformLocations = [];
    /** @type {Number} */
    pointRadius = 0.01;

    /**
     * @param {Point} leftBottom
     * @param {Point} leftTop
     * @param {Point} rightTop
     * @param {Point} rightBottom
     */
    constructor(leftBottom, leftTop, rightTop, rightBottom) {
        console.log(leftBottom);
        console.log(leftTop);
        console.log(rightTop);
        console.log(rightBottom);
        this.leftBottom = leftBottom;
        this.leftTop = leftTop;
        this.rightTop = rightTop;
        this.rightBottom = rightBottom;
    }

    /**
     * @param {WebGL2RenderingContext} gl
     * @param {WebGLProgram} program
     * @param {Number} index
     */
    setUniformLocations(gl, program, index) {
        this.uniformLocations = [];
        this.uniformLocations.push(gl.getUniformLocation(program, `u_fundamentalDomain${index}.leftBottom`));
        this.uniformLocations.push(gl.getUniformLocation(program, `u_fundamentalDomain${index}.leftTop`));
        this.uniformLocations.push(gl.getUniformLocation(program, `u_fundamentalDomain${index}.rightTop`));
        this.uniformLocations.push(gl.getUniformLocation(program, `u_fundamentalDomain${index}.rightBottom`));
        this.uniformLocations.push(gl.getUniformLocation(program, `u_fundamentalDomain${index}.pointRadius`));        
    }

    /**
     * @param {WebGL2RenderingContext} gl
     * @param {Number} sceneScale
     */
    setUniformValues(gl, sceneScale) {
        gl.uniform2f(this.uniformLocations[0], this.leftBottom.p.x, this.leftBottom.p.y);
        gl.uniform2f(this.uniformLocations[1], this.leftTop.p.x, this.leftTop.p.y);
        gl.uniform2f(this.uniformLocations[2], this.rightTop.p.x, this.rightTop.p.y);
        gl.uniform2f(this.uniformLocations[3], this.rightBottom.p.x, this.rightBottom.p.y);
        gl.uniform1f(this.uniformLocations[4], this.pointRadius * sceneScale);
    }
    
    /**
     * @param {MouseState} mouseState
     * @param {Number} sceneScale
     * @returns {SelectionState}
     */
    select(mouseState, sceneScale) {
        const leftBottomState = this.#selectPoint(this.leftBottom, FundamentalDomain.COMPONENT_LEFT_BOTTOM,
                                                  mouseState, sceneScale);
        if (leftBottomState.isSelectingObj()) return leftBottomState;
        const leftTopState = this.#selectPoint(this.leftTop, FundamentalDomain.COMPONENT_LEFT_TOP,
                                               mouseState, sceneScale);
        if (leftTopState.isSelectingObj()) return leftTopState;
        const rightTopState = this.#selectPoint(this.rightTop, FundamentalDomain.COMPONENT_RIGHT_TOP,
                                                mouseState, sceneScale);
        if (rightTopState.isSelectingObj()) return rightTopState;
        const rightBottomState = this.#selectPoint(this.rightBottom, FundamentalDomain.COMPONENT_RIGHT_BOTTOM,
                                                   mouseState, sceneScale);
        if (rightBottomState.isSelectingObj()) return rightBottomState;

        return new SelectionState();
    }

    /**
     * @param {Point} point
     * @param {Number} componentId
     * @param {MouseState} mouseState
     * @param {Number} sceneScale
     * @returns {SelectionState}
     */
    #selectPoint(point, componentId, mouseState, sceneScale) {
        const state = point.select(mouseState, sceneScale);
        if (state.isSelectingObj()) {
            return new SelectionState().setObj(this)
                .setComponentId(componentId)
                .setDiffObj(state.diffObj)
                .setPrevPosition(point);
        }

        return new SelectionState();
    }

    /**
     * @param {MouseState} mouseState
     * @param {SelectionState} selectionState
     * @returns {Boolean}
     */
    move(mouseState, selectionState) {
        const mousePos = mouseState.position;
        switch (selectionState.componentId) {
        case FundamentalDomain.COMPONENT_LEFT_BOTTOM: {
            this.leftBottom.setPosition(mousePos.sub(selectionState.diffObj));
            return true;
        }
        case FundamentalDomain.COMPONENT_LEFT_TOP: {
            const v = this.rightTop.p.sub(this.leftTop.p);
            this.leftTop.setPosition(mousePos.sub(selectionState.diffObj));
            this.rightTop.setPosition(this.leftTop.p.add(v));
            return true;
        }
        case FundamentalDomain.COMPONENT_RIGHT_TOP: {
            const v = this.leftTop.p.sub(this.rightTop.p);
            this.rightTop.setPosition(mousePos.sub(selectionState.diffObj));
            this.leftTop.setPosition(this.rightTop.p.add(v));
            return true;
        }
        case FundamentalDomain.COMPONENT_RIGHT_BOTTOM: {
            this.rightBottom.setPosition(mousePos.sub(selectionState.diffObj));
            return true;
        }
        }

        return false;
    }

    static get COMPONENT_LEFT_BOTTOM() {
        return 0;
    }

    static get COMPONENT_LEFT_TOP() {
        return 1;
    }

    static get COMPONENT_RIGHT_TOP() {
        return 2;
    }

    static get COMPONENT_RIGHT_BOTTOM() {
        return 3;
    }
}

