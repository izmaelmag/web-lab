<script lang="ts">
  // Imports
  import { writable } from 'svelte/store';
  import type { Note, NoteData } from '$lib/types/synth';
  import { notes } from './notes';

  // Props
  export let pitch = 4;
  export let onChange: (activeNotes: NoteData[]) => void;

  // State management
  const activeNotes = writable<NoteData[]>([]);
  let isPressed: boolean = false;
  $: isPressed;

  activeNotes.subscribe((keys) => {
    const keySet = Array.from(new Set(keys));

    onChange(keySet);
  });

  const addNote = (note: NoteData, pitch: number) => {
    $activeNotes = [...$activeNotes, { ...note, pitch }];
  };

  const removeNote = (activeNote: NoteData) => {
    $activeNotes = $activeNotes.filter(({ note }) => note !== activeNote.note);
  };

  // Handle mouse clicks on keys
  const handleKeyPress = (note: NoteData, pitch: number) => (e: Event) => {
    e.returnValue = false;
    isPressed = true;
    addNote(note, pitch);
  };

  const handleKeyRelease = (note: NoteData) => () => {
    isPressed = false;
    removeNote(note);
  };

  // Handle mouse movement over keys
  const handleKeyEnter = (note: NoteData, pitch: number) => (e: Event) => {
    e.returnValue = false;

    if (isPressed) {
      addNote(note, pitch);
    }
  };

  const handleKeyLeave = (note: NoteData) => () => {
    if (isPressed) {
      removeNote(note);
    }
  };

  console.log(notes);
</script>

<div class="keyboard">
  {#each notes as note, index}
    {#if !note.isSharp}
      <div class="key">
        {#if note.hasSharp}
          <button
            type="button"
            on:mousedown={handleKeyPress(notes[index + 1], pitch)}
            on:touchstart={handleKeyPress(notes[index + 1], pitch)}
            on:mouseenter={handleKeyEnter(notes[index + 1], pitch)}
            on:mouseup={handleKeyRelease(notes[index + 1])}
            on:touchend={handleKeyRelease(notes[index + 1])}
            on:mouseleave={handleKeyLeave(notes[index + 1])}
            class="sharp"
          >
            <div class="noteName">
              {notes[index + 1].name}{pitch}#
            </div>
          </button>
        {/if}

        <button
          type="button"
          on:mousedown={handleKeyPress(note, pitch)}
          on:touchstart={handleKeyPress(note, pitch)}
          on:mouseenter={handleKeyEnter(note, pitch)}
          on:mouseup={handleKeyRelease(note)}
          on:touchend={handleKeyRelease(note)}
          on:mouseleave={handleKeyLeave(note)}
          class="button"
        >
          <div class="noteName">
            {note.name}{pitch}
          </div>
        </button>
      </div>
    {/if}
  {/each}
  {#each notes as note, index}
    {#if !note.isSharp}
      <div class="key">
        {#if note.hasSharp}
          <button
            type="button"
            on:mousedown={handleKeyPress(notes[index + 1], pitch + 1)}
            on:touchstart={handleKeyPress(notes[index + 1], pitch + 1)}
            on:mouseenter={handleKeyEnter(notes[index + 1], pitch + 1)}
            on:mouseup={handleKeyRelease(notes[index + 1])}
            on:touchend={handleKeyRelease(notes[index + 1])}
            on:mouseleave={handleKeyLeave(notes[index + 1])}
            class="sharp"
          >
            <div class="noteName">
              {notes[index + 1].name}{pitch + 1}#
            </div>
          </button>
        {/if}

        <button
          type="button"
          on:mousedown={handleKeyPress(note, pitch + 1)}
          on:touchstart={handleKeyPress(note, pitch + 1)}
          on:mouseenter={handleKeyEnter(note, pitch + 1)}
          on:mouseup={handleKeyRelease(note)}
          on:touchend={handleKeyRelease(note)}
          on:mouseleave={handleKeyLeave(note)}
          class="button"
        >
          <div class="noteName">
            {note.name}{pitch + 1}
          </div>
        </button>
      </div>
    {/if}
  {/each}
</div>

<style>
  .keyboard {
    position: relative;
    width: 100%;
    display: flex;
    flex-shrink: 0;
  }

  .key {
    height: 120px;
    flex: 1 1;
    min-width: 0;
    width: 100%;
    /* box-shadow: -1px 0 0 black inset; */
    position: relative;

    &:last-child {
      box-shadow: none;
    }
  }

  .button {
    background: transparent;
    border: none;
    border-top: 1px solid black;
    color: black;
    padding: 8px;
    user-select: none !important;
    -webkit-touch-callout: none !important;
    height: 100%;
    width: 100%;
    position: relative;
    z-index: 1;
    background: #fff;
    width: calc(100% + 1px);
    border: 1px solid #000;
    border-radius: 0 0 16px 16px;

    &.active {
      background: #f00;
    }
  }

  .sharp {
    width: 50%;
    background: #000;
    color: #fff;
    position: absolute;
    z-index: 2;
    height: 65%;
    top: 0;
    right: 0;
    border: none;
    transform: translateX(50%);
    border-radius: 0 0 16px 16px;
  }

  .noteName {
    position: absolute;
    bottom: 8px;
    left: 0;
    font-size: 10px;
    font-weight: 900;
    width: 100%;
    text-align: center;
    -webkit-touch-callout: none !important;
    user-select: none !important;
    pointer-events: none;
  }
</style>
