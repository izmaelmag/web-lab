import { cubicBezier, spring } from 'animejs';

// The site's signature overshoot, same curve as --jump-animation / JumpText.
export const jump = cubicBezier(0.37, 1.69, 0.17, 0.8);

// Compass hand: slow off the pin, slow onto the paper.
export const compass = cubicBezier(0.65, 0, 0.35, 1);

// Springs are created per use: a Spring instance keeps its own solver state.
export const aperture = () => spring({ bounce: 0.32, duration: 720 });
export const capital = () => spring({ bounce: 0.45, duration: 560 });
export const retune = () => spring({ bounce: 0.22, duration: 1100 });

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Calls `onChange(true)` while the element is on screen. Used to start acts on
 * first sight and to park loops that nobody can see.
 */
export const watchVisibility = (
  element: Element,
  onChange: (visible: boolean) => void,
  rootMargin = '0px 0px -15% 0px'
) => {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => onChange(entry.isIntersecting)),
    { rootMargin }
  );
  observer.observe(element);
  return () => observer.disconnect();
};
