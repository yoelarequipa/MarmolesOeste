/**
 * ══════════════════════════════════════════════════════════
 *  MÁRMOLES OESTE — script.js
 *  - Tab navigation
 *  - Navbar sticky + scroll state
 *  - Hamburger menu toggle
 *  - Tab-aware animations (anim-in)
 *  - Product filter tabs
 *  - Dropdown nav (Productos)
 *  - Lightbox / gallery modal
 *  - Contact form validation
 * ══════════════════════════════════════════════════════════
 */

'use strict';

/* ─────────────────────────────────────
   HELPERS
───────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);


/* ─────────────────────────────────────
   1. TAB NAVIGATION
───────────────────────────────────── */
(function initTabs() {
  const pages   = $$('.tab-page');
  const navBtns = $$('[data-tab]');
  if (!pages.length) return;

  const switchTab = (tabId, skipScroll = false) => {
    pages.forEach(p => p.classList.remove('active', 'page-enter'));

    const target = $(`#tab-${tabId}`);
    if (!target) return;

    target.classList.add('active');

    requestAnimationFrame(() => {
      target.classList.add('page-enter');
      $$('.anim-in', target).forEach(el => el.classList.remove('visible'));
      setTimeout(() => {
        $$('.anim-in', target).forEach(el => el.classList.add('visible'));
      }, 30);
    });

    $$('.nav-link').forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active-link', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    if (!skipScroll) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    history.replaceState(null, '', `#${tabId}`);

    const navbar = $('#navbar');
    if (navbar) {
      navbar.classList.toggle('on-hero', tabId === 'inicio');
    }
  };

  // Click handler — supports data-filter on dropdown items
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;

    // Ignore if it's the dropdown trigger itself being hovered — handled by CSS
    // But if clicked directly, navigate
    const tabId = btn.dataset.tab;
    const filterId = btn.dataset.filter;

    if (tabId) {
      e.preventDefault();
      switchTab(tabId);

      // If the click came from a dropdown item with a filter, apply it after tab switch
      if (filterId) {
        setTimeout(() => applyFilter(filterId), 80);
      }

      // Close mobile menu if open
      const hamburger = $('#hamburger');
      const navLinks  = $('#navLinks');
      if (hamburger && hamburger.classList.contains('open')) {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }

      // Close dropdown on mobile
      $$('.nav-item--dropdown').forEach(d => d.classList.remove('open'));
    }
  });

  const initialTab = (location.hash.replace('#', '') || 'inicio');
  switchTab(initialTab, true);

  const initPage = $(`#tab-${initialTab}`);
  if (initPage) {
    setTimeout(() => {
      initPage.classList.add('page-enter');
      $$('.anim-in', initPage).forEach(el => el.classList.add('visible'));
    }, 80);
  }
})();


/* ─────────────────────────────────────
   2. NAVBAR — STICKY + SCROLL STATE
───────────────────────────────────── */
(function initNavbar() {
  const navbar = $('#navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ─────────────────────────────────────
   3. HAMBURGER MENU
───────────────────────────────────── */
(function initHamburger() {
  const hamburger = $('#hamburger');
  const navLinks  = $('#navLinks');
  if (!hamburger || !navLinks) return;

  const toggleMenu = (force) => {
    const isOpen = typeof force === 'boolean'
      ? force
      : !hamburger.classList.contains('open');

    hamburger.classList.toggle('open', isOpen);
    navLinks.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  hamburger.addEventListener('click', () => toggleMenu());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburger.classList.contains('open')) {
      toggleMenu(false);
    }
  });

  document.addEventListener('click', (e) => {
    if (
      hamburger.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      !hamburger.contains(e.target) &&
      !e.target.closest('[data-tab]')
    ) {
      toggleMenu(false);
    }
  });
})();


/* ─────────────────────────────────────
   4. DROPDOWN NAV (Productos)
   Desktop: CSS hover handles show/hide.
   Mobile: toggle .open class on click.
───────────────────────────────────── */
(function initDropdown() {
  const dropdownItems = $$('.nav-item--dropdown');
  if (!dropdownItems.length) return;

  dropdownItems.forEach(item => {
    const trigger = item.querySelector('.nav-link--dropdown-trigger');
    if (!trigger) return;

    // Mobile: toggle open class on trigger click
    trigger.addEventListener('click', (e) => {
      // Only intercept on mobile (hamburger visible)
      const hamburger = $('#hamburger');
      if (!hamburger) return;
      const isMobile = window.getComputedStyle(hamburger).display !== 'none';
      if (!isMobile) return;

      // Don't let the tab switch fire for the trigger on mobile — just toggle dropdown
      e.stopPropagation();
      e.preventDefault();
      item.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(item.classList.contains('open')));
    });

    // Keyboard: open on Enter/Space, close on Escape
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.classList.toggle('open');
        trigger.setAttribute('aria-expanded', String(item.classList.contains('open')));
      }
      if (e.key === 'Escape') {
        item.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      }
    });

    // Close dropdown when clicking outside (desktop)
    document.addEventListener('click', (e) => {
      if (!item.contains(e.target)) {
        item.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });
})();


