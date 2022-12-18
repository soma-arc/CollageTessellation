import Point from './point.js';
import Vec2 from './vec2.js';
import SelectionState from './selectionState.js';
import MouseState from './mouseState.js';

export default class Scene {
    /** @type {Array.<Point>} */
    objects = [];
    /** @type {Number} */
    scale = 10.0;
    /** @type {Vec2} */
    translate = new Vec2(0, 0);
    /** @type {SelectionState} */
    selectionState = new SelectionState();
    /** @type {Array.<WebGLUniformLocation>} */
    uniformLocations = [];
    /**
     *
     */
    constructor() {
        this.objects.push(new Point(new Vec2(0, 0)));
        this.objects.push(new Point(new Vec2(0, 1)));
        this.objects.push(new Point(new Vec2(1, 0)));
        this.objects.push(new Point(new Vec2(1, 1)));
    }

    /**
     * @param {WebGL2RenderingContext} gl
     * @param {WebGLProgram} program
     */
    setUniformLocations(gl, program) {
        let index = 0;
        for(const obj of this.objects) {
            obj.setUniformLocations(gl, program, index);
            index++;
        }

        this.uniformLocations = [];
        this.uniformLocations.push(gl.getUniformLocation(program, 'u_scale'));
        this.uniformLocations.push(gl.getUniformLocation(program, 'u_translate'));
    }

    /**
     * @param {WebGL2RenderingContext} gl
     */
    setUniformValues(gl) {
        for(const obj of this.objects) {
            obj.setUnifomValues(gl, this.scale);
        }

        let index = 0;
        gl.uniform1f(this.uniformLocations[index++], this.scale);
        gl.uniform2f(this.uniformLocations[index++], this.translate.x, this.translate.y);
    }

    /**
     * @param {MouseState} mouseState
     * @returns {Boolean}
     */
    select(mouseState) {
        for(const obj of this.objects) {
            this.selectionState = obj.select(mouseState, this.scale);
            if(this.selectionState.isSelectingObj()) return true;
        }
        return false;
    }

    /**
     * @param {MouseState} mouseState
     * @returns {Boolean}
     */
    move(mouseState) {
        if(this.selectionState.isSelectingObj()) {
            const moved = this.selectionState.selectedObj.move(mouseState, this.selectionState);
            if(moved) return true;
        }
        return false;
    }
}
