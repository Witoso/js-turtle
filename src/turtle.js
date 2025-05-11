/* global document */

/**
 * @typedef {number} Uint32
 * Name influenced by {@link Uint32Array}
 */

/*
vars that should be private/local but are public/global, are prefixed with `_`.

fns that sanitize their inputs (despite JSDoc type annotations) are "very public" API.
*/

// get a handle for each canvas in the document
export const _imageCanvas = /**@type {HTMLCanvasElement}*/ (
  document.getElementById("imagecanvas")
);
export const _imageCtx = /**@type {CanvasRenderingContext2D}*/ (
  _imageCanvas.getContext("2d")
);

_imageCtx.textAlign = "center";
_imageCtx.textBaseline = "middle";

export const _turtleCtx = (() => {
  const turtleCanv = /**@type {HTMLCanvasElement}*/ (
    document.getElementById("turtlecanvas")
  );
  return /**@type {CanvasRenderingContext2D}*/ (turtleCanv.getContext("2d"));
})();

// the turtle takes precedence when compositing
_turtleCtx.globalCompositeOperation = "destination-over";

/**
 * specification of relative coordinates for drawing turtle shapes,
 * as lists of [x,y] pairs.
 * (The shapes are borrowed from cpython turtle.py)
 */
const _shapes = Object.freeze(
  /**@type {const}*/ ({
    triangle: [
      [-5, 0],
      [5, 0],
      [0, 15],
    ],
    turtle: [
      [0, 16],
      [-2, 14],
      [-1, 10],
      [-4, 7],
      [-7, 9],
      [-9, 8],
      [-6, 5],
      [-7, 1],
      [-5, -3],
      [-8, -6],
      [-6, -8],
      [-4, -5],
      [0, -7],
      [4, -5],
      [6, -8],
      [8, -6],
      [5, -3],
      [7, 1],
      [6, 5],
      [9, 8],
      [7, 9],
      [4, 7],
      [1, 10],
      [2, 14],
    ],
    square: [
      [10, -10],
      [10, 10],
      [-10, 10],
      [-10, -10],
    ],
    circle: [
      [10, 0],
      [9.51, 3.09],
      [8.09, 5.88],
      [5.88, 8.09],
      [3.09, 9.51],
      [0, 10],
      [-3.09, 9.51],
      [-5.88, 8.09],
      [-8.09, 5.88],
      [-9.51, 3.09],
      [-10, 0],
      [-9.51, -3.09],
      [-8.09, -5.88],
      [-5.88, -8.09],
      [-3.09, -9.51],
      [-0.0, -10.0],
      [3.09, -9.51],
      [5.88, -8.09],
      [8.09, -5.88],
      [9.51, -3.09],
    ],
  }),
);

const _DEFAULT_SHAPE = "triangle";

/** turtle-object constructor, for static type-checking */
const _defaultTurtle = () => ({
  pos: {
    x: 0,
    y: 0,
  },
  angle: 0,
  penDown: true,
  width: 1,
  visible: true,
  redraw: true, // does this belong here?
  wrap: true,
  shape: _DEFAULT_SHAPE,
  colour: {
    r: 0,
    g: 0,
    b: 0,
    a: 1,
  },
});

// initialise the state of the turtle
export let _turtle = _defaultTurtle();

/**
 * draw the turtle and the current image if `redraw` is `true`.
 * for complicated drawings it is much faster to turn `redraw` off.
 */
export const drawIf = () => {
  _turtle.redraw && draw();
};

/**
 * use canvas centered coordinates facing upwards
 * @param {CanvasRenderingContext2D} ctx
 */
export const _centerCoords = (ctx) => {
  const { width: w, height: h } = ctx.canvas;
  ctx.translate(w / 2, h / 2);
  ctx.transform(1, 0, 0, -1, 0, 0);
};

/** draw the turtle and the current image */
export const draw = () => {
  _clearCtx(_turtleCtx);
  if (_turtle.visible) {
    const { x, y } = _turtle.pos;

    _turtleCtx.save();
    _centerCoords(_turtleCtx);
    // move the origin to the turtle center
    _turtleCtx.translate(x, y);
    // rotate about the center of the turtle
    _turtleCtx.rotate(-_turtle.angle);
    // move the turtle back to its position
    _turtleCtx.translate(-x, -y);

    /**
     * the type isn't guaranteed, because {@link _shapes} is fully mutable,
     * so the user may mutate it
     * @type {number[][]}
     */
    const shape =
      _shapes[
        // eslint-disable-next-line no-prototype-builtins
        _shapes.hasOwnProperty(_turtle.shape) ? _turtle.shape : _DEFAULT_SHAPE
      ];

    // draw the turtle icon
    _turtleCtx.beginPath();
    if (shape.length > 0) _turtleCtx.moveTo(x + shape[0][0], y + shape[0][1]);
    for (const [cx, cy] of shape.slice(1)) {
      _turtleCtx.lineTo(x + cx, y + cy);
    }
    _turtleCtx.closePath();

    _turtleCtx.fillStyle = "green";
    _turtleCtx.fill();
    _turtleCtx.restore();
  }
  _turtleCtx.drawImage(_imageCanvas, 0, 0, 300, 300, 0, 0, 300, 300);
};

const _clearCtx = (/**@type {CanvasRenderingContext2D}*/ ctx) => {
  const { width: w, height: h } = ctx.canvas;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.restore();
};

/** clear the display, don't move the turtle */
const clear = () => {
  _clearCtx(_imageCtx);
  drawIf();
};

/**
 * reset the whole system, clear the display and move turtle back to
 * origin, facing the Y axis.
 */
export const reset = () => {
  // initialise
  _turtle = _defaultTurtle();
  _imageCtx.lineWidth = _turtle.width;
  _imageCtx.strokeStyle = "black";
  _imageCtx.globalAlpha = 1;

  clear();
  draw();
};
