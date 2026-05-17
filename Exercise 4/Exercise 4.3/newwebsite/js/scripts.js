/* ═══════════════════════════════════════════════════════════
   PowerSmart AU — scripts.js
   Handles SPA-style page switching and UI feedback
   ═══════════════════════════════════════════════════════════ */

/**
 * Page configuration — maps page IDs to display labels
 * and the corresponding nav button data-page attribute.
 */
const PAGES = {
    home: { label: 'HOME', title: 'PowerSmart AU — Home' },
    televisions: { label: 'TELEVISIONS', title: 'PowerSmart AU — Televisions' },
    about: { label: 'ABOUT US', title: 'PowerSmart AU — About Us' },
};

/** Currently visible page ID */
let currentPage = 'home';

/**
 * showPage()
 * Switches the visible page section, updates the active nav button,
 * refreshes the page-indicator chip, and updates the document title.
 *
 * @param {string} pageId  — one of 'home' | 'televisions' | 'about'
 */
function showPage(pageId) {
    if (!PAGES[pageId]) {
        console.warn(`showPage: unknown page "${pageId}"`);
        return;
    }

    // ── 1. Hide all pages ──────────────────────────────────
    document.querySelectorAll('.page').forEach(el => {
        el.classList.remove('active');
    });

    // ── 2. Show target page ────────────────────────────────
    const target = document.getElementById('page-' + pageId);
    if (target) {
        target.classList.add('active');
        // Scroll to top of page on navigation
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── 3. Update nav button states ───────────────────────
    document.querySelectorAll('.nav-links li button').forEach(btn => {
        const isActive = btn.dataset.page === pageId;
        btn.classList.toggle('active', isActive);
        // Accessibility: aria-current for screen readers
        btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    // ── 4. Update page indicator chip ────────────────────
    const indicator = document.getElementById('page-indicator');
    if (indicator) {
        indicator.textContent = PAGES[pageId].label;
    }

    // ── 5. Update document title ─────────────────────────
    document.title = PAGES[pageId].title;

    currentPage = pageId;
}

/**
 * Set footer year dynamically so it never needs manual updates.
 */
function setFooterYear() {
    const el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
}

/**
 * addNavHoverFeedback()
 * Enhances nav buttons with a tooltip-style title so the browser
 * status bar (and screen readers) describe the destination.
 */
function addNavHoverFeedback() {
    const labels = {
        home: 'Go to Home page',
        televisions: 'View Television energy data',
        about: 'Learn about PowerSmart AU',
    };

    document.querySelectorAll('.nav-links li button').forEach(btn => {
        const page = btn.dataset.page;
        if (labels[page]) btn.title = labels[page];
    });
}



/* ── Initialise on DOM ready ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    setFooterYear();
    addNavHoverFeedback();

    // Ensure the default home page is correctly marked active on load
    showPage('home');
});