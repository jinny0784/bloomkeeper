// Bloomkeeper — keyboard and mouse state, in canvas coordinates.
// The rest of the game just reads this object; all the listener wiring and
// the screen-to-canvas scaling live here.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, down: false, rightDown: false, clicked: false, rightClicked: false };
    this.pressed = new Set();

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.mouse.down = false; });

    canvas.addEventListener('mousemove', (event) => {
      const point = this.toCanvas(event);
      this.mouse.x = point.x;
      this.mouse.y = point.y;
    });
    canvas.addEventListener('mousedown', (event) => {
      const point = this.toCanvas(event);
      this.mouse.x = point.x;
      this.mouse.y = point.y;
      if (event.button === 0) { this.mouse.down = true; this.mouse.clicked = true; }
      if (event.button === 2) { this.mouse.rightDown = true; this.mouse.rightClicked = true; }
    });
    window.addEventListener('mouseup', (event) => {
      if (event.button === 0) this.mouse.down = false;
      if (event.button === 2) this.mouse.rightDown = false;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  toCanvas(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  down(...codes) {
    return codes.some((code) => this.keys.has(code));
  }

  justPressed(...codes) {
    return codes.some((code) => this.pressed.has(code));
  }

  moveAxis() {
    let x = 0;
    let y = 0;
    if (this.down('KeyA', 'ArrowLeft')) x -= 1;
    if (this.down('KeyD', 'ArrowRight')) x += 1;
    if (this.down('KeyW', 'ArrowUp')) y -= 1;
    if (this.down('KeyS', 'ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  }

  // Called once at the end of every frame: one-frame signals reset here.
  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
    this.mouse.rightClicked = false;
  }
}
