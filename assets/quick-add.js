if (!customElements.get('quick-add-modal')) {
  customElements.define(
    'quick-add-modal',
    class QuickAddModal extends ModalDialog {
      constructor() {
        super();
        this.modalContent = this.querySelector('[id^="QuickAddInfo-"]');

        this.addEventListener('product-info:loaded', ({ target }) => {
          target.addPreProcessCallback(this.preprocessHTML.bind(this));
        });
      }

      hide(preventFocus = false) {
        const cartNotification = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        if (cartNotification) cartNotification.setActiveElement(this.openedBy);
        if (!this.modalContent || !this.modalContent.querySelector('.luxury-quick-add')) {
          this.modalContent.innerHTML = '';
        }

        if (preventFocus) this.openedBy = null;
        super.hide();
      }

      show(opener) {
        if (this.modalContent && this.modalContent.querySelector('.luxury-quick-add')) {
          super.show(opener);
          return;
        }

        opener.setAttribute('aria-disabled', true);
        opener.classList.add('loading');
        opener.querySelector('.loading__spinner').classList.remove('hidden');

        fetch(opener.getAttribute('data-product-url'))
          .then((response) => response.text())
          .then((responseText) => {
            const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
            const productElement = responseHTML.querySelector('product-info');
            if (!productElement) {
              window.location.href = opener.getAttribute('data-product-url');
              return;
            }

            this.preprocessHTML(productElement);
            HTMLUpdateUtility.setInnerHTML(this.modalContent, productElement.outerHTML);

            if (window.Shopify && Shopify.PaymentButton) {
              Shopify.PaymentButton.init();
            }
            if (window.ProductModel) window.ProductModel.loadShopifyXR();

            super.show(opener);
          })
          .catch(() => {
            window.location.href = opener.getAttribute('data-product-url');
          })
          .finally(() => {
            opener.removeAttribute('aria-disabled');
            opener.classList.remove('loading');
            opener.querySelector('.loading__spinner').classList.add('hidden');
          });
      }

      preprocessHTML(productElement) {
        productElement.classList.forEach((classApplied) => {
          if (classApplied.startsWith('color-') || classApplied === 'gradient')
            this.modalContent.classList.add(classApplied);
        });
        this.preventDuplicatedIDs(productElement);
        this.removeDOMElements(productElement);
        this.removeGalleryListSemantic(productElement);
        this.updateImageSizes(productElement);
        this.preventVariantURLSwitching(productElement);
      }

      preventVariantURLSwitching(productElement) {
        productElement.setAttribute('data-update-url', 'false');
      }

      removeDOMElements(productElement) {
        const pickupAvailability = productElement.querySelector('pickup-availability');
        if (pickupAvailability) pickupAvailability.remove();

        const productModal = productElement.querySelector('product-modal');
        if (productModal) productModal.remove();

        const modalDialog = productElement.querySelectorAll('modal-dialog');
        if (modalDialog) modalDialog.forEach((modal) => modal.remove());
      }

      preventDuplicatedIDs(productElement) {
        const sectionId = productElement.dataset.section;

        const oldId = sectionId;
        const newId = `quickadd-${sectionId}`;
        productElement.innerHTML = productElement.innerHTML.replaceAll(oldId, newId);
        Array.from(productElement.attributes).forEach((attribute) => {
          if (attribute.value.includes(oldId)) {
            productElement.setAttribute(attribute.name, attribute.value.replace(oldId, newId));
          }
        });

        productElement.dataset.originalSection = sectionId;
      }

      removeGalleryListSemantic(productElement) {
        const galleryList = productElement.querySelector('[id^="Slider-Gallery"]');
        if (!galleryList) return;

        galleryList.setAttribute('role', 'presentation');
        galleryList.querySelectorAll('[id^="Slide-"]').forEach((li) => li.setAttribute('role', 'presentation'));
      }

      updateImageSizes(productElement) {
        const product = productElement.querySelector('.product');
        const desktopColumns = product?.classList.contains('product--columns');
        if (!desktopColumns) return;

        const mediaImages = product.querySelectorAll('.product__media img');
        if (!mediaImages.length) return;

        let mediaImageSizes =
          '(min-width: 1000px) 715px, (min-width: 750px) calc((100vw - 11.5rem) / 2), calc(100vw - 4rem)';

        if (product.classList.contains('product--medium')) {
          mediaImageSizes = mediaImageSizes.replace('715px', '605px');
        } else if (product.classList.contains('product--small')) {
          mediaImageSizes = mediaImageSizes.replace('715px', '495px');
        }

        mediaImages.forEach((img) => img.setAttribute('sizes', mediaImageSizes));
      }
    }
  );
}

/* =========================================================================
   LUXURY QUICK OPTIONS HANDLERS
   ========================================================================= */
