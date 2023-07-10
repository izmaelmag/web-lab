import type P5 from 'p5';
import Head from './Head';

class Molly {
	head: Head = new Head();

	say(text: string): void {
		alert(text);
	}

	render = (p: P5) => {
		p.setup = () => {
			p.createCanvas(p.windowWidth, p.windowHeight);
		};

		p.draw = () => {
      p.clear(255, 255, 255, 255)

			this.head.pos = {
				x: p.mouseX,
				y: p.mouseY
			};

      const { top, bottom, left, right } = this.head.bounds

      p.stroke('#ff0000')
      p.line(left, 0, left, p.height)
      p.line(right, 0, right, p.height)
      p.line(0, top, p.width, top)
      p.line(0, bottom, p.width, bottom)

			this.head.render(p);
		};
	}
}

export default Molly;
