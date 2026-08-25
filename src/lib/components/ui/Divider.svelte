<script lang="ts">
  let { label = '' }: { label?: string } = $props();
</script>

<div class="divider">
  <span class="line"></span>
  {#if label}
    <span class="label">{label}</span>
  {/if}
  <span class="line"></span>
</div>

<style>
  .divider {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    margin: 12px 0 0;
  }

  .line {
    flex: 1 1;
    height: 1px;
    background: var(--cool-gray-400, #9ca3af);
  }

  .label {
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 300;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--cool-gray-600, #4b5563);
    font-family: var(--font-body);
  }
</style>
