<script lang="ts">
  import { onMount } from 'svelte';
  import ConstructAct from '$lib/showreel/ConstructAct.svelte';
  import ModulateAct from '$lib/showreel/ModulateAct.svelte';
  import TraceAct from '$lib/showreel/TraceAct.svelte';
  import ContactAct from '$lib/showreel/ContactAct.svelte';
  import { prefersReducedMotion } from '$lib/showreel/score';

  // Starts paused so SSR markup and reduced-motion visitors agree; everyone
  // else is switched on as soon as the page mounts.
  let playing = $state(false);
  let reduced = false;
  let top: HTMLElement;
  let construct: ReturnType<typeof ConstructAct> | undefined = $state();
  let trace: ReturnType<typeof TraceAct> | undefined = $state();

  function toggle() {
    playing = !playing;
    construct?.setPlaying(playing);
  }

  function replay() {
    playing = true;
    top.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    construct?.replay();
    trace?.replay();
  }

  onMount(() => {
    reduced = prefersReducedMotion();
    playing = !reduced;
  });
</script>

<svelte:head>
  <title>Showreel — Izmael Mag</title>
  <meta
    name="description"
    content="A kinetic geometry notebook: compass constructions, phase-shifted stripes and epicycles leading to shaders, motion systems and interactive tools."
  />
</svelte:head>

<div class="showreel" bind:this={top}>
  <ConstructAct bind:this={construct} />
  <ModulateAct {playing} />
  <TraceAct bind:this={trace} {playing} />
  <ContactAct />

  <div class="transport" role="group" aria-label="Motion controls">
    <span class="state" aria-hidden="true">{playing ? '● motion' : '○ still'}</span>
    <button type="button" onclick={toggle}>{playing ? '❚❚ pause' : '▶ play'}</button>
    <button type="button" onclick={replay}>↺ replay intro</button>
  </div>
</div>

<style>
  .showreel {
    width: 100%;
    background: #000;
    overflow-x: clip;
  }

  .transport {
    position: fixed;
    right: clamp(12px, 2vw, 24px);
    bottom: clamp(12px, 2vw, 24px);
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 4px 4px 12px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.72);
    background: rgba(0, 0, 0, 0.82);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 999px;
    backdrop-filter: blur(6px);
  }

  .state {
    margin-right: 6px;
    white-space: nowrap;
  }

  button {
    font: inherit;
    font-size: 11px;
    letter-spacing: 0.04em;
    color: #fff;
    background: none;
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 8px 12px;
    cursor: pointer;
    white-space: nowrap;
    transition:
      border-color 0.2s ease,
      color 0.2s ease;

    &:hover {
      color: var(--brand-orange);
      border-color: rgba(255, 153, 19, 0.5);
    }

    &:focus-visible {
      outline: 2px solid var(--brand-orange);
      outline-offset: 2px;
    }
  }

  @media (max-width: 480px) {
    .transport {
      left: 12px;
      right: 12px;
      justify-content: space-between;
    }
  }
</style>