/* ─────────────────────────────────────
   5. PRODUCT FILTER TABS
   Exposed as applyFilter() so the
   dropdown can trigger it after tab switch.
───────────────────────────────────── */
function applyFilter(filter) {
  const tabs  = $$('.filter-tab');
  const cards = $$('.product-card');
  if (!tabs.length || !cards.length) return;

  tabs.forEach(t => {
    const isActive = t.dataset.filter === filter;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', String(isActive));
  });

  cards.forEach(card => {
    const shouldShow = filter === 'all' || card.dataset.category === filter;
    if (shouldShow) {
      card.classList.remove('product-card--hidden');
      card.classList.remove('visible');
      requestAnimationFrame(() => card.classList.add('visible'));
    } else {
      card.classList.add('product-card--hidden');
    }
  });
}

(function initProductFilter() {
  const tabs = $$('.filter-tab');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => applyFilter(tab.dataset.filter));
  });
})();


/* ─────────────────────────────────────
   6. LIGHTBOX / GALLERY
───────────────────────────────────── */
(function initLightbox() {
  const lightbox   = $('#lightbox');
  if (!lightbox) return;

  const img        = $('#lightboxImg');
  const title      = $('#lightboxTitle');
  const tag        = $('#lightboxTag');
  const counter    = $('#lightboxCounter');
  const thumbsWrap = $('#lightboxThumbs');
  const btnClose   = $('#lightboxClose');
  const btnPrev    = $('#lightboxPrev');
  const btnNext    = $('#lightboxNext');
  const backdrop   = lightbox.querySelector('.lightbox__backdrop');

  let images  = [];  // array of { src, alt }
  let current = 0;

  /* ── Open ── */
  function openLightbox(card, startIndex = 0) {
    // Collect images: main card image + any in data-gallery
    const mainImg  = card.querySelector('.product-card__img-wrap img');
    const extraSrc = (card.dataset.gallery || '').split(',').map(s => s.trim()).filter(Boolean);

    images = [
      { src: mainImg.src, alt: mainImg.alt }
    ];

    extraSrc.forEach(src => {
      if (src) images.push({ src, alt: mainImg.alt });
    });

    // Card meta
    const cardTitle = card.querySelector('h3')?.textContent || '';
    const cardTag   = card.querySelector('.product-card__tag')?.textContent || '';
    title.textContent = cardTitle;
    tag.textContent   = cardTag;

    // Build thumbnails
    thumbsWrap.innerHTML = '';
    images.forEach((im, i) => {
      const thumb = document.createElement('button');
      thumb.className = 'lightbox__thumb' + (i === startIndex ? ' active' : '');
      thumb.setAttribute('aria-label', `Ver imagen ${i + 1}`);
      thumb.innerHTML = `<img src="${im.src}" alt="${im.alt}" loading="lazy" />`;
      thumb.addEventListener('click', () => goTo(i));
      thumbsWrap.appendChild(thumb);
    });

    // Show/hide nav arrows
    const showNav = images.length > 1;
    btnPrev.classList.toggle('hidden', !showNav);
    btnNext.classList.toggle('hidden', !showNav);

    current = startIndex;
    renderImage(current, false);

    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    btnClose.focus();
  }

  /* ── Render image ── */
  function renderImage(index, animate = true) {
    if (!images[index]) return;
    current = index;

    if (animate) {
      img.classList.add('loading');
    }

    const newImg = new Image();
    newImg.onload = () => {
      img.src     = newImg.src;
      img.alt     = images[index].alt;
      img.classList.remove('loading');
    };
    newImg.onerror = () => {
      img.src = images[index].src; // show broken img anyway
      img.classList.remove('loading');
    };
    newImg.src = images[index].src;

    // Update counter
    counter.textContent = `${index + 1} / ${images.length}`;

    // Update active thumb
    $$('.lightbox__thumb', thumbsWrap).forEach((t, i) => {
      t.classList.toggle('active', i === index);
    });
  }

  /* ── Navigate ── */
  function goTo(index) {
    const total = images.length;
    renderImage((index + total) % total);
  }

  function prev() { goTo(current - 1); }
  function next() { goTo(current + 1); }

  /* ── Close ── */
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    images  = [];
    current = 0;
  }

  /* ── Event: open on gallery button click ── */
  document.addEventListener('click', (e) => {
    const galleryBtn = e.target.closest('.product-card__gallery-btn');
    if (!galleryBtn) return;
    e.preventDefault();
    e.stopPropagation();
    const card = galleryBtn.closest('.product-card');
    if (card) openLightbox(card, 0);
  });

  /* ── Event: also open when clicking the image directly ── */
  document.addEventListener('click', (e) => {
    const imgEl = e.target.closest('.product-card__img-wrap img');
    if (!imgEl) return;
    // Only if not already caught by gallery btn
    const card = imgEl.closest('.product-card');
    if (card) openLightbox(card, 0);
  });

  /* ── Controls ── */
  btnClose.addEventListener('click', closeLightbox);
  backdrop.addEventListener('click', closeLightbox);
  btnPrev.addEventListener('click', prev);
  btnNext.addEventListener('click', next);

  /* ── Keyboard ── */
  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   prev();
    if (e.key === 'ArrowRight')  next();
  });

  /* ── Touch / swipe support ── */
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) {
      delta < 0 ? next() : prev();
    }
  }, { passive: true });
})();


