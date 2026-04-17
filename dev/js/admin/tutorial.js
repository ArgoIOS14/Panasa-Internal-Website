/**
 * Tutorial and help system for admin CMS.
 * Provides first-login walkthrough, help modal, and contextual tooltips.
 */

const STEPS = [
  { target: '#page-select', title: 'Choose a Page', text: 'Select which page you want to edit from this dropdown. Each page on the website has its own content sections.', position: 'bottom' },
  { target: '.editor-section:first-child .editor-section-toggle', title: 'Edit Sections', text: 'Click on any section to expand it and edit the content inside. Each section maps to a part of the page.', position: 'bottom' },
  { target: '.image-upload-widget', title: 'Upload Images', text: 'Drag and drop images here, click Browse to pick a file, or use the Gallery to choose from existing images.', position: 'top' },
  { target: '#save-btn', title: 'Save as Draft', text: 'Save your changes as a private draft. Only you can see drafts \u2014 they won\'t appear on the live website until you publish.', position: 'top' },
  { target: '#publish-btn', title: 'Publish Live', text: 'When you\'re happy with your changes, publish them to make them live on the website. The static HTML is automatically rebuilt for SEO.', position: 'top' },
  { target: '#history-btn', title: 'Version History', text: 'Every time you publish, a snapshot is saved. You can view and restore any previous version from here.', position: 'bottom' },
];

const HELP_SECTIONS = [
  { title: 'Getting Started', body: 'Choose a page from the dropdown, expand sections to edit, save as draft or publish live.' },
  { title: 'Editing Content', body: 'Text fields support rich formatting. Use the toolbar for bold, italic, links, and lists.' },
  { title: 'Images & Media', body: 'Upload images by dragging them into the upload area, clicking Browse, pasting a URL, or selecting from the Gallery. The gallery shows both your uploads and existing site assets.' },
  { title: 'Save vs Publish', body: 'Save Draft: saves privately, only visible in the admin. Publish: makes changes live on the website and triggers an HTML rebuild for search engines.' },
  { title: 'Version History', body: 'Every publish creates a version snapshot. Click History to view past versions, compare changes, or restore a previous version.' },
  { title: 'Keyboard Shortcuts', body: 'Ctrl/Cmd+S: Save Draft | Ctrl/Cmd+Shift+P: Publish | Ctrl/Cmd+Z: Undo | Ctrl/Cmd+Shift+Z: Redo' },
  { title: 'Advanced Tools', body: 'Dashboard: view analytics across all pages. Audit Log: see who changed what. Bulk Ops: publish or rebuild multiple pages at once.' },
];

/* ------------------------------------------------------------------ */
/*  Walkthrough                                                        */
/* ------------------------------------------------------------------ */

let currentStep = 0;
let overlayEl = null;
let spotlightEl = null;
let tooltipEl = null;

function clearWalkthrough() {
  if (overlayEl) { overlayEl.remove(); overlayEl = null; }
  if (spotlightEl) { spotlightEl.remove(); spotlightEl = null; }
  if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
}

function finishWalkthrough() {
  clearWalkthrough();
  localStorage.setItem('panasa_tutorial_complete', 'true');
}

function showStep(index) {
  clearWalkthrough();

  // Skip missing targets until we find one or exhaust the list
  while (index < STEPS.length && !document.querySelector(STEPS[index].target)) {
    index++;
  }
  if (index >= STEPS.length) {
    finishWalkthrough();
    return;
  }
  currentStep = index;
  const step = STEPS[currentStep];
  const targetEl = document.querySelector(step.target);
  const rect = targetEl.getBoundingClientRect();

  // Scroll target into view if needed
  targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Overlay
  overlayEl = document.createElement('div');
  overlayEl.className = 'tutorial-overlay';
  document.body.appendChild(overlayEl);

  // Spotlight cutout
  spotlightEl = document.createElement('div');
  spotlightEl.className = 'tutorial-spotlight';
  const pad = 8;
  Object.assign(spotlightEl.style, {
    position: 'fixed',
    top: (rect.top - pad) + 'px',
    left: (rect.left - pad) + 'px',
    width: (rect.width + pad * 2) + 'px',
    height: (rect.height + pad * 2) + 'px',
    borderRadius: '6px',
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
    zIndex: '100001',
    pointerEvents: 'none',
  });
  document.body.appendChild(spotlightEl);

  // Tooltip card
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'tutorial-tooltip';

  const isLast = currentStep === STEPS.length - 1;
  tooltipEl.innerHTML = `
    <h3>${step.title}</h3>
    <p>${step.text}</p>
    <div class="tutorial-tooltip-footer">
      <span class="tutorial-step-counter">Step ${currentStep + 1} of ${STEPS.length}</span>
      <div class="tutorial-tooltip-actions">
        <button class="btn btn-text tutorial-skip">Skip tutorial</button>
        <button class="btn btn-primary tutorial-next">${isLast ? 'Done \u2713' : 'Next \u2192'}</button>
      </div>
    </div>
  `;

  // Position tooltip relative to target
  Object.assign(tooltipEl.style, {
    position: 'fixed',
    zIndex: '100002',
  });
  document.body.appendChild(tooltipEl);

  // Calculate position after tooltip is in the DOM so we can measure it
  requestAnimationFrame(() => {
    const tipRect = tooltipEl.getBoundingClientRect();
    let top, left;

    if (step.position === 'bottom') {
      top = rect.bottom + pad + 12;
      left = rect.left + rect.width / 2 - tipRect.width / 2;
    } else {
      top = rect.top - pad - 12 - tipRect.height;
      left = rect.left + rect.width / 2 - tipRect.width / 2;
    }

    // Keep tooltip within viewport
    left = Math.max(12, Math.min(left, window.innerWidth - tipRect.width - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - tipRect.height - 12));

    tooltipEl.style.top = top + 'px';
    tooltipEl.style.left = left + 'px';
  });

  // Button handlers
  tooltipEl.querySelector('.tutorial-skip').addEventListener('click', finishWalkthrough);
  tooltipEl.querySelector('.tutorial-next').addEventListener('click', () => {
    if (isLast) {
      finishWalkthrough();
    } else {
      showStep(currentStep + 1);
    }
  });
}

