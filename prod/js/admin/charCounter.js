/**
 * Character counter helper for admin CMS text/textarea fields.
 *
 * Inserts a small counter element directly after `inputEl` and updates it
 * on every input event. The counter shows the current length / max and
 * applies one of three classes:
 *   - `is-good` when count is within [min, max]
 *   - `is-warn` when count is within ±10 chars of either bound
 *   - `is-bad`  when count is outside the warn window
 */

const WARN_WINDOW = 10;

/**
 * Attach a character counter to an input or textarea element.
 *
 * @param {HTMLElement} inputEl  text input, textarea, or a Quill wrapper element
 * @param {{min?: number, max?: number}} opts
 */
export function attachCharCounter(inputEl, opts = {}) {
  if (!inputEl) return null;
  const min = Number.isFinite(opts.min) ? opts.min : 0;
  const max = Number.isFinite(opts.max) ? opts.max : Infinity;

  const counter = document.createElement('div');
  counter.className = 'field-charcounter';
  inputEl.insertAdjacentElement('afterend', counter);

  const readValue = () => {
    // Quill wrapper — read plain text from the editor
    if (inputEl.classList && inputEl.classList.contains('quill-wrapper')) {
      const ed = inputEl.querySelector('.ql-editor');
      return ed ? (ed.textContent || '').trim() : '';
    }
    return (inputEl.value || '').toString();
  };

  const update = () => {
    const len = readValue().length;
    const maxText = max === Infinity ? '∞' : String(max);
    counter.textContent = `${len} / ${maxText}`;
    counter.classList.remove('is-good', 'is-warn', 'is-bad');

    let state = 'is-good';
    if (len < min || len > max) {
      // outside acceptable range
      const distLow  = min - len;          // positive when too short
      const distHigh = len - max;          // positive when too long
      const dist = Math.max(distLow, distHigh);
      state = dist <= WARN_WINDOW ? 'is-warn' : 'is-bad';
    } else {
      // inside [min, max] — warn if very close to either bound
      const nearLow  = len - min;
      const nearHigh = max - len;
      if ((min > 0 && nearLow <= WARN_WINDOW) ||
          (max !== Infinity && nearHigh <= WARN_WINDOW)) {
        state = 'is-warn';
      }
    }
    counter.classList.add(state);
  };

  // Initial render (deferred for Quill editors which initialize asynchronously)
  if (inputEl.classList && inputEl.classList.contains('quill-wrapper')) {
    setTimeout(update, 50);
    // Listen on the editor content
    const observer = new MutationObserver(update);
    setTimeout(() => {
      const ed = inputEl.querySelector('.ql-editor');
      if (ed) {
        observer.observe(ed, { characterData: true, childList: true, subtree: true });
        ed.addEventListener('input', update);
      }
    }, 60);
  } else {
    inputEl.addEventListener('input', update);
    update();
  }

  return counter;
}
