/* global document, alert, window */

import { reset } from "./turtle.js";
import * as api from "./api.js";

// Expose all API functions to the global scope
Object.assign(window, api);

/**
 * Main function to initialize the application.
 * Sets up event listeners for command input and buttons, manages command history,
 * and executes user-defined JavaScript code.
 *
 * @returns {void} This function does not return a value.
 */
const _main = () => {
  const doc = document;

  /**
   * check if `x` is `-0`, using only operators.
   * to ensure correctness in ALL circumstances, it doesn't use `Object.is`, because it's mutable.
   * this means this fn is 100% [pure](https://en.wikipedia.org/wiki/Pure_function).
   * @param {*} x
   */
  const isNegZero = (x) => x === 0 && 1 / x == -Infinity;

  /**
   * check if `x` matches the description of the `Uint32` namepath.
   * this fn is pure, by using only operators (and a fn call).
   * @param {*} x
   */
  const isUint32 = (x) => typeof x == "number" && x == x >>> 0 && !isNegZero(x);

  /**
   * String Queue (FIFO) to manage a history or log.
   * @param {Uint32} [maxSize=2**16] maximum chars to keep in memory.
   */
  const Hist = class {
    // a 16bit address-space seems like a sensible default
    constructor(maxSize = 1 << 0x10) {
      // runtime type safety
      if (!isUint32(maxSize))
        throw new RangeError(
          "expected `maxSize` to be `Uint32`, but got " + maxSize,
        );
      // just-in-case
      if (maxSize < 2)
        console.warn(
          "Max History size set to 0 or 1. This seems like an accident",
        );

      /**
       * max CUs to store, until at least 1 string is cleared from the queue.
       * @type {Uint32}
       */
      this._maxSize = maxSize;

      /**
       * total size in memory.
       * measured in **code-units** (16b or 2B), not bytes (8b or 1B).
       * @type {Uint32}
       */
      this._size = 0;

      /**
       * pointer to currently selected entry.
       * @type {Uint32}
       */
      this._index = 0;

      /**@type {string[]}*/
      this._entries = [];
    }

    /** returns entry at current `index`, defaults to empty `string` */
    get() {
      return this._entries[this._index] || "";
    }

    // both are unused, but may be handy in the future
    /** get latest entry, defaults to empty `string` */
    newest() {
      return this._entries[this._entries.length - 1] || "";
    }
    /** get earliest entry, defaults to empty `string` */
    oldest() {
      return this._entries[0] || "";
    }

    /**
     * append/push, with auto-flush
     * @param {string} s
     */
    set(s) {
      // enqueue, then set index to newest entry
      this._index = this._entries.push(s);
      // ensure it's up-to-date, to avoid memory leaks
      this._size += s.length;

      // flush old entries
      while (this._size > this._maxSize) {
        // dequeue, then update size
        this._size -= /**@type {string}*/ (this._entries.shift()).length;
        this._index--; // index correction
      }
    }

    /**
     * increment `index` by 1, clamped to `entries.length`, then return its value.
     * @returns {Uint32}
     */
    incIdx() {
      return (this._index = Math.min(this._index + 1, this._entries.length));
    }

    /**
     * decrement `index` by 1, clamped to 0 (keeps it unsigned), then return its value.
     * @returns {Uint32}
     */
    decIdx() {
      return (this._index = Math.max(this._index - 1, 0));
    }

    // also unused, but good to have available
    /**
     * set `maxSize` to a new value
     * @param {Uint32} n
     */
    setMaxSize(n) {
      if (!isUint32(n))
        throw new RangeError("expected `n` to be `Uint32`, but got " + n);
      this._maxSize = n;
    }
    // maybe we should add a button to clear the history?
  };

  const cmds = new Hist(1 << 20); // is this size "balanced"?

  const cmdBox = /**@type {HTMLInputElement}*/ (doc.getElementById("command"));

  cmdBox.addEventListener(
    "keydown",
    ({ key }) => {
      switch (key) {
        // Moves up and down in command history
        case "ArrowDown":
          cmds.incIdx();
          break;
        case "ArrowUp":
          cmds.decIdx();
          break;
        // call `runCmd` when user presses any "Enter" or "Return" keys
        case "Enter":
          return runCmd();
        default:
          return;
      }
      // external fall-through, only executed if `return` isn't touched
      cmdBox.value = cmds.get();
    },
    false,
  );

  const def = /**@type {HTMLTextAreaElement}*/ (
    doc.getElementById("definitions")
  );

  /** Executes program in the command box */
  const runCmd = () => {
    const cmdText = cmdBox.value;
    cmds.set(cmdText);

    const definitionsText = def.value;
    // https://stackoverflow.com/questions/19357978/indirect-eval-call-in-strict-mode
    // "JS never ceases to surprise me" @Rudxain
    try {
      // execute any code in the definitions box
      (0, eval)(definitionsText);
      // execute the code in the command box
      (0, eval)(cmdText);
    } catch (e) {
      alert("Exception thrown:\n" + e);
      throw e;
    } finally {
      // clear the command box
      cmdBox.value = "";
    }
  };

  /**
   * Similar to JQuery
   * @param {string} id HTML element ID
   * @param {(this: HTMLElement, ev: MouseEvent) => unknown} cb callback
   */
  const listenClickById = (id, cb) =>
    doc.getElementById(id).addEventListener("click", cb);
  // call `runCmd` when user presses "Run"
  listenClickById("runButton", runCmd);
  listenClickById("resetButton", reset);
  reset();
};

_main();
