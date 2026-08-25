<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    label,
    disabled = false,
    color = 'blue',
    filled = false,
    onclick,
    children
  }: {
    label: string;
    disabled?: boolean;
    color?: 'blue' | 'green' | 'orange';
    filled?: boolean;
    onclick: () => void;
    children: Snippet;
  } = $props();
</script>

<button
  type="button"
  class="action {color}"
  class:filled
  {disabled}
  title={label}
  aria-label={label}
  {onclick}
>
  {@render children()}
</button>

<style>
  .action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    color: currentColor;
  }

  .action:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .blue {
    color: #3b82f6;
    border: 1px solid #3b82f6;
  }

  .green {
    color: #22c55e;
    border: 1px solid #22c55e;
  }

  .orange {
    color: var(--brand-orange, #ff9913);
    border: 1px solid var(--brand-orange, #ff9913);
  }

  .blue.filled {
    background: #3b82f6;
    color: #fff;
  }

  .green.filled {
    background: #22c55e;
    color: #fff;
  }

  .orange.filled {
    background: var(--brand-orange, #ff9913);
    color: #fff;
  }
</style>
