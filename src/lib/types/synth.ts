export enum Note {
  'C' = 'C',
  'C#' = 'C#',
  'D' = 'D',
  'D#' = 'D#',
  'E' = 'E',
  'F' = 'F',
  'F#' = 'F#',
  'G' = 'G',
  'G#' = 'G#',
  'A' = 'A',
  'A#' = 'A#',
  'B' = 'B'
}

export type NoteData = {
  note: Note;
  name: string;
  fq: number;
  isSharp: boolean;
  hasSharp: boolean;
  pitch?: number;
};
