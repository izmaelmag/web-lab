<script lang="ts">
  import Pause from 'svelte-radix/Pause.svelte';
  import Play from 'svelte-radix/Play.svelte';
  import Radiobutton from 'svelte-radix/Radiobutton.svelte';
  import Timer from 'svelte-radix/Timer.svelte';
  import TrackNext from 'svelte-radix/TrackNext.svelte';
  import TrackPrevious from 'svelte-radix/TrackPrevious.svelte';
  import RangeSlider from './RangeSlider.svelte';
  import ActionButton from './ui/ActionButton.svelte';
  import Divider from './ui/Divider.svelte';

  type ActionHandler = () => void;

  let {
    currentFrame = $bindable(0),
    totalFrames = 0,
    isPlaying = false,
    isRecording = false,
    onRecord,
    onPlay,
    onPause,
    onReset,
    onSkip,
    onChange
  }: {
    currentFrame?: number;
    totalFrames?: number;
    isPlaying?: boolean;
    isRecording?: boolean;
    onRecord?: ActionHandler;
    onPlay: ActionHandler;
    onPause: ActionHandler;
    onReset: ActionHandler;
    onSkip: ActionHandler;
    onChange: (frame: number) => void;
  } = $props();

  const frameTimerText = $derived(
    `${currentFrame.toString().padStart(totalFrames.toString().length, '0')}/${totalFrames}`
  );

  const handleFrameInput = () => {
    onChange(currentFrame);
  };
</script>

<div class="player">
  <Divider label={`Player – ${frameTimerText}`} />

  <div class="frameInput">
    <div class="icon">
      <Timer size="14" />
    </div>

    <div class="frameInputSlider">
      <RangeSlider
        bind:value={currentFrame}
        onChange={handleFrameInput}
        min={0}
        max={totalFrames}
        step={1}
      />
    </div>

    <div class="actions">
      <ActionButton label="Start" disabled={isRecording} color="blue" onclick={onReset}>
        <TrackPrevious size="14" />
      </ActionButton>

      <ActionButton label="End" disabled={isRecording} color="blue" onclick={onSkip}>
        <TrackNext size="14" />
      </ActionButton>

      <ActionButton
        label="Play"
        disabled={isRecording}
        color="green"
        filled={isPlaying && !isRecording}
        onclick={onPlay}
      >
        <Play size="14" />
      </ActionButton>

      <ActionButton
        label="Pause"
        disabled={isRecording}
        color="orange"
        filled={!isPlaying}
        onclick={onPause}
      >
        <Pause size="14" />
      </ActionButton>

      {#if onRecord}
        <ActionButton label="Record" color="orange" filled={isRecording} onclick={onRecord}>
          <Radiobutton size="14" />
        </ActionButton>
      {/if}
    </div>
  </div>
</div>

<style>
  .frameInput {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon {
    flex-shrink: 0;
    height: 14px;
    width: 14px;
    font-size: 0;
  }

  .frameInputSlider {
    width: calc(1px + 189px);
    height: 30px;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: nowrap;
  }

  .player {
    font-family: var(--font-body);
  }
</style>