function startWalkthrough() {
  currentStep = 0;
  showStep(0);
}

/* ------------------------------------------------------------------ */
/*  Help modal                                                         */
/* ------------------------------------------------------------------ */

function openHelpModal() {
  // Avoid duplicates
  const existing = document.querySelector('.tutorial-help-modal');
  if (existing) { existing.remove(); }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay tutorial-help-modal';

  const accordionHTML = HELP_SECTIONS.map((section, i) => `
    <div class="help-accordion-item" data-index="${i}">
      <button class="help-accordion-header" aria-expanded="false">
        <span>${section.title}</span>
        <span class="help-accordion-icon">+</span>
      </button>
      <div class="help-accordion-body" hidden>
        <p>${section.body}</p>
      </div>
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Help & Guide</h2>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="help-sections">
        ${accordionHTML}
      </div>
      <button class="btn btn-secondary" id="restart-tutorial">Restart Tutorial</button>
    </div>
  `;

  document.body.appendChild(modal);

  // Close button
  modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Accordion toggle
  modal.querySelectorAll('.help-accordion-header').forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.closest('.help-accordion-item');
      const body = item.querySelector('.help-accordion-body');
      const icon = header.querySelector('.help-accordion-icon');
      const isOpen = !body.hidden;

      // Close all others
      modal.querySelectorAll('.help-accordion-body').forEach((b) => { b.hidden = true; });
      modal.querySelectorAll('.help-accordion-header').forEach((h) => {
        h.setAttribute('aria-expanded', 'false');
        h.querySelector('.help-accordion-icon').textContent = '+';
      });

      if (!isOpen) {
        body.hidden = false;
        header.setAttribute('aria-expanded', 'true');
        icon.textContent = '\u2212';
      }
    });
  });

  // Restart tutorial
  modal.querySelector('#restart-tutorial').addEventListener('click', () => {
    modal.remove();
    localStorage.removeItem('panasa_tutorial_complete');
    startWalkthrough();
  });
}

/* ------------------------------------------------------------------ */
/*  Contextual help hints                                              */
/* ------------------------------------------------------------------ */

let hintTimer = null;
let activeHint = null;

function removeHint() {
  clearTimeout(hintTimer);
  if (activeHint) { activeHint.remove(); activeHint = null; }
}

function initContextualHints() {
  document.querySelectorAll('[data-help]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      removeHint();
      hintTimer = setTimeout(() => {
        const text = el.getAttribute('data-help');
        if (!text) return;

        activeHint = document.createElement('div');
        activeHint.className = 'help-hint';
        activeHint.textContent = text;

        document.body.appendChild(activeHint);

        const elRect = el.getBoundingClientRect();
        const hintRect = activeHint.getBoundingClientRect();

        let top = elRect.top - hintRect.height - 8;
        let left = elRect.left + elRect.width / 2 - hintRect.width / 2;

        // Flip below if above would go off-screen
        if (top < 4) {
          top = elRect.bottom + 8;
        }
        left = Math.max(4, Math.min(left, window.innerWidth - hintRect.width - 4));

        Object.assign(activeHint.style, {
          top: top + 'px',
          left: left + 'px',
        });
      }, 300);
    });

    el.addEventListener('mouseleave', removeHint);
  });
}

/* ------------------------------------------------------------------ */
/*  Init                                                               */
/* ------------------------------------------------------------------ */

export function initTutorial() {
  // Wire help button
  const helpBtn = document.getElementById('help-btn');
  if (helpBtn) {
    helpBtn.addEventListener('click', openHelpModal);
  }

  // Contextual hints
  initContextualHints();

  // First-login walkthrough
  if (!localStorage.getItem('panasa_tutorial_complete')) {
    setTimeout(startWalkthrough, 500);
  }
}