/* ─────────────────────────────────────
   7. CONTACT FORM VALIDATION
───────────────────────────────────── */
(function initContactForm() {
  const form    = $('#contactForm');
  const success = $('#formSuccess');
  if (!form) return;

  const validateField = (field) => {
    const id      = field.id;
    const value   = field.value.trim();
    const errorEl = $(`#error-${id}`);
    let   message = '';

    switch (id) {
      case 'nombre':
        if (!value)                message = 'Por favor ingresá tu nombre.';
        else if (value.length < 2) message = 'El nombre debe tener al menos 2 caracteres.';
        break;
      case 'telefono':
        if (!value)                message = 'Por favor ingresá tu teléfono.';
        else if (!/^[\d\s\+\-\(\)]{7,20}$/.test(value)) message = 'Ingresá un número de teléfono válido.';
        break;
      case 'email':
        if (!value)                message = 'Por favor ingresá tu email.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Ingresá un email válido (ej: juan@mail.com).';
        break;
      case 'mensaje':
        if (!value)                message = 'Por favor escribí tu mensaje.';
        else if (value.length < 10) message = 'El mensaje debe tener al menos 10 caracteres.';
        break;
    }

    if (errorEl) errorEl.textContent = message;
    field.classList.toggle('error', !!message);
    return !message;
  };

  $$('input, textarea', form).forEach(field => {
    field.addEventListener('blur',  () => validateField(field));
    field.addEventListener('input', () => { if (field.classList.contains('error')) validateField(field); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields  = $$('input, textarea', form);
    let   isValid = true;
    fields.forEach(f => { if (!validateField(f)) isValid = false; });
    if (!isValid) return;

    const submitBtn = $('button[type="submit"]', form);
    submitBtn.textContent = 'Enviando…';
    submitBtn.disabled    = true;

    setTimeout(() => {
      form.reset();
      fields.forEach(f => f.classList.remove('error'));
      $$('[id^="error-"]', form).forEach(el => (el.textContent = ''));
      success.classList.add('show');
      submitBtn.textContent = 'Enviar mensaje';
      submitBtn.disabled    = false;
      setTimeout(() => success.classList.remove('show'), 6000);
    }, 1200);
  });
})();
