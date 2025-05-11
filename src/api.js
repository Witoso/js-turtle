/* global setInterval */
import { drawIf, draw, _imageCanvas, _imageCtx, _turtle, _centerCoords } from "./turtle.js";
/**
 * Yield a sequence of numbers in the interval `[start, end(`.
 * Doesn't handle unsafe (overflowing) numbers, so it'll get stuck at {@link Number.MAX_SAFE_INTEGER}.
 * @param {number} start
 * @param {number} end
 * @param {number} [step=1]
 * @yields {number} Each number in the sequence
 */
export const range = function* (start, end, step = 1) {
  for (let i = +start; i < +end; i += +step) {
    yield i;
  }
};

/**
 * turn edge wrapping on/off
 * @param {boolean} b
 */
export const wrap = (b) => {
  _turtle.wrap = b;
};

export const hideTurtle = () => {
  _turtle.visible = false;
  drawIf();
};

export const showTurtle = () => {
  _turtle.visible = true;
  drawIf();
};

/**
 * turn on/off redrawing
 * @param {boolean} b
 */
export const redrawOnMove = (b) => {
  _turtle.redraw = b;
};

/** lift up the pen (don't draw) */
export const penup = () => {
  _turtle.penDown = false;
};
/** put the pen down (do draw) */
export const pendown = () => {
  _turtle.penDown = true;
};

/**
 * turn right by an angle in degrees
 * @param {number} angle
 */
export const right = (angle) => {
  _turtle.angle += degToRad(angle);
  drawIf();
};

/**
 * turn left by an angle in degrees
 * @param {number} angle
 */
export const left = (angle) => {
  _turtle.angle -= degToRad(angle);
  drawIf();
};

/**
 * move the turtle to a particular coordinate (don't draw on the way there)
 * @param {number} x
 * @param {number} y
 */
export const goto = (x, y) => {
  _turtle.pos.x = +x;
  _turtle.pos.y = +y;
  drawIf();
};

/**
 * set the angle of the turtle in degrees
 * @param {number} a
 */
export const angle = (a) => {
  _turtle.angle = degToRad(a);
};

/**
 * convert degrees to radians
 * @param {number} deg
 */
export const degToRad = (deg) => (deg / 180) * Math.PI;

/**
 * convert radians to degrees
 * @param {number} rad
 */
export const radToDeg = (rad) => (rad * 180) / Math.PI;

/**
 * set the width of the line
 * @param {number} w
 */
export const width = (w) => {
  w = +w;
  _turtle.width = w;
  _imageCtx.lineWidth = w;
};

/**
 * write some text at the turtle position, with custom or default font.
 *
 * ideally we'd like this to rotate the text based on
 * the turtle orientation, but this will require some clever
 * canvas transformations which aren't implemented yet.
 * @param {string} msg
 */
export const write = (msg) => {
  const { x, y } = _turtle.pos;

  _imageCtx.save();
  _centerCoords(_imageCtx);

  //_imageCtx.rotate(turtle.angle);
  _imageCtx.translate(x, y);
  _imageCtx.transform(1, 0, 0, -1, 0, 0);
  _imageCtx.translate(-x, -y);

  _imageCtx.fillText(msg, x, y);

  _imageCtx.restore();

  drawIf();
};

/**
 * set the font of the image Context
 * @param {string} font
 */
export const setFont = (font) => {
  _imageCtx.font = font;
};

/**
 * set the turtle draw shape
 *
 * currently supports triangle (default), circle, square, and turtle
 * @param {string} s
 */
export const shape = (s) => {
  _turtle.shape = s;
  draw();
};

/**
 * set line color using RGB values in the range 0 - 255.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} a alpha
 */
export const colour = (r, g, b, a) => {
  r = +r;
  g = +g;
  b = +b;
  a = +a;

  _imageCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
  const c = _turtle.colour;
  c.r = r;
  c.g = g;
  c.b = b;
  c.a = a;
};
export const color = colour;

/**
 * Returns a pseudo-random integer in a range
 * @param {number} min inclusive lower bound
 * @param {number} max inclusive upper bound
 */
export const random = (min, max) => {
  min = +min;
  max = +max;

  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * repeatedly run an "action" callback `n` times
 * @param {number} n integer
 * @param {() => never} action callback
 */
export const repeat = (n, action) => {
  while (n-- > 0) action();
};

/**
 * `setInterval` alias, but 2-adic (no rest args)
 * @param {TimerHandler} f
 * @param {number | undefined} ms
 */
export const animate = (f, ms) => setInterval(f, ms);

/**
 * Trace the forward motion of the turtle, allowing for possible
 * wrap-around at the boundaries of the canvas.
 * @param {number} distance
 */
export const forward = (distance) => {
	distance = +distance;
  
	_imageCtx.save();
	_centerCoords(_imageCtx);
	_imageCtx.beginPath();
  
	// get the boundaries of the canvas
	const { abs, sin, cos } = Math,
	  { width: w, height: h } = _imageCanvas,
	  maxX = w / 2,
	  minX = -maxX,
	  maxY = h / 2,
	  minY = -maxY;
  
	/**
	 * Returns the sine and cosine of a number, as a 2-tuple.
	 * @param {number} x
	 * @returns {[number, number]}
	 */
	const sin_cos = (x) => [sin(x), cos(x)];
  
	let { x, y } = _turtle.pos;
  
	// trace out the forward steps
	while (distance > 0) {
	  // move to the current location of the turtle
	  _imageCtx.moveTo(x, y);
  
	  // calculate the new location of the turtle after doing the forward movement
	  const [sinAngle, cosAngle] = sin_cos(_turtle.angle),
		newX = x + sinAngle * distance,
		newY = y + cosAngle * distance;
  
	  /**
	   * wrap on the X boundary
	   * @param {number} cutBound
	   * @param {number} otherBound
	   */
	  const xWrap = (cutBound, otherBound) => {
		const distanceToEdge = abs((cutBound - x) / sinAngle);
		const edgeY = cosAngle * distanceToEdge + y;
		_imageCtx.lineTo(cutBound, edgeY);
		distance -= distanceToEdge;
		x = otherBound;
		y = edgeY;
	  };
	  /**
	   * wrap on the Y boundary
	   * @param {number} cutBound
	   * @param {number} otherBound
	   */
	  const yWrap = (cutBound, otherBound) => {
		const distanceToEdge = abs((cutBound - y) / cosAngle);
		const edgeX = sinAngle * distanceToEdge + x;
		_imageCtx.lineTo(edgeX, cutBound);
		distance -= distanceToEdge;
		x = edgeX;
		y = otherBound;
	  };
	  /** don't wrap the turtle on any boundary */
	  const noWrap = () => {
		_imageCtx.lineTo(newX, newY);
		_turtle.pos.x = newX;
		_turtle.pos.y = newY;
		distance = 0;
	  };
	  // if wrap is on, trace a part segment of the path and wrap on boundary if necessary
	  if (_turtle.wrap)
		if (newX > maxX) xWrap(maxX, minX);
		else if (newX < minX) xWrap(minX, maxX);
		else if (newY > maxY) yWrap(maxY, minY);
		else if (newY < minY) yWrap(minY, maxY);
		else noWrap();
	  // wrap is not on.
	  else noWrap();
	}
	// only draw if the pen is currently down.
	_turtle.penDown && _imageCtx.stroke();
	_imageCtx.restore();
	drawIf();
  };
  