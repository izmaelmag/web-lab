# Ensuring Smooth Animations in Svelte: Avoiding Frame Skips on Full Page Reloads

Animations can significantly enhance the user experience of a web application, making interfaces feel more dynamic and engaging. However, implementing animations can sometimes lead to unexpected issues, such as frame skipping, especially during full page reloads. In this post, we'll explore a common problem encountered in Svelte projects related to animation performance and how to effectively resolve it.

## 🛠️ **Problem Overview**

While developing a Svelte application, you might notice that animations **play smoothly during hot reloads** but **skip frames or behave erratically when performing a full page reload** (e.g., using `Cmd+R`). This inconsistency can be frustrating and degrade the user experience.

### **Symptoms:**

- **Smooth Animations** on hot reloads (development environment).
- **Choppy or Skipping Frames** on full page reloads.
- **Animated Elements Jumping** to their final state without the intended transitions.

## 🔍 **Understanding the Cause**

The primary reason for this issue lies in **when and how animations are triggered** during the component lifecycle:

- **Hot Reloads:** Only the affected components are re-rendered, preserving the animation states and ensuring smooth transitions.
- **Full Page Reloads:** The entire page is reloaded, and components render in their final state **before the browser fully applies the initial animation states**, causing animations to skip or not play smoothly.

## 💡 **Solution: Trigger Animations After Component Mounts**

To ensure animations run smoothly regardless of how the page is loaded, it's essential to **trigger animations after the component has fully mounted**. This approach prevents the browser from rendering elements in their final state initially, allowing CSS animations to transition them properly.

### **Key Steps:**

1. **Utilize Svelte's `onMount` Lifecycle Hook:** This ensures code runs after the component has been mounted.
2. **Introduce a `mounted` State Variable:** Control when animation classes are applied.
3. **Conditionally Apply Animation Classes:** Trigger animations by adding classes after mounting.
4. **Define Clear Initial and Animated States in CSS:** Prevent elements from appearing in their final state before animations start.

## 📂 **Code Examples: Before and After**

Let's delve into the specific changes made to achieve smooth animations.

### 1. `JumpText.svelte`

#### **❌ Before: Animations Skipping Frames on Full Reload**

```svelte
<!-- src/lib/components/JumpText.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  export let text: string = '';
  export let delay: number = 0;
  export let duration: number = 0.5;
  export let stagger: number = 0.1;
  export let offset: number = 0.5;
  export let direction: 'up' | 'down' = 'down';

  const relativeOffset = direction === 'up' ? `${offset * 100}%` : `-${offset * 100}%`;

  // Fix whitespaces
  text = text.replace(/\s/g, '\u00A0');

  const styleString = (index: number) => {
    return `
      animation-delay: ${delay + index * stagger}s;
      animation-duration: ${duration}s;
    `;
  };
</script>

<div class="jump-text" style="--offset: {relativeOffset}">
  {#each text as letter, index}
    <span class="letter" style={styleString(index)}>
      {letter}
    </span>
  {/each}
</div>

<style>
  .jump-text {
    display: inline-flex;
  }

  .letter {
    opacity: 0;
    transform: translate3d(0, var(--offset), 0);
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  .letter.animate {
    animation-name: jump;
    animation-timing-function: cubic-bezier(0.35, 1, 1, 0.7);
    animation-fill-mode: both;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  @keyframes jump {
    0% {
      opacity: 0;
      transform: translate3d(0, var(--offset), 0);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
</style>
```

#### **✅ After: Smooth Animations on Full Reload**

```svelte
<!-- src/lib/components/JumpText.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  export let text: string = '';
  export let delay: number = 0;
  export let duration: number = 0.5;
  export let stagger: number = 0.1;
  export let offset: number = 0.5;
  export let direction: 'up' | 'down' = 'down';

  let mounted = false;

  onMount(() => {
    // Trigger animations after component mounts
    mounted = true;
  });

  const relativeOffset = direction === 'up' ? `${offset * 100}%` : `-${offset * 100}%`;

  // Fix whitespaces
  text = text.replace(/\s/g, '\u00A0');

  const styleString = (index: number) => {
    return `
      animation-delay: ${delay + index * stagger}s;
      animation-duration: ${duration}s;
    `;
  };
</script>

<div class="jump-text" style="--offset: {relativeOffset}">
  {#each text as letter, index}
    <span class="letter {mounted ? 'animate' : ''}" style={styleString(index)}>
      {letter}
    </span>
  {/each}
</div>

<style>
  .jump-text {
    display: inline-flex;
  }

  .letter {
    opacity: 0;
    transform: translate3d(0, var(--offset), 0);
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  .letter.animate {
    animation-name: jump;
    animation-timing-function: cubic-bezier(0.35, 1, 1, 0.7);
    animation-fill-mode: both;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  @keyframes jump {
    0% {
      opacity: 0;
      transform: translate3d(0, var(--offset), 0);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
</style>
```

**🔍 Changes Explained:**

1. **Imported `onMount`:**

   - Ensures that code within `onMount` runs after the component is fully mounted.

