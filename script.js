/**
 * ══════════════════════════════════════════════════════════
 *  MÁRMOLES OESTE — script.js
 *  - Tab navigation (replaces scroll navigation)
 *  - Navbar sticky + scroll state
 *  - Hamburger menu toggle
 *  - Tab-aware animations (anim-in)
 *  - Product filter tabs
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
   Core system: shows/hides .tab-page
   divs based on data-tab attribute
───────────────────────────────────── */
(function initTabs() {
  const pages   = $$('.tab-page');
  const navBtns = $$('[data-tab]');
  if (!pages.length) return;

  /**
   * Switch to a given tab by ID
   * @param {string} tabId - e.g. 'inicio', 'productos'
   * @param {boolean} [skipScroll=false]
   */
  const switchTab = (tabId, skipScroll = false) => {
    // Deactivate all pages
    pages.forEach(p => {
      p.classList.remove('active', 'page-enter');
    });

    // Activate target page
    const target = $(`#tab-${tabId}`);
    if (!target) return;

    target.classList.add('active');

    // Trigger entrance animation on next frame
    requestAnimationFrame(() => {
      target.classList.add('page-enter');
      // Trigger anim-in elements with staggered delays
      $$('.anim-in', target).forEach(el => {
        el.classList.remove('visible');
      });
      // Small timeout to allow CSS transition to register
      setTimeout(() => {
        $$('.anim-in', target).forEach(el => {
          el.classList.add('visible');
        });
      }, 30);
    });

    // Update nav button states
    $$('.nav-link').forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active-link', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    // Scroll page to top (unless suppressed)
    if (!skipScroll) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Update URL hash for bookmarkability (no page reload)
    history.replaceState(null, '', `#${tabId}`);

    // Handle navbar transparency: only hero (inicio) gets transparent navbar
    const navbar = $('#navbar');
    if (navbar) {
      navbar.classList.toggle('on-hero', tabId === 'inicio');
    }
  };

  // Attach click listeners to ALL elements with data-tab
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    e.preventDefault();
    const tabId = btn.dataset.tab;
    if (tabId) {
      switchTab(tabId);
      // Close mobile menu if open
      const hamburger = $('#hamburger');
      const navLinks  = $('#navLinks');
      if (hamburger && hamburger.classList.contains('open')) {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }
  });

  // On page load: check URL hash for deep linking
  const initialTab = (location.hash.replace('#', '') || 'inicio');
  switchTab(initialTab, true);

  // Re-trigger animations on initial load
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
   4. PRODUCT FILTER TABS
───────────────────────────────────── */
(function initProductFilter() {
  const tabs  = $$('.filter-tab');
  const cards = $$('.product-card');
  if (!tabs.length || !cards.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      cards.forEach(card => {
        const category  = card.dataset.category;
        const shouldShow = filter === 'all' || category === filter;

        if (shouldShow) {
          card.classList.remove('product-card--hidden');
          card.classList.remove('visible');
          requestAnimationFrame(() => card.classList.add('visible'));
        } else {
          card.classList.add('product-card--hidden');
        }
      });
    });
  });
})();


/* ─────────────────────────────────────
   5. CONTACT FORM VALIDATION
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
        if (!value)           message = 'Por favor ingresá tu nombre.';
        else if (value.length < 2) message = 'El nombre debe tener al menos 2 caracteres.';
        break;
      case 'telefono':
        if (!value)           message = 'Por favor ingresá tu teléfono.';
        else if (!/^[\d\s\+\-\(\)]{7,20}$/.test(value)) message = 'Ingresá un número de teléfono válido.';
        break;
      case 'email':
        if (!value)           message = 'Por favor ingresá tu email.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Ingresá un email válido (ej: juan@mail.com).';
        break;
      case 'mensaje':
        if (!value)           message = 'Por favor escribí tu mensaje.';
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
