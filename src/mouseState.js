import Vec2 from './vec2.js';

export default class MouseState {
    /** @type {Boolean} */
    isPressing = false;
    /** @type {Vec2} */
    position = new Vec2(0, 0);
    /** @type {Vec2} */
    prevPosition = new Vec2(0, 0);
    /** @type {Vec2} */
    prevTranslate = new Vec2(0, 0);
    /** @type {Number} */
    button = -1;

    /**
     */
    constructor() {
    }

    /**
     * @param {Boolean} isPressing
     * @returns {MouseState}
     */
    setIsPressing(isPressing) {
        this.isPressing = isPressing;
        return this;
    }

    /**
     * @param {Vec2} position
     * @returns {MouseState}
     */
    setPosition(position) {
        this.position = position;
        return this;
    }

    /**
     * @param {Vec2} prevPosition
     * @returns {MouseState}
     */
    setPrevPosition(prevPosition) {
        this.prevPosition = prevPosition;
        return this;
    }

    /**
     * @param {Vec2} prevTranslate
     * @returns {MouseState}
     */
    setPrevTranslate(prevTranslate) {
        this.prevTranslate = prevTranslate;
        return this;
    }

    /**
     * @param {Number} button
     * @returns {MouseState}
     */
    setButton(button) {
        this.button = button;
        return this;
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
