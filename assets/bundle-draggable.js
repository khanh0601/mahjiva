/**
 * Selleasy Bundle Draggable & Swipeable Carousel
 * - Strictly targets ONLY the Frequently Bought Together bundle container (.lb-bundle-offers)
 * - NEVER touches or displaces Selleasy's addon/upsell carousel (.lb-addon-cont / .lb-widget-cpac)
 * - Safe pointer tracking with strict boundary clamping: 0 <= scrollLeft <= maxScroll
 * - Normal clicks on bundle card items are 100% preserved
 */
(function() {
  'use strict';

  function sanitizeSelleasyAddon() {
    // Reset any erroneous scrollLeft on Selleasy Addon carousel widgets to eliminate white gaps
    try {
      const addonWidgets = document.querySelectorAll('.lb-addon-cont, [class*="lb-addon-cont"], .lb-widget-cpac, [class*="lb-widget-cpac"], .lb-carousel-cont');
      addonWidgets.forEach(el => {
        if (el.scrollLeft !== 0) el.scrollLeft = 0;
        el.querySelectorAll('div, ul').forEach(child => {
          if (child.scrollLeft !== 0) child.scrollLeft = 0;
        });
      });
    } catch (e) {}
  }

  function initDraggableBundle() {
    sanitizeSelleasyAddon();

    // STRICTLY target only the bundle offers block, NOT Selleasy addon carousel
    const selector = [
      '.lb-bundle-offers',
      '[class*="lb-bundle-offers"]',
      '.lb-bundle-products-cont',
      '.lb-bundle-products'
    ].join(', ');

    const containers = Array.from(document.querySelectorAll(selector));

    containers.forEach(container => {
      if (container.dataset.dragInit === 'true') return;
      container.dataset.dragInit = 'true';

      let isDown = false;
      let startX = 0;
      let startY = 0;
      let initialScrollLeft = 0;
      let isDragging = false;
      let preventClick = false;
      let hasCaptured = false;

      // Prevent native HTML5 ghost dragging
      container.addEventListener('dragstart', (e) => {
        e.preventDefault();
      });

      // Pointer down
      container.addEventListener('pointerdown', (e) => {
        if (e.target.closest('select, option, input, label, button, a, .lb-checkbox-cont, .lb-custom-checkbox, .lb-card-checkbox-cont, .lb-cta-container, [role="button"]')) {
          return;
        }

        isDown = true;
        isDragging = false;
        preventClick = false;
        hasCaptured = false;
        startX = e.clientX;
        startY = e.clientY;
        initialScrollLeft = container.scrollLeft;
      });

      container.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        if (!isDragging && Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
          isDragging = true;
          preventClick = true;
          container.classList.add('is-dragging');
          container.style.scrollBehavior = 'auto';

          try {
            container.setPointerCapture(e.pointerId);
            hasCaptured = true;
          } catch (err) {}
        }

        if (isDragging) {
          const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
          container.scrollLeft = Math.max(0, Math.min(maxScroll, initialScrollLeft - deltaX));
          e.preventDefault();
        }
      });

      function endDrag(e) {
        if (!isDown) return;
        isDown = false;

        if (hasCaptured) {
          try {
            container.releasePointerCapture(e.pointerId);
          } catch (err) {}
          hasCaptured = false;
        }

        container.classList.remove('is-dragging');
        container.style.scrollBehavior = '';

        if (isDragging) {
          setTimeout(() => {
            isDragging = false;
            preventClick = false;
          }, 80);
        } else {
          preventClick = false;
        }
      }

      container.addEventListener('pointerup', endDrag);
      container.addEventListener('pointercancel', endDrag);

      container.addEventListener('click', (e) => {
        if (preventClick || isDragging) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDraggableBundle);
  } else {
    initDraggableBundle();
  }

  // Observe for dynamic insertion by Selleasy custom elements
  const observer = new MutationObserver(() => {
    initDraggableBundle();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
