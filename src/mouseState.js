import Vec2 from './vec2.js';

export default class MouseState {
    /** @type {Boolean} */
    isPressing = false;
    /** @type {Vec2} */
    position;
    /** @type {Vec2} */
    prevPosition;
    /** @type {Vec2} */
    prebTranslate;
    /** @type {Number} */
    button = -1;

    /**
     * @param {Boolean} isPressing
     * @param {Vec2} position
     * @param {Vec2} prevPosition
     * @param {Vec2} prevTranslate
     */
    constructor(isPressing, position, prevPosition, prevTranslate) {
        this.isPressing = isPressing;
        this.position = position;
        this.orevPosition = prevPosition;
        this.prevTranslate = prevTranslate;
    }

    /** @returns {Number} */
    static get BUTTON_LEFT () {
        return 0;
    }

    /** @returns {Number} */
    static get BUTTON_WHEEL() {
        return 1;
    }

    /** @returns {Number} */
    static get BUTTON_RIGHT() {
        return 2;
    }
}
