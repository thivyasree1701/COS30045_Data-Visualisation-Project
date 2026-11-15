/* AI PROMPT SUMMARY (paraphrased from project development requests; not verbatim prompts)
Scope: records the AI-assisted requests relevant to this file, not a claim that every line was AI-generated.
Assistance: supplied Claude-assisted About reference; Codex integration and subsequent layout/interaction refinements.
1. Preserve the supplied About section tabs and searchable glossary with four topic controls; keep content accessible without overlaps.
2. Reuse the mobile drawer for About sections, use suitable labels and close it after selecting a section.
These summaries document assistance; they do not establish data correctness, accessibility compliance or completion of testing. */

// GenAI acknowledgement: Codex assisted with parts of this page code; Claude provided website ideas.
// Prompt summary: Integrate the supplied About page without adding content;
// retain its section tabs and prevent text overlap.

/*
 * about.js — section tabs and glossary search/filter for about.html.
 * Plain JavaScript (this page has no charts, so no D3 is needed).
 * The team reviewed, edited and verified the AI-assisted work.
 * Prompt summary: "Make the About page fit the
 * window with no scrolling; use tabs and a compact glossary".

 */

(function () {
    'use strict';

    /* ---------- Section tabs ---------- */

    const tabs = Array.from(
        document.querySelectorAll('.about-tabs [role="tab"]')
    );

    const panels = Array.from(
        document.querySelectorAll('.about-panel')
    );

    function showTab(tab, moveFocus) {
        tabs.forEach(function (t) {
            const active = t === tab;

            t.setAttribute('aria-selected', String(active));
            t.tabIndex = active ? 0 : -1;
        });

        panels.forEach(function (p) {
            p.hidden = p.id !== tab.getAttribute('aria-controls');
        });

        if (moveFocus) tab.focus();

        // Plain #name hash so a section can be linked, e.g. about.html#glossary
        try {
            history.replaceState(
                null,
                '',
                '#' + tab.id.replace('tab-', '')
            );
        } catch (e) {
            /* ignore */
        }
    }

    tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () {
            showTab(tab, false);
        });

        // Up/Down/Home/End move between tabs for keyboard users
        tab.addEventListener('keydown', function (e) {
            let next = null;

            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                next = tabs[(i + 1) % tabs.length];
            }

            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                next = tabs[(i - 1 + tabs.length) % tabs.length];
            }

            if (e.key === 'Home') {
                next = tabs[0];
            }

            if (e.key === 'End') {
                next = tabs[tabs.length - 1];
            }

            if (next) {
                e.preventDefault();
                showTab(next, true);
            }
        });
    });

    const hashName = location.hash.replace('#', '');
    const fromHash = document.getElementById('tab-' + hashName);
    const initialTab = fromHash || (
        hashName === 'glossary'
            ? document.getElementById('tab-project')
            : null
    );

    if (initialTab) {
        showTab(initialTab, false);
    }

    /* ---------- Glossary ---------- */

    const searchBox = document.getElementById('glossary-search');
    const list = document.getElementById('glossary-list');
    const status = document.getElementById('glossary-status');
    const emptyMsg = document.getElementById('glossary-empty');
    const chips = document.querySelectorAll('.glossary-chip');

    if (!searchBox || !list) return; // glossary markup missing: stop quietly

    const items = Array.from(
        list.querySelectorAll('.glossary-item')
    );

    const MAX_SEARCH_RESULTS = Infinity; // all matches remain reachable in the glossary panel
    let activeFilter = 'measures';

    // A topic chip shows one group; typing searches every topic
    function applyFilters() {
        const query = searchBox.value.trim().toLowerCase();
        let shown = 0,
            matches = 0;

        items.forEach(function (item) {
            let show;

            if (query) {
                show = item.textContent.toLowerCase().includes(query);

                if (show) {
                    matches += 1;
                    show = matches <= MAX_SEARCH_RESULTS;
                }
            } else {
                show = item.dataset.category === activeFilter;
            }

            item.hidden = !show;

            if (show) {
                shown += 1;
            }
        });

        chips.forEach(function (c) {
            c.setAttribute(
                'aria-pressed',
                String(!query && c.dataset.filter === activeFilter)
            );
        });

        emptyMsg.hidden = shown !== 0;

        status.textContent = query
            ? (
                matches > shown
                    ? 'First ' + shown + ' of ' + matches + ' matches'
                    : matches + ' match' + (matches === 1 ? '' : 'es')
            )
            : shown + ' terms';
    }

    searchBox.addEventListener('input', applyFilters);

    searchBox.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            searchBox.value = '';
            applyFilters();
        }
    });

    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            activeFilter = chip.dataset.filter;
            searchBox.value = '';
            applyFilters();
        });
    });

    applyFilters();
})();


/* ---------- Mobile navigation drawer ---------- */

/*
 * Reuse the dashboard hamburger drawer, with labels appropriate to About navigation.
 * GenAI prompt summary: Put the four About section tabs in the existing mobile drawer.
 */

(() => {
    const drawer = document.getElementById('mobile-filters');
    const toggle = document.querySelector('.mobile-filter-toggle');

    if (!drawer || !toggle) return;

    drawer.setAttribute('aria-label', 'About page sections');
    toggle.textContent = '☰ Sections';

    drawer.querySelector('.mobile-filter-close').setAttribute(
        'aria-label',
        'Close sections'
    );

    // The section's original click handler selects the panel before this handler closes the drawer.
    document.querySelectorAll('.about-tabs [role="tab"]').forEach(tab => {
        tab.addEventListener('click', () => {
            if (drawer.open) {
                drawer.close();

                document.getElementById('main').scrollIntoView({
                    block: 'start',
                    behavior: 'instant'
                });
            }
        });
    });
})();


