import Canvas from './canvas.js';
import Scene from './scene';

window.addEventListener('load', () => {
    const scene = new Scene();
    const canvas = new Canvas('canvas', scene);
    canvas.init();
    canvas.enableDefaultMouseListeners();
    canvas.render();
});
