import Canvas from './canvas.js';
import Scene from './scene';
import Ctx2dCanvas from './ctx2dcanvas.js';

window.addEventListener('load', () => {
    const scene = new Scene();
    const canvas = new Canvas('canvas', scene);
    canvas.init();
    canvas.enableDefaultMouseListeners();
    canvas.render();

    const ctx2dCanvas = new Ctx2dCanvas();
    ctx2dCanvas.render();
});
