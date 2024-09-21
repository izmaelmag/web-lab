export type Angle = number;

export type Point = {
  x: number;
  y: number;
  z?: number;
};

export type PolarPoint = {
  c: Point;
  r: number;
  a: Angle;
};
