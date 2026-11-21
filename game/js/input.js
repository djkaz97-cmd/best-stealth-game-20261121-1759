// Keyboard state for the whole game. Down-keys drive movement; just-pressed
// keys are consumed once by the game, so Enter or E never fires twice.

export class Input {
  constructor(target = window) {
    this.down = new Set();
    this.just = new Set();
    this.firstGesture = null;

    target.addEventListener('keydown', (event) => {
      const code = event.code;
      if (this.isGameKey(code)) event.preventDefault();
      if (event.repeat) return;
      this.down.add(code);
      this.just.add(code);
      if (this.firstGesture) this.firstGesture();
    });

    target.addEventListener('keyup', (event) => {
      this.down.delete(event.code);
    });

    target.addEventListener('blur', () => {
      this.down.clear();
      this.just.clear();
    });
  }

  isGameKey(code) {
    return (
      code === 'KeyW' || code === 'KeyA' || code === 'KeyS' || code === 'KeyD' ||
      code === 'KeyE' || code === 'KeyR' || code === 'KeyM' ||
      code.startsWith('Arrow') || code.startsWith('Shift') ||
      code === 'Space' || code === 'Escape' || code === 'Enter'
    );
  }

  isDown(code) {
    return this.down.has(code);
  }

  consume(code) {
    if (!this.just.has(code)) return false;
    this.just.delete(code);
    return true;
  }

  endFrame() {
    this.just.clear();
  }
}
