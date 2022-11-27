import Vec2 from './vec2.js';
import MouseState from './mouseState.js';
import SelectionState from './selectionState.js';

/**
 * @module {Point}
 */
export default class Point {
    /** @type {Vec2} */
    p = new Vec2(0, 0);
    /** @type {Array.<WebGLUniformLocation>} */
    uniformLocations = [];
    /** @type {Number} */
    uiPointRadius = 0.01;

    /**
     * @param {Vec2} p
     */
    constructor(p) {
        this.p = p;
    }

    /**
     * @param {WebGL2RenderingContext} gl
     * @param {WebGLProgram} program
     * @param {Number} index
     */
    setUniformLocations(gl, program, index) {
        this.uniformLocations = [];
        this.uniformLocations.push(gl.getUniformLocation(program, `u_point${index}.p`));
        this.uniformLocations.push(gl.getUniformLocation(program, `u_point${index}.radius`));
    }

    /**
     * @param {WebGL2RenderingContext} gl
     * @param {Number} sceneScale
     */
    setUnifomValues(gl, sceneScale) {
        gl.uniform2f(this.uniformLocations[0], this.p.x, this.p.y);
        gl.uniform1f(this.uniformLocations[1], this.uiPointRadius * sceneScale);
    }

    /**
     * @param {MouseState} mouseState
     * @param {Number} sceneScale
     * @param {Number} selectionScale
     * @returns {SelectionState}
     */
    select(mouseState, sceneScale) {
        const mousePos = mouseState.position;
        const dp = mousePos.sub(this.center);
        const d = dp.length();
        if (d > this.uiPointRadius * sceneScale) return new SelectionState();

        return new SelectionState().setObj(this)
            .setComponentId(Point.COMPONENT_BODY)
            .setDiffObj(dp)
            .setPrevPosition(this.p);
    }

    /**
     * @param {MouseState} mouseState
     * @param {SelectionState} selectionState
     * @returns {Boolean}
     */
    move(mouseState, selectionState) {
        if (selectionState.componentId === Point.COMPONENT_BODY) {
            const mousePos = mouseState.position;
            this.p = mousePos.sub(selectionState.diffObj);
            return true;
        }
        return false;
    }

    /**
     * @returns {Number}
     */
    static get COMPONENT_BODY() {
        return 0;
    }
}
