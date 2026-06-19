/**
 * Deepak Trading Corporation — Cursor Reset
 * Custom cursor disabled; standard OS default cursor restored on all elements.
 */

// No-op: ensure nothing hides the native cursor
(function () {
  // Remove any lingering custom-cursor-enabled class that might have been
  // set by a previous version of this script.
  document.documentElement.style.cursor = '';
  document.body.style.cursor = '';
  document.body.classList.remove('custom-cursor-enabled');
})();
