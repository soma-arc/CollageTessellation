import GLUtils from './glUtils';
import MouseState from './mouseState.js';
import Vec2 from './vec2.js';
import Scene from './scene.js';

/** @type {String} */
const RENDER_VERTEX = require('./shader/render.vert');
/** @type {String} */
const RENDER_FRAGMENT = require('./shader/render.frag');

/**
 * @module Canvas
 */
export default class Canvas {
    /** @type {String} */
    canvasId = '';
    /** @type {HTMLCanvasElement} */
    canvas = undefined;
    /** @type {Number} */
    canvasAspectRatio = 0;
    /** @type {WebGL2RenderingContext} */
    gl = undefined;
    /** @type {MouseState} */
    mouseState = new MouseState();
    /** @type {Scene} */
    scene;
    uniformLocations = [];
    /**
     * @param {String} canvasId;
     * @param {Scene} scene;
     */
    constructor(canvasId, scene) {
        this.canvasId = canvasId;
        this.scene = scene;
    }

    init() {
        this.canvas = document.getElementById(this.canvasId);
        this.canvasAspectRatio = this.canvas.width / this.canvas.height / 2;
        this.gl = GLUtils.GetWebGL2Context(this.canvas);

        this.vertexBuffer = GLUtils.CreateSquareVbo(this.gl);

        this.renderCanvasProgram = this.gl.createProgram();
        GLUtils.AttachShader(this.gl, RENDER_VERTEX,
                             this.renderCanvasProgram, this.gl.VERTEX_SHADER);
        GLUtils.AttachShader(this.gl, RENDER_FRAGMENT,
                             this.renderCanvasProgram, this.gl.FRAGMENT_SHADER);
        GLUtils.LinkProgram(this.gl, this.renderCanvasProgram);
        this.renderCanvasVAttrib = this.gl.getAttribLocation(this.renderCanvasProgram,
                                                             'a_vertex');
        this.#setRenderUniformLocations();
    }

    enableDefaultMouseListeners() {
        this.canvas.addEventListener('mousedown', this.#onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.#onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.#onMouseUp.bind(this));
    }

    #setRenderUniformLocations() {
        this.scene.setUniformLocations(this.gl, this.renderCanvasProgram);
        this.uniformLocations = [];
        this.uniformLocations.push(this.gl.getUniformLocation(this.renderCanvasProgram, 'u_resolution'));
    }

    #setRenderUniformValues() {
        this.scene.setUniformValues(this.gl);
        let index = 0;
        this.gl.uniform2f(this.uniformLocations[index], this.canvas.width, this.canvas.height);
    }

    render() {
        this.#setRenderUniformValues();
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.useProgram(this.renderCanvasProgram);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.enableVertexAttribArray(this.renderCanvasVAttrib);
        this.gl.vertexAttribPointer(this.renderCanvasVAttrib, 2,
                                    this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.flush();
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
        return new Vec2(this.scene.scale * (((mx - rect.left)) /
                                            this.canvas.height - this.canvasRatio),
                        this.scene.scale * - (((my - rect.top)) /
                                              this.canvas.height - 0.5));
    }

    /**
     * Calculate coordinates on scene (consider translation) from mouse position
     * @param {number} mx
     * @param {number} my
     * @returns {Vec2}
     */
    calcSceneCoord(mx, my) {
        return this.calcCanvasCoord(mx, my).add(this.scene.translate);
    }

    /**
     * @param {MouseEvent} event
     */
    #onMouseDown(event) {
        event.preventDefault();
        this.canvas.focus();
        this.mouseState.setPosition(this.calcCanvasCoord(event.clientX, event.clentY));

        if(event.button === MouseState.BUTTON_LEFT) {
            this.scene.select(this.mouseState);
            this.render();
        }

        this.mouseState.setButton(event.button)
            .setPrevTranslate(this.scene.translate)
            .setIsPressing(true);
    }

    #onMouseMove(event) {
        this.mouseState.setPosition(this.calcCanvasCoord(event.clientX, event.clientY));
        if(!this.mouseState.isPressing) return;
        if(this.mouseState.button === MouseState.BUTTON_LEFT) {
            const moved = this.scene.move(this.mouseState);
            if(moved) this.render();
        }
    }

    #onMouseUp() {
        this.mouseState = new MouseState();
    }
}
