import type { Sketch } from 'p5-svelte';

const Polyrhythms: () => Sketch = () => (p5) => {
  const S = 520;
  const C = S / 2;

  const N = 30;
  const gap = 8;
  const minLength = 4;
  const amp = Math.PI;
  const startAngle = Math.PI / 2;

  p5.setup = async () => {
    p5.createCanvas(S, S);
    p5.noStroke();
    p5.angleMode(p5.RADIANS);
  };

  p5.draw = () => {
    const dt = p5.millis() / 1000;
    p5.clear(255, 255, 255, 255);

    for (let i = 1; i <= N; i++) {
      const speed = Math.PI * 2 - i / Math.PI / 4;
      const R = minLength + i * gap;
      const angle = startAngle + amp * Math.sin(dt * speed * 0.1);

      const x = C + R * Math.cos(angle);
      const y = C + R * Math.sin(angle);

      p5.stroke('#ff000022');
      p5.line(C, C, x, y);
      p5.noStroke();
      p5.fill('red');
      p5.circle(x, y, 4);
    }
  };
};

export default Polyrhythms;