2. **Introduced `mounted` State Variable:**

   - Initializes `mounted` to `false`.
   - Sets `mounted` to `true` inside `onMount`, indicating that the component has been mounted.

3. **Conditional Class Application:**
   - Adds the `animate` class to each `.letter` **only after** the component has mounted.
   - This triggers the CSS animations **post-mount**, preventing initial render issues.

---

### 2. `WigglyText.svelte`

#### **❌ Before: Animations Skipping Frames on Full Reload**

```svelte
<!-- src/lib/components/WigglyText.svelte -->
<script lang="ts">
  export let text: string = '';
  export let delay: number = 0;
  export let stagger: number = 0.07;
  export let duration: number = 0.5;
  export let amplitude: number = 1;

  const styleString = (index: number) => {
    return `
      animation-delay: ${delay + index * stagger}s;
      animation-duration: ${duration}s;
    `;
  };
</script>

<span class="wiggly-text" style="--amplitude: {amplitude}px">
  {#each text.split('') as char, index}
    <span class="wiggly-char" style={styleString(index)}>
      {char === ' ' ? '\u00A0' : char}
    </span>
  {/each}
</span>

<style>
  .wiggly-text {
    display: inline-block;
  }

  .wiggly-char {
    display: inline-block;
    animation-name: wiggle, fadeIn;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite, 1;
    animation-fill-mode: forwards, both;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  @keyframes wiggle {
    0%,
    100% {
      transform: translate3d(0, var(--amplitude), 0);
    }
    50% {
      transform: translate3d(0, calc(var(--amplitude) * -1), 0);
    }
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>
```

#### **✅ After: Smooth Animations on Full Reload**

```svelte
<!-- src/lib/components/WigglyText.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  export let text: string = '';
  export let delay: number = 0;
  export let stagger: number = 0.07;
  export let duration: number = 0.5;
  export let amplitude: number = 1;

  let mounted = false;

  onMount(() => {
    // Trigger animations after component mounts
    mounted = true;
  });

  const styleString = (index: number) => {
    return `
      animation-delay: ${delay + index * stagger}s;
      animation-duration: ${duration}s;
    `;
  };
</script>

<span class="wiggly-text" style="--amplitude: {amplitude}px">
  {#each text.split('') as char, index}
    <span class="wiggly-char {mounted ? 'animate' : ''}" style={styleString(index)}>
      {char === ' ' ? '\u00A0' : char}
    </span>
  {/each}
</span>

<style>
  .wiggly-text {
    display: inline-block;
  }

  .wiggly-char {
    display: inline-block;
    opacity: 0;
    transform: translate3d(0, 0, 0);
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  .wiggly-char.animate {
    animation-name: wiggle, fadeIn;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite, 1;
    animation-fill-mode: forwards, both;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  @keyframes wiggle {
    0%,
    100% {
      transform: translate3d(0, var(--amplitude), 0);
    }
    50% {
      transform: translate3d(0, calc(var(--amplitude) * -1), 0);
    }
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>
```

**🔍 Changes Explained:**

1. **Imported `onMount`:**

   - Similar to `JumpText.svelte`, ensures animations trigger after mounting.

2. **Introduced `mounted` State Variable:**

   - Controls when the `animate` class is applied.

3. **Conditional Class Application:**
   - Adds the `animate` class to each `.wiggly-char` **only after** mounting.
   - Ensures animations start correctly post-load.

## 🚀 **Implementation Steps**

1. **Import `onMount` from Svelte:**

   - Allows you to execute code after the component has been mounted.

2. **Initialize a `mounted` State Variable:**

   - Set to `false` by default.
   - Update to `true` inside the `onMount` hook to signal that the component is ready.

3. **Apply Animation Classes Conditionally:**

   - In your markup, append the `animate` class to elements only when `mounted` is `true`.
   - This triggers CSS animations **after** the component has fully rendered.

4. **Define Clear Initial and Animated States in CSS:**
   - Set initial properties (e.g., `opacity: 0`, `transform`) to prevent elements from appearing in their final state before animations.
   - Define animation keyframes to transition from the initial state to the desired final state.

## 📝 **Final Thoughts & Best Practices**

- **Always Trigger Animations Post-Mount:**

  - Use lifecycle hooks like `onMount` to ensure animations are initiated after the component is fully rendered.

- **Manage State Effectively:**

  - Control when animation classes are applied using state variables to prevent premature animations.

- **Optimize CSS for Performance:**

  - Utilize properties like `translate3d` for GPU acceleration.
  - Apply `will-change` and `backface-visibility` to enhance rendering performance.

- **Test Across Different Reload Scenarios:**

  - Ensure animations perform smoothly both during development (hot reloads) and in production (full page reloads).

- **Minimize DOM Complexity:**
  - Reduce the number of animated elements when possible to prevent performance bottlenecks.

By following these guidelines, you can create smooth, reliable animations in your Svelte projects that perform consistently across all user interactions and page load scenarios.

---

Happy coding! 🎉 If you encounter similar issues or have alternative solutions, feel free to share in the comments below.