window.lqaSelectOption = function(btn, productId, optIndex, optValue) {
  const root = document.getElementById('lqa-root-' + productId);
  if (!root) return;

  // 1. Highlight clicked pill in this option group
  const group = btn.closest('.lqa-option-group');
  if (group) {
    group.querySelectorAll('.lqa-pill').forEach(p => p.classList.remove('is-active'));
    btn.classList.add('is-active');
  }

  // 2. Update active label text
  const labelVal = document.getElementById('lqa-active-val-' + productId + '-' + optIndex);
  if (labelVal) labelVal.textContent = optValue;

  // 3. Collect all selected option values
  const allGroups = root.querySelectorAll('.lqa-option-group');
  const selectedOptions = [];
  allGroups.forEach(g => {
    const activePill = g.querySelector('.lqa-pill.is-active');
    if (activePill) selectedOptions.push(activePill.getAttribute('data-option-value'));
  });

  // 4. Find matching variant from registry
  const dataScript = document.getElementById('lqa-data-' + productId);
  if (!dataScript) return;
  let variants = [];
  try {
    variants = JSON.parse(dataScript.textContent);
  } catch(e) {
    console.error('Error parsing variants JSON:', e);
    return;
  }

  const matched = variants.find(v => {
    return v.options.every((opt, i) => opt === selectedOptions[i]);
  });

  if (!matched) return;

  // 5. Update preview image if available
  const imgEl = document.getElementById('lqa-img-' + productId);
  if (imgEl && matched.image) {
    imgEl.src = matched.image;
  }

  // 6. Update Price & Compare Price & Discount
  const priceEl = document.getElementById('lqa-price-' + productId);
  if (priceEl) priceEl.textContent = matched.price;

  const compareEl = document.getElementById('lqa-compare-' + productId);
  const discountEl = document.getElementById('lqa-discount-' + productId);
  const badgeEl = document.getElementById('lqa-badge-' + productId);

  if (matched.on_sale) {
    if (compareEl) {
      compareEl.textContent = matched.compare_at_price;
      compareEl.style.display = 'inline-block';
    }
    if (discountEl) {
      discountEl.textContent = matched.discount_pct;
      discountEl.style.display = 'inline-block';
    }
    if (badgeEl) badgeEl.style.display = 'inline-block';
  } else {
    if (compareEl) compareEl.style.display = 'none';
    if (discountEl) discountEl.style.display = 'none';
    if (badgeEl) badgeEl.style.display = 'none';
  }

  // 7. Update CTA button state & variant ID
  const atcBtn = document.getElementById('lqa-atc-' + productId);
  if (atcBtn) {
    atcBtn.setAttribute('data-variant-id', matched.id);
    const label = atcBtn.querySelector('.lqa-btn-label');
    if (matched.available) {
      atcBtn.removeAttribute('disabled');
      atcBtn.classList.remove('is-disabled');
      if (label) label.textContent = 'Add to cart';
    } else {
      atcBtn.setAttribute('disabled', 'disabled');
      atcBtn.classList.add('is-disabled');
      if (label) label.textContent = 'Sold out';
    }
  }
};

window.lqaChangeQty = function(productId, delta) {
  const input = document.getElementById('lqa-qty-' + productId);
  if (!input) return;
  let val = parseInt(input.value) || 1;
  val = Math.max(1, Math.min(99, val + delta));
  input.value = val;
};

window.lqaAddToCart = function(btn, productId) {
  const variantId = btn.getAttribute('data-variant-id');
  if (!variantId || btn.disabled) return;

  const qtyInput = document.getElementById('lqa-qty-' + productId);
  const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

  btn.classList.add('is-loading');
  const label = btn.querySelector('.lqa-btn-label');
  const origText = label ? label.textContent : 'Add to cart';
  if (label) label.textContent = 'Adding...';

  const cartDrawer = document.querySelector('cart-drawer');
  const sectionsToRender = cartDrawer && typeof cartDrawer.getSectionsToRender === 'function' 
    ? cartDrawer.getSectionsToRender().map(s => s.id) 
    : [];

  fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      id: variantId,
      quantity: qty,
      sections: sectionsToRender
    })
  })
  .then(res => {
    if (!res.ok) throw new Error('Cart error');
    return res.json();
  })
  .then(data => {
    btn.classList.remove('is-loading');
    btn.classList.add('is-added');
    if (label) label.textContent = 'Added ✓';

    // Update cart bubble counts
    fetch('/cart.js')
      .then(r => r.json())
      .then(cart => {
        document.querySelectorAll('.cart-count-bubble, [data-cart-count], .header__cart-count').forEach(el => {
          el.textContent = cart.item_count;
          el.classList.remove('hidden');
        });
      })
      .catch(e => console.error(e));

    // Render & open Cart Drawer if available
    if (cartDrawer && typeof cartDrawer.renderContents === 'function' && data.sections) {
      cartDrawer.renderContents(data);
    } else if (cartDrawer && typeof cartDrawer.open === 'function') {
      cartDrawer.open();
    }

    // Close the QuickAdd modal after 1.2s
    setTimeout(() => {
      const modal = btn.closest('quick-add-modal');
      if (modal && typeof modal.hide === 'function') {
        modal.hide();
      }
      btn.classList.remove('is-added');
      if (label) label.textContent = origText;
    }, 1200);
  })
  .catch(err => {
    console.error('Error adding to cart:', err);
    btn.classList.remove('is-loading');
    if (label) label.textContent = 'Error';
    setTimeout(() => {
      if (label) label.textContent = origText;
    }, 2000);
  });
};
