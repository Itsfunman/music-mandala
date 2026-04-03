export class LoopEditor {
  private pattern: boolean[];
  private onPatternChange: (newPattern: boolean[]) => void;
  private container: HTMLElement;

  constructor(pattern: boolean[], onPatternChange: (newPattern: boolean[]) => void) {
    this.pattern = pattern;
    this.onPatternChange = onPatternChange;
    this.container = document.createElement('div');
    this.container.className = 'loop-editor';
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.pattern.forEach((isActive, index) => {
      const stepElement = document.createElement('div');
      stepElement.textContent = isActive ? '🥁' : '⬜';
      if (isActive) stepElement.classList.add('active');

      stepElement.addEventListener('click', () => {
        const newPattern = [...this.pattern];
        newPattern[index] = !newPattern[index];
        this.onPatternChange(newPattern);
      });

      this.container.appendChild(stepElement);
    });
  }

  public updatePattern(pattern: boolean[]): void {
    this.pattern = pattern;
    this.render();
  }

  public getElement(): HTMLElement {
    return this.container;
  }
}