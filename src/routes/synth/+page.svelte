<script lang="ts">
  import { writable } from 'svelte/store';
  import Keyboard from '$lib/components/Synth/Keyboard.svelte';
  import type { Note, NoteData } from '$lib/types/synth';

  const audioContext = new AudioContext();
  let oscillators = writable<(OscillatorNode | null)[]>([]);
  let oscillatorType: OscillatorType = 'sine';
  let pitch = 5;

  const handleWaveformTypeChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const type = target.value as OscillatorType;
    oscillatorType = type;
  };

  const createOscillator = (note: NoteData): OscillatorNode => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    oscillator.type = oscillatorType;
    gainNode.connect(audioContext.destination);

    const frequency = note.fq * Math.pow(2, note.pitch || pitch);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    oscillator.start();

    return oscillator;
  };

  const handleKeysPress = (activeNotes: NoteData[]) => {
    if (!activeNotes.length) {
      $oscillators.forEach((oscillator) => {
        if (oscillator) {
          oscillator.stop();
          oscillator.disconnect();
          oscillator = null;
        }
      });

      $oscillators = [];
    }

    for (const note of activeNotes) {
      $oscillators = [...$oscillators, createOscillator(note)];
    }
  };
</script>

<div class="page">
  <div class="container">
    <div class="viewer">
      <h1 class="title">Caspeen</h1>
      <h4>Waveform</h4>
      <select on:change={handleWaveformTypeChange}>
        <option value="sine">Sine</option>
        <option value="square">Square</option>
        <option value="triangle">Triangle</option>
        <option value="sawtooth">Sawtooth</option>
      </select>

      <h4>Pitch: {pitch}</h4>
      <div class="buttons">
        <button on:click={() => pitch--}>-</button>
        <button on:click={() => pitch++}>+</button>
      </div>
    </div>

    <div class="kbContainer">
      <Keyboard {pitch} onChange={handleKeysPress} />
    </div>
  </div>
</div>

<style>
  .page {
    width: 100%;
    height: 100%;
    overflow: hidden;
    padding: 8px;
    background: #fff;
    color: #000;
  }

  .title {
    font-weight: 700;
    font-size: 24px;
    line-height: 1.2;
    color: #000;
  }

  .container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .viewer {
    min-height: 0;
    flex: 1 1;
  }

  .kbContainer {
    padding-bottom: 16px;
  }
</style>
