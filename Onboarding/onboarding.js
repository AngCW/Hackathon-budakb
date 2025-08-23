document.addEventListener('DOMContentLoaded', () => {
  // Drive CSS conic gradients by setting --pct based on data-percent
  document.querySelectorAll('.progress-ring').forEach(el => {
    const pct = Number(el.getAttribute('data-percent')) || 0;
    el.style.setProperty('--pct', pct);
  });
});