/* AI PROMPT SUMMARY (paraphrased from project development requests; not verbatim prompts)
Scope: records the AI-assisted requests relevant to this file, not a claim that every line was AI-generated.
Assistance: Codex implementation and refinement support during project development.
1. Redesign View data dialogs with the table first, clear titles and scope, concise data explanations and source notes; do not add CSV download.
2. Keep chart previews separate from table presentation, format numeric columns and support a scrollable table region.
These summaries document assistance; they do not establish data correctness, accessibility compliance or completion of testing. */

/* Shared presentation for data tables; existing chart dialog renderers remain intact. */
(() => {
    const dialog = document.querySelector('#details');
    if (!dialog) return;

    const title = dialog.querySelector('#detail-title');
    const note = dialog.querySelector('#detail-text');

    // Configure dialog accessibility
    dialog.setAttribute('aria-labelledby', 'detail-title');

    // Create dialog header
    const header = document.createElement('header');
    header.className = 'data-dialog-header';

    header.append(
        dialog.querySelector('#close-dialog'),
        dialog.querySelector('.eyebrow'),
        title
    );

    dialog.prepend(header);

    // Create context and description elements
    const context = document.createElement('p');
    context.className = 'data-dialog-context';
    header.append(context);

    const description = document.createElement('p');
    description.className = 'data-dialog-description';
    description.hidden = true;
    header.append(description);

    // Create accessible table viewport
    const viewport = document.createElement('div');
    viewport.className = 'data-table-viewport';
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Data table');
    dialog.append(viewport);

    // Create dialog footer and source link
    const footer = document.createElement('div');
    footer.className = 'data-dialog-footer';

    const source = document.createElement('a');
    source.href = 'https://www.bitre.gov.au/resource/road-safety/hospitalised-injury';
    source.target = '_blank';
    source.rel = 'noopener';
    source.textContent = 'Source: BITRE / AIHW ↗';

    footer.append(note, source);
    dialog.append(footer);

    // Update dialog presentation
    function update() {
        if (!dialog.open) return;

        const table = dialog.querySelector('table.dialog-table');

        dialog.classList.toggle('data-table-dialog', !!table);

        if (!table) {
            context.hidden = true;
            description.hidden = true;
            viewport.hidden = true;
            source.hidden = true;
            return;
        }

        if (table.dataset.presented) return;

        table.dataset.presented = 'true';

        context.hidden = false;
        description.hidden = false;
        viewport.hidden = false;
        source.hidden = false;

        viewport.replaceChildren(table);

        // Configure table headings
        const headings = [...table.querySelectorAll('thead th')];
        headings.forEach(th => th.scope = 'col');

        // Organise table rows
        const rows = [...table.rows].filter(r => r.querySelector('td'));
        const body = table.tBodies[0] || table.createTBody();

        rows.forEach(row => body.append(row));

        // Identify available years
        const yearIndex = headings.findIndex(h =>
            /^year$/i.test(h.textContent.trim())
        );

        const years = yearIndex >= 0
            ? [...new Set(
                rows.map(r => r.cells[yearIndex]?.textContent.trim())
            )]
                .filter(v => /^20\d{2}$/.test(v))
                .sort()
            : [];

        const scope = years.length
            ? (
                years.length === 1
                    ? years[0]
                    : years[0] + '–' + years.at(-1)
            )
            : '';

        // Display table context
        context.textContent = [
            scope,
            rows.length + ' rows',
            'Values shown in this table'
        ].filter(Boolean).join(' · ');

        if (!title.textContent.endsWith(' — Data')) {
            title.textContent += ' — Data';
        }

        table.setAttribute('aria-labelledby', 'detail-title');

        // Set table description based on chart title
        const chartTitle = title.textContent.toLowerCase();

        description.textContent = /national.*(trend|injuries|time)/.test(chartTitle)
            ? 'Annual hospitalisations from road traffic crashes in Australia' +
              (scope ? ', ' + scope : '.')
            : /share/.test(chartTitle)
                ? 'Road-user shares show each category’s percentage of the annual hospitalisation total.'
                : /age.*sex|sex.*age/.test(chartTitle)
                    ? 'Hospitalisation counts by age group and sex for the selected year.'
                    : /remoteness|first nations/.test(chartTitle)
                        ? 'National First Nations hospitalisations grouped by remoteness of usual residence, not crash location.'
                        : /state|territor|burden/.test(chartTitle)
                            ? 'Hospitalisation data for Australian states and territories for the selected year.'
                            : /change since|dumbbell/.test(chartTitle)
                                ? 'Road-user hospitalisation counts comparing 2011 with the selected year.'
                                : /age/.test(chartTitle)
                                    ? 'Hospitalisation counts by road-user category and age group.'
                                    : 'Values underlying this chart, with the categories and measures listed below.';

        // Identify numeric columns
        headings.forEach((th, i) => {
            const label = th.textContent.trim();

            if (
                !/year/i.test(label) &&
                rows.length &&
                rows.every(r =>
                    /^[\d,.%−\-\s]+$/.test(r.cells[i]?.textContent.trim()) ||
                    /^(Unavailable|N\/A|)$/i.test(
                        r.cells[i]?.textContent.trim()
                    )
                )
            ) {
                th.classList.add('numeric');

                rows.forEach(r =>
                    r.cells[i]?.classList.add('numeric')
                );
            }
        });

        // Check for missing values
        const missing = rows.some(r =>
            [...r.cells].some(c =>
                /^(Unavailable|N\/A|)$/i.test(
                    c.textContent.trim()
                )
            )
        );

        // Display data notes
        note.textContent =
            'Counts describe hospitalisations, not population-adjusted risk.' +
            (
                headings.some(h => /average stay/i.test(h.textContent))
                    ? ' Average stay = bed days ÷ hospitalisations.'
                    : ''
            ) +
            (
                missing
                    ? ' Unavailable values are not zero.'
                    : ''
            );
    }

    // Observe dialog changes
    new MutationObserver(update).observe(dialog, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['open']
    });
})();

