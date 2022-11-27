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
    /** @type {WebGL2RenderingContext} */
    gl = undefined;
    /** @type {MouseState} */
    mouseState = new MouseState(false, new Vec2(0, 0), new Vec2(0, 0), new Vec2(0, 0));
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
        this.setRenderUniformLocations();
    }

    setRenderUniformLocations() {
        this.scene.setUniformLocations(this.gl, this.renderCanvasProgram);
        this.uniformLocations = [];
        this.uniformLocations.push(this.gl.getUniformLocation(this.renderCanvasProgram, 'u_resolution'));
    }

    setRenderUniformValues() {
        this.scene.setUniformValues(this.gl);
        let index = 0;
        this.gl.uniform2f(this.uniformLocations[index], this.canvas.width, this.canvas.height);
    }

    render() {
        this.setRenderUniformValues();
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.useProgram(this.renderCanvasProgram);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.enableVertexAttribArray(this.renderCanvasVAttrib);
        this.gl.vertexAttribPointer(this.renderCanvasVAttrib, 2,
                                    this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.flush();
    }
}
