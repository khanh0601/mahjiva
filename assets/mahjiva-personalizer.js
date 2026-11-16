/*
 * Mahjiva Personalizer
 * Binds the steps rendered by snippets/mahjiva-personalizer.liquid to a live preview.
 *
 * Preview hooks (place anywhere inside the element marked [data-pz-scope]):
 *   [data-pz-text="<option handle>"]   text content follows a text/textarea step
 *                                       (data-pz-empty = text shown while empty)
 *   [data-pz-font="<option handle>"]   font-family follows a font step (needs Font File)
 *   [data-pz-bg="<option handle>"]     background-color follows a swatch with Color
 *   [data-pz-layer="<option handle>"]  <img> src follows a swatch with Layer Image
 */
(function () {
  var CHOICE_TYPES = ['image_swatch', 'color_swatch', 'text_color', 'font'];

  function each(scope, selector, fn) {
    Array.prototype.forEach.call(scope.querySelectorAll(selector), fn);
  }

  function selectedChoice(step, type) {
    if (type === 'dropdown') {
      var select = step.querySelector('select');
      var opt = select && select.options[select.selectedIndex];
      return opt && opt.value ? opt : null;
    }
    if (CHOICE_TYPES.indexOf(type) !== -1) {
      return step.querySelector('input[type="radio"]:checked');
    }
    return null;
  }

  function applyText(scope, key, value) {
    each(scope, '[data-pz-text="' + key + '"]', function (el) {
      if (value) {
        el.textContent = value;
        el.classList.remove('pz-is-empty');
      } else {
        el.textContent = el.getAttribute('data-pz-empty') || '';
        el.classList.add('pz-is-empty');
      }
    });
  }

  function applyChoice(scope, key, choice) {
    var color = choice ? choice.getAttribute('data-color') : '';
    var layer = choice ? choice.getAttribute('data-layer') : '';
    var font = choice ? choice.getAttribute('data-font-family') : '';

    each(scope, '[data-pz-bg="' + key + '"]', function (el) {
      el.style.backgroundColor = color || '';
    });

    // Theme CSS sets font-family with !important on text, so preview styles need priority too.
    each(scope, '[data-pz-font="' + key + '"]', function (el) {
      if (font) {
        el.style.setProperty('font-family', '"' + font + '", serif', 'important');
        el.style.setProperty('font-weight', '400', 'important');
      } else {
        el.style.removeProperty('font-family');
        el.style.removeProperty('font-weight');
      }
    });

    each(scope, '[data-pz-textcolor="' + key + '"]', function (el) {
      if (color) el.style.setProperty('color', color, 'important');
      else el.style.removeProperty('color');
    });

    each(scope, '[data-pz-layer="' + key + '"]', function (img) {
      if (layer) {
        if (img.getAttribute('src') !== layer) img.setAttribute('src', layer);
        img.hidden = false;
      } else {
        img.hidden = true;
        img.removeAttribute('src');
      }
    });
  }

  function update(scope, step) {
    var key = step.getAttribute('data-pz-key');
    var type = step.getAttribute('data-pz-type');
    var label = step.querySelector('[data-pz-selected]');
    var done = false;
    var summary = '';

    if (type === 'text' || type === 'textarea') {
      var field = step.querySelector('[data-pz-input]');
      var value = field ? field.value.trim() : '';
      var counter = step.querySelector('[data-pz-counter]');
      if (counter && field) {
        counter.textContent = field.value.length + '/' + field.getAttribute('maxlength');
      }
      applyText(scope, key, value);

      // Per-line colour (inside the text step)
      var lineColor = step.querySelector('[data-pz-line-color]');
      if (lineColor) {
        var colorTouched = step.hasAttribute('data-pz-color-touched');
        var lineHex = lineColor.value.toUpperCase();
        each(scope, '[data-pz-text="' + key + '"]', function (el) {
          if (colorTouched) el.style.setProperty('color', lineHex, 'important');
          else el.style.removeProperty('color');
        });
        var colorLabel = step.querySelector('[data-pz-line-color-label]');
        if (colorLabel && colorTouched) colorLabel.textContent = lineHex;
        lineCommit(step, 'color', colorTouched ? lineHex : '');
      }

      // Per-line size (inside the text step)
      var lineSize = step.querySelector('[data-pz-line-size]');
      if (lineSize) {
        var sizeTouched = step.hasAttribute('data-pz-size-touched');
        var linePct = parseInt(lineSize.value, 10) || 100;
        var sizeOut = step.querySelector('[data-pz-line-size-value]');
        if (sizeOut) sizeOut.textContent = linePct + '%';
        scaleEls(scope, '.pz-stage [data-pz-text="' + key + '"]', sizeTouched ? linePct : 100);
        lineCommit(step, 'size', sizeTouched ? linePct + '% of standard size' : '');
      }
      done = value.length > 0;
    } else if (step.querySelector('[data-pz-picker]')) {
      // Free text colour picker
      var picker = step.querySelector('[data-pz-picker]');
      var pickerLabel = step.querySelector('[data-pz-picker-value]');
      var touchedColor = step.hasAttribute('data-pz-touched');
      var hex = picker.value.toUpperCase();
      each(scope, '[data-pz-textcolor="' + key + '"]', function (el) {
        if (touchedColor) el.style.setProperty('color', hex, 'important');
        else el.style.removeProperty('color');
      });
      commitValue(step, touchedColor ? hex : '');
      if (touchedColor && pickerLabel) pickerLabel.textContent = hex;
      summary = touchedColor ? hex : '';
      done = touchedColor;
    } else if (type === 'text_size') {
      var range = step.querySelector('[data-pz-range]');
      var rangeOut = step.querySelector('[data-pz-range-value]');
      var touchedSize = step.hasAttribute('data-pz-touched');
      var pct = range ? parseInt(range.value, 10) || 100 : 100;
      if (rangeOut) rangeOut.textContent = pct + '%';
      applySize(scope, key, touchedSize ? pct : 100);
      commitValue(step, touchedSize ? pct + '% of standard size' : '');
      summary = touchedSize ? pct + '%' : '';
      done = touchedSize;
    } else if (type === 'upload') {
      var input = step.querySelector('input[type="file"]');
      var nameEl = step.querySelector('[data-pz-file-name]');
      var file = input && input.files && input.files[0];
      if (nameEl) {
        if (!nameEl.hasAttribute('data-pz-default')) {
          nameEl.setAttribute('data-pz-default', nameEl.textContent);
        }
        nameEl.textContent = file ? file.name : nameEl.getAttribute('data-pz-default');
      }
      done = !!file;
    } else {
      var choice = selectedChoice(step, type);
      applyChoice(scope, key, choice);
      summary = choice ? choice.getAttribute('data-label') || '' : '';
      done = !!choice;
    }

    if (label) label.textContent = summary;
    step.classList.toggle('is-complete', done);
  }

  /* Conditional steps ([data-pz-show-when] = comma list of value handles) */
  function pickedHandles(root) {
    var picked = {};
    each(root, '[data-pz-step]', function (step) {
      if (step.hidden) return;
      each(step, 'input[type="radio"][data-pz-vh]:checked', function (input) {
        picked[input.getAttribute('data-pz-vh')] = true;
      });
      each(step, 'select', function (select) {
        var opt = select.options[select.selectedIndex];
        if (opt && opt.value && opt.getAttribute('data-pz-vh')) picked[opt.getAttribute('data-pz-vh')] = true;
      });
    });
    return picked;
  }

  function clearStep(scope, step) {
    var key = step.getAttribute('data-pz-key');
    var type = step.getAttribute('data-pz-type');
    if (type === 'text' || type === 'textarea') {
      applyText(scope, key, '');
      each(scope, '[data-pz-text="' + key + '"]', function (el) { el.style.removeProperty('color'); });
      scaleEls(scope, '.pz-stage [data-pz-text="' + key + '"]', 100);
    } else if (type === 'text_size') {
      applySize(scope, key, 100);
    } else if (step.querySelector('[data-pz-picker]')) {
      each(scope, '[data-pz-textcolor="' + key + '"]', function (el) { el.style.removeProperty('color'); });
    } else if (type !== 'upload') {
      applyChoice(scope, key, null);
    }
  }

  function setStepActive(scope, step, active) {
    step.hidden = !active;
    each(step, 'input, select, textarea', function (el) {
      if (!active) {
        if (!el.hasAttribute('data-pz-off')) el.setAttribute('data-pz-off', el.disabled ? '1' : '0');
        el.disabled = true;
      } else if (el.hasAttribute('data-pz-off')) {
        el.disabled = el.getAttribute('data-pz-off') === '1';
        el.removeAttribute('data-pz-off');
      }
    });
    if (active) update(scope, step);
    else {
      step.classList.remove('is-invalid');
      clearStep(scope, step);
    }
  }

  function applyConditions(scope, root) {
    // Repeat so a step that depends on a step that was just hidden also hides.
    for (var pass = 0; pass < 5; pass++) {
      var changed = false;
      var picked = pickedHandles(root);
      each(root, '[data-pz-step][data-pz-show-when]', function (step) {
        var handles = step.getAttribute('data-pz-show-when').split(',');
        var show = false;
        for (var i = 0; i < handles.length; i++) {
          if (handles[i] && picked[handles[i]]) { show = true; break; }
        }
        if (step.hasAttribute('data-pz-cond-ready') && show === !step.hidden) return;
        step.setAttribute('data-pz-cond-ready', '');
        setStepActive(scope, step, show);
        changed = true;
      });
      if (!changed) break;
    }
    var n = 0;
    each(root, '[data-pz-step]', function (step) {
      if (step.hidden) return;
      n += 1;
      var num = step.querySelector('.pz-step__num');
      if (num) num.textContent = n;
    });
  }

  function commitValue(step, value) {
    var commit = step.querySelector('[data-pz-commit]');
    if (!commit) return;
    commit.value = value;
    commit.disabled = !value;
  }

  function lineCommit(step, kind, value) {
    var commit = step.querySelector('[data-pz-line-commit="' + kind + '"]');
    if (!commit) return;
    commit.value = value;
    commit.disabled = !value;
  }

  function applySize(scope, key, pct) {
    scaleEls(scope, '[data-pz-textsize="' + key + '"]', pct);
  }

  function scaleEls(scope, selector, pct) {
    each(scope, selector, function (el) {
      if (!el.hasAttribute('data-pz-base-size')) {
        el.style.removeProperty('font-size');
        el.setAttribute('data-pz-base-size', parseFloat(window.getComputedStyle(el).fontSize) || 32);
      }
      var base = parseFloat(el.getAttribute('data-pz-base-size'));
      if (pct === 100) el.style.removeProperty('font-size');
      else el.style.setProperty('font-size', (base * pct / 100).toFixed(1) + 'px', 'important');
    });
  }

  /* Live preview / Photos toggle ([data-pz-view]) */
  function setViewMode(view, mode) {
    var stage = view.querySelector('[data-pz-stage]');
    var photosSel = view.getAttribute('data-pz-photos');
    var photos = photosSel ? document.querySelector(photosSel) : null;
    var isPreview = mode === 'preview';

    view.setAttribute('data-pz-mode', mode);
    if (stage) stage.hidden = !isPreview;
    if (photos) photos.style.display = isPreview ? 'none' : '';

    each(view, '[data-pz-view-tab]', function (tab) {
      var active = tab.getAttribute('data-pz-view-tab') === mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function initView(view) {
    if (view.hasAttribute('data-pz-view-ready')) return;
    view.setAttribute('data-pz-view-ready', '');

    each(view, '[data-pz-view-tab]', function (tab) {
      tab.addEventListener('click', function () {
        setViewMode(view, tab.getAttribute('data-pz-view-tab'));
      });
    });

    var triggersSel = view.getAttribute('data-pz-triggers');
    if (triggersSel) {
      each(document, triggersSel, function (trigger) {
        trigger.addEventListener('click', function () { setViewMode(view, 'photos'); }, true);
      });
    }

    setViewMode(view, 'photos');
  }

  /* Draggable text in the live preview ([data-pz-drag]) */
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  function describePosition(x, y) {
    var h = x < 36 ? 'left' : (x > 64 ? 'right' : 'center');
    var v = y < 36 ? 'Top' : (y > 64 ? 'Bottom' : 'Middle');
    var area = (v === 'Middle' && h === 'center') ? 'Center' : v + ' ' + h;
    return area + ' (x ' + Math.round(x) + '%, y ' + Math.round(y) + '% from top-left)';
  }

  function placeLine(el, x, y) {
    el.style.left = x.toFixed(1) + '%';
    el.style.top = y.toFixed(1) + '%';
  }

  function commitPosition(scope, view, el) {
    var key = el.getAttribute('data-pz-drag');
    var x = parseFloat(el.style.left);
    var y = parseFloat(el.style.top);
    each(scope, '[data-pz-position="' + key + '"]', function (input) {
      input.disabled = false;
      input.value = describePosition(x, y);
    });
    el.setAttribute('data-pz-moved', '');
    var reset = view.querySelector('[data-pz-reset]');
    if (reset) reset.hidden = false;
  }

  function initDrag(scope, view) {
    var stage = view.querySelector('[data-pz-stage]');
    if (!stage) return;

    each(stage, '[data-pz-drag]', function (el) {
      el.setAttribute('data-pz-default', el.style.left + '|' + el.style.top);
      var dragging = false;

      el.addEventListener('pointerdown', function (event) {
        if (event.button !== undefined && event.button !== 0) return;
        dragging = true;
        el.classList.add('is-dragging');
        if (el.setPointerCapture) el.setPointerCapture(event.pointerId);
        event.preventDefault();
      });

      el.addEventListener('pointermove', function (event) {
        if (!dragging) return;
        var rect = stage.getBoundingClientRect();
        var x = clamp((event.clientX - rect.left) / rect.width * 100, 4, 96);
        var y = clamp((event.clientY - rect.top) / rect.height * 100, 4, 96);
        placeLine(el, x, y);
      });

      var end = function () {
        if (!dragging) return;
        dragging = false;
        el.classList.remove('is-dragging');
        commitPosition(scope, view, el);
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);

      el.addEventListener('keydown', function (event) {
        var step = event.shiftKey ? 5 : 1;
        var dx = 0;
        var dy = 0;
        if (event.key === 'ArrowLeft') dx = -step;
        else if (event.key === 'ArrowRight') dx = step;
        else if (event.key === 'ArrowUp') dy = -step;
        else if (event.key === 'ArrowDown') dy = step;
        else return;
        event.preventDefault();
        placeLine(
          el,
          clamp(parseFloat(el.style.left) + dx, 4, 96),
          clamp(parseFloat(el.style.top) + dy, 4, 96)
        );
        commitPosition(scope, view, el);
      });
    });

    var reset = view.querySelector('[data-pz-reset]');
    if (reset) {
      reset.addEventListener('click', function () {
        each(stage, '[data-pz-drag]', function (el) {
          var parts = (el.getAttribute('data-pz-default') || '50%|50%').split('|');
          el.style.left = parts[0];
          el.style.top = parts[1];
          el.removeAttribute('data-pz-moved');
          each(scope, '[data-pz-position="' + el.getAttribute('data-pz-drag') + '"]', function (input) {
            input.value = '';
            input.disabled = true;
          });
        });
        reset.hidden = true;
      });
    }
  }

  function showPreview(scope) {
    each(scope, '[data-pz-view]', function (view) {
      if (view.getAttribute('data-pz-mode') !== 'preview') setViewMode(view, 'preview');
    });
  }

  /* "View preview" button: visible while the preview stage is covered or off screen */
  function initPeek(scope, root) {
    var peek = root.querySelector('[data-pz-peek]');
    var view = scope.querySelector('[data-pz-view]');
    if (!peek || !view) return;
    var stage = view.querySelector('[data-pz-stage]');
    if (!stage) return;
    var queued = false;

    var check = function () {
      queued = false;
      var show = false;
      if (!stage.hidden) {
        var rr = root.getBoundingClientRect();
        var inSteps = rr.top < window.innerHeight * 0.7 && rr.bottom > 120;
        var r = stage.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var seen = false;
        if (cy > 0 && cy < window.innerHeight && cx > 0 && cx < window.innerWidth) {
          var el = document.elementFromPoint(cx, cy);
          seen = !!el && stage.contains(el);
        }
        show = inSteps && !seen;
      }
      peek.hidden = !show;
    };
    var queue = function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(check);
    };

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    root.addEventListener('input', queue);
    root.addEventListener('change', queue);
    peek.addEventListener('click', function () {
      var top = scope.getBoundingClientRect().top + window.pageYOffset - 76;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
    check();
  }

  function init(root) {
    if (root.hasAttribute('data-pz-ready')) return;
    root.setAttribute('data-pz-ready', '');

    var scope = root.closest('[data-pz-scope]') || document;
    each(scope, '[data-pz-view]', function (view) {
      var fresh = !view.hasAttribute('data-pz-view-ready');
      initView(view);
      if (fresh) initDrag(scope, view);
    });

    each(root, '[data-pz-step]', function (step) {
      var handler = function () { update(scope, step); };
      var userHandler = function () {
        step.setAttribute('data-pz-touched', '');
        update(scope, step);
        applyConditions(scope, root);
        showPreview(scope);
      };
      // Mark which inline control was used (runs before the step-level handler)
      each(step, '[data-pz-line-color]', function (input) {
        input.addEventListener('input', function () { step.setAttribute('data-pz-color-touched', ''); });
      });
      each(step, '[data-pz-line-size]', function (input) {
        input.addEventListener('input', function () { step.setAttribute('data-pz-size-touched', ''); });
      });
      step.addEventListener('input', userHandler);
      step.addEventListener('change', userHandler);
      handler();
    });
    applyConditions(scope, root);
    if (scope !== document) initPeek(scope, root);

    var form = root.closest('form');
    if (form) {
      form.addEventListener('invalid', function (event) {
        var step = event.target.closest && event.target.closest('[data-pz-step]');
        if (step) step.classList.add('is-invalid');
      }, true);
      form.addEventListener('change', function (event) {
        var step = event.target.closest && event.target.closest('[data-pz-step]');
        if (step) step.classList.remove('is-invalid');
      });
    }
  }

  function initAll(container) {
    each(container || document, '[data-pz-root]', init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (event) {
    initAll(event.target);
  });
})();
