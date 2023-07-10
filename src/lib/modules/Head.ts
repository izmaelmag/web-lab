import type P5 from 'p5';

type Coord = {
	x: number;
	y: number;
};

class Head {
  private _w = 200
  private _h = 100
  
	private _pos: Coord = {
		x: 0,
		y: 0
	};

  public get bounds() {
    const left = this._pos.x - this._w / 2
    const top = this._pos.y - this._h / 2
    
    return {
      left,
      right: left + this._w,
      top,
      bottom: top + this._h
    }
  }

	public get pos(): Coord {
		return this._pos;
	}

	public set pos(newPos: Coord) {
		this._pos = newPos;
	}

	render(p: P5) {
		p.push();

		p.fill('#6BD3FF');
		p.noStroke();

		p.translate(this.pos.x, this.pos.y);
		p.rectMode(p.CENTER);
		p.rect(0, 0, this._w, this._h);

		p.pop();
	}
}

export default Head;
