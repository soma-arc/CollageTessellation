import Point from './point';
import SelectionState from './selectionState';
import MouseState from './mouseState';

export default class Orbit {
    /** @type {Number} */
    numPoints = 5;
    /** @type {Point} */
    origin = new Point(0, 0);
    /** @type {Number} */
    pointRadius = 0.01;

    /**
     * @param {Point}
     */
    constructor(origin) {
        this.origin = origin;
    }

    /**
     * @param {WebGL2RenderingContext} gl
     * @param {WebGLProgram} program
     * @param {Number} index
     */
    setUniformLocations(gl, program, index) {
        this.uniformLocations = [];
        this.uniformLocations.push(gl.getUniformLocation(program, 'u_orbitOrigin.p'));
        this.uniformLocations.push(gl.getUniformLocation(program, 'u_orbitOrigin.radius'));
    }

    /**
     * @param {WebGL2RenderingContext} gl
     * @param {Number} sceneScale
     */
    setUniformValues(gl, sceneScale) {
        gl.uniform2f(this.uniformLocations[0], this.origin.p.x, this.origin.p.y);
        gl.uniform1f(this.uniformLocations[1], this.pointRadius * sceneScale);
    }

    /**
     * @param {MouseState} mouseState
     * @param {Number} sceneScale
     * @returns {SelectionState}
     */
    select(mouseState, sceneScale) {
        const state = this.origin.select(mouseState, sceneScale);
        if (state.isSelectingObj()) {
            return new SelectionState().setObj(this)
                .setComponentId(Orbit.COMPONENT_ORIGIN)
                .setDiffObj(state.diffObj)
                .setPrevPosition(this.origin);
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
        case Orbit.COMPONENT_ORIGIN: {
            this.origin.setPosition(mousePos.sub(selectionState.diffObj));
            return true;
        }
        }

        return false;
    }

    static get COMPONENT_ORIGIN() {
        return 0;
    }
}
