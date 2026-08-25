import type { Component } from 'svelte';
import Angle from 'svelte-radix/Angle.svelte';
import BarChart from 'svelte-radix/BarChart.svelte';
import BlendingMode from 'svelte-radix/BlendingMode.svelte';
import ColorWheel from 'svelte-radix/ColorWheel.svelte';
import Frame from 'svelte-radix/Frame.svelte';
import Padding from 'svelte-radix/Padding.svelte';
import RulerHorizontal from 'svelte-radix/RulerHorizontal.svelte';
import RulerSquare from 'svelte-radix/RulerSquare.svelte';
import Shadow from 'svelte-radix/Shadow.svelte';
import ShadowOuter from 'svelte-radix/ShadowOuter.svelte';
import Stopwatch from 'svelte-radix/Stopwatch.svelte';

export const controlIcons: Record<string, Component> = {
  Angle,
  BarChart,
  BlendingMode,
  ColorWheel,
  Frame,
  Padding,
  RulerHorizontal,
  RulerSquare,
  Shadow,
  ShadowOuter,
  Stopwatch
};
