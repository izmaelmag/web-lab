import { Note, type NoteData } from '$lib/types/synth';

export const noteFqMap: Record<Note, number> = {
  [Note['C']]: 16.35,
  [Note['C#']]: 17.32,
  [Note['D']]: 18.35,
  [Note['D#']]: 19.45,
  [Note['E']]: 20.6,
  [Note['F']]: 21.83,
  [Note['F#']]: 23.12,
  [Note['G']]: 24.5,
  [Note['G#']]: 25.96,
  [Note['A']]: 27.5,
  [Note['A#']]: 29.14,
  [Note['B']]: 30.87
};

const noteKeys = Object.keys(Note) as Note[];

const isSharp = (note: Note) => note.endsWith('#');

export const notes = noteKeys.reduce((result, note, index) => {
  const nextNote = noteKeys[index + 1];

  return [
    ...result,

    {
      note,
      fq: noteFqMap[note],
      isSharp: isSharp(note),
      hasSharp: nextNote && isSharp(nextNote),
      name: note.replace('#', '')
    }
  ];
}, [] as NoteData[]);
