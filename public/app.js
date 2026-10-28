document.querySelectorAll('.notice:not(.notice-error)').forEach((notice) => {
  window.setTimeout(() => {
    notice.classList.add('is-hiding');
    window.setTimeout(() => notice.remove(), 250);
  }, 3000);
});

const networkVisual = document.querySelector('.network-visual');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (networkVisual) {
  let animationFrame = null;

  networkVisual.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;

    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
    }

    animationFrame = window.requestAnimationFrame(() => {
      const bounds = networkVisual.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      const reducedMotion = prefersReducedMotion.matches;
      const tiltFactor = reducedMotion ? 0 : 1;
      const shiftFactor = reducedMotion ? 8 : 20;
      const verticalShiftFactor = reducedMotion ? 6 : 14;

      networkVisual.style.setProperty('--pointer-x', `${((x - 0.5) * 12 * tiltFactor).toFixed(2)}deg`);
      networkVisual.style.setProperty('--pointer-y', `${((0.5 - y) * 8 * tiltFactor).toFixed(2)}deg`);
      networkVisual.style.setProperty('--pointer-shift-x', `${((x - 0.5) * shiftFactor).toFixed(2)}px`);
      networkVisual.style.setProperty('--pointer-shift-y', `${((y - 0.5) * verticalShiftFactor).toFixed(2)}px`);
      networkVisual.style.setProperty('--shine-x', `${(x * 100).toFixed(1)}%`);
      networkVisual.style.setProperty('--shine-y', `${(y * 100).toFixed(1)}%`);
      networkVisual.classList.add('is-interactive');
      animationFrame = null;
    });
  });

  networkVisual.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;

    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    networkVisual.style.removeProperty('--pointer-x');
    networkVisual.style.removeProperty('--pointer-y');
    networkVisual.style.removeProperty('--pointer-shift-x');
    networkVisual.style.removeProperty('--pointer-shift-y');
    networkVisual.style.removeProperty('--shine-x');
    networkVisual.style.removeProperty('--shine-y');
    networkVisual.classList.remove('is-interactive');
  });
}
