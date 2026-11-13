
/* Shared detail-on-demand for the design preview; never invents real counts. */
(() => {

    // Page entrance animation
    let entryTimer;

    function playPageEntrance() {
        const main = document.querySelector('main');
        if (!main) return;

        main.classList.remove('page-entering');
        void main.offsetWidth;
        main.classList.add('page-entering');

        clearTimeout(entryTimer);

        entryTimer = setTimeout(
            () => main.classList.remove('page-entering'),
            1000
        );
    }

    window.addEventListener('pageshow', playPageEntrance);
    playPageEntrance();

    // Create shared chart tooltip
    const tip = document.createElement('div');
    tip.id = 'chart-tooltip';
    tip.className = 'chart-tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;

    document.body.append(tip);

    let active = null;
    let pinned = false;

    const groups = [
        'Car occupant',
        'Motorcyclist',
        'Pedal cyclist',
        'Pedestrian'
    ];

    // Hide the active tooltip
    function hide() {
        if (active) {
            active.classList.remove('detail-active');
        }

        active = null;
        pinned = false;
        tip.hidden = true;
    }

    // Display chart mark details
    function show(mark, event) {
        if (pinned && mark !== active) return;

        if (active) {
            active.classList.remove('detail-active');
        }

        active = mark;
        mark.classList.add('detail-active');

        tip.replaceChildren();

        const heading = document.createElement('strong');
        heading.textContent = mark.dataset.detail;

        const note = document.createElement('span');
        note.textContent =
            `Year: ${(mark.dataset.detail.match(/\b20\d{2}\b/)?.[0] || document.querySelector('#year').value)} · ${
                mark.closest('#state-map,#bubble,#remoteness-donut') &&
                document.querySelector('script[src="js/state-data.js"]') ||
                mark.closest('#trend,#donut,#stack,#age-chart,#people-heatmap') &&
                document.querySelector('script[src="js/national-data.js"]')
                    ? 'BITRE / AIHW · KNIME export.'
                    : 'Illustrative preview. Real counts are not connected.'
            }`;

        const help = document.createElement('small');
        help.textContent = 'Click or Enter to pin details · Escape to close';

        tip.append(heading, note, help);
        tip.hidden = false;

        // Position tooltip near the selected mark
        const rect = mark.getBoundingClientRect();

        const x = event?.clientX ?? rect.x + rect.width / 2;
        const y = event?.clientY ?? rect.y;

        tip.style.left =
            Math.max(8, Math.min(x + 14, innerWidth - tip.offsetWidth - 12)) +
            'px';

        tip.style.top =
            Math.max(8, Math.min(y + 14, innerHeight - tip.offsetHeight - 12)) +
            'px';
    }

    // Create expanded chart dialog
    const chartDialog = document.createElement('dialog');
    chartDialog.className = 'expanded-chart-dialog';

    document.body.append(chartDialog);

    // Prepare expanded chart dialog
    // Size chart dialogs independently of the compact dashboard cards.
    function prepareChartDialog(dialog) {
        dialog.classList.add('chart-view-dialog');

        dialog.addEventListener(
            'close',
            () => dialog.classList.remove('chart-view-dialog'),
            { once: true }
        );
    }

    // Resize expanded heatmap
    // Lay out the heatmap at the enlarged size, keeping text at readable pixel sizes.
    function fitExpandedHeatmap(canvas) {
        const svg = canvas.querySelector('svg');
        if (!svg) return;

        const original = svg.viewBox.baseVal;
        const width = original.width;
        const height = original.height;

        const shapes = [...svg.querySelectorAll('text,rect')].map(el => ({
            el,
            attrs: Object.fromEntries(
                ['x', 'y', 'width', 'height']
                    .filter(k => el.hasAttribute(k))
                    .map(k => [k, Number(el.getAttribute(k))])
            )
        }));

        const observer = new ResizeObserver(() => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;

            if (!w || !h) return;

            svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

            shapes.forEach(({ el, attrs }) => {
                for (const [key, value] of Object.entries(attrs)) {
                    el.setAttribute(
                        key,
                        value * (
                            key === 'x' || key === 'width'
                                ? w / width
                                : h / height
                        )
                    );
                }
            });

            svg.querySelectorAll('text').forEach(el => {
                el.style.setProperty('font-size', '13px', 'important');
            });
        });

        observer.observe(canvas);

        chartDialog.addEventListener(
            'close',
            () => observer.disconnect(),
            { once: true }
        );
    }

    // Add expanded chart details
    function addExpandedDetails(source, canvas, info) {
        const kind = source.id;

        if (!['state-map', 'road-bed-chart', 'remoteness-donut'].includes(kind)) {
            return;
        }

        const body = document.createElement('div');
        body.className = 'expanded-detail-layout';

        canvas.before(body);
        body.append(canvas);

        // Create side information panel
        const panel = document.createElement('aside');
        panel.className = 'expanded-side-panel';

        body.append(panel);

        const heading = document.createElement('h3');
        heading.textContent = 'How to read this chart';

        panel.append(heading);

        const guide = document.createElement('p');

        guide.textContent =
            kind === 'state-map'
                ? 'Darker blue means more hospitalisations. Select a state to inspect its count. Counts are not population-adjusted risk.'
                : kind === 'road-bed-chart'
                    ? 'Blue shows 2011; orange shows the selected year. The connecting line shows the size and direction of change. Select a pair of dots to read the exact values.'
                    : 'Compare Major Cities, Regional and Remote. Hover over the main chart for yearly counts. Drag across the lower chart to select a year range; the totals below update with your selection.';

        panel.append(guide);

        const label = document.createElement('h3');
        label.textContent = 'Data details';

        panel.append(label, info);

        // Remoteness donut chart details
        if (kind === 'remoteness-donut') {
            const summary = document.createElement('p');
            const legend = document.createElement('div');

            legend.className = 'expanded-remoteness-legend';

            panel.append(summary, legend);
            info.remove();

            const host = canvas.firstElementChild;

            const render = () => window.drawExpandedRemoteness?.({
                host,
                summary,
                legend
            });

            const observer = new ResizeObserver(render);

            observer.observe(canvas);
            render();

            chartDialog.addEventListener(
                'close',
                () => observer.disconnect(),
                { once: true }
            );

        // Road-user dumbbell chart details
        } else if (kind === 'road-bed-chart') {
            const host = canvas.firstElementChild;

            const render = async () => {
                await window.drawExpandedDumbbell?.(host);

                host.querySelectorAll('g[aria-label]').forEach(mark => {
                    const detail = mark.getAttribute('aria-label');

                    mark.querySelectorAll('title').forEach(t => t.remove());

                    mark.onpointerenter = mark.onfocus = () => {
                        info.textContent = detail;
                    };

                    mark.onclick = () => {
                        info.textContent = detail;
                    };
                });
            };

            const observer = new ResizeObserver(render);

            observer.observe(canvas);
            render();

            chartDialog.addEventListener(
                'close',
                () => observer.disconnect(),
                { once: true }
            );
        }
    }

    // Open expanded chart view
    function openChart(card) {
        const existing = card.querySelector(
            '.donut-detail-button,.fn-detail-button'
        );

        if (existing) {
            existing.click();

            const dialog = document.querySelector('dialog[open]');

            if (dialog) {
                prepareChartDialog(dialog);
            }

            return;
        }

        hide();
        chartDialog.replaceChildren();

        // Create close button
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'expanded-close';
        close.textContent = '×';
        close.setAttribute('aria-label', 'Close chart');
        close.onclick = () => chartDialog.close();

        // Create chart title and subtitle
        const title = document.createElement('h2');
        title.textContent = card.querySelector('h2')?.textContent || 'Chart';

        const subtitle = document.createElement('p');
        subtitle.textContent =
            card.querySelector('.card-header p')?.textContent || '';

        // Create expanded chart canvas
        const canvas = document.createElement('div');
        canvas.className = 'expanded-chart-canvas';

        const source = card.querySelector(
            '.plot,.mini-plot,.age-plot,.map-plot'
        );

        if (!source) return;

        // Clone original chart
        const clone = source.cloneNode(true);
        clone.removeAttribute('id');

        // Update cloned element IDs and references
        clone.querySelectorAll('[id]').forEach(e => {
            const old = e.id;
            e.id = 'expanded-' + old;

            clone.querySelectorAll('[fill],[clip-path]').forEach(item => {
                for (const attr of ['fill', 'clip-path']) {
                    if (item.getAttribute(attr) === `url(#${old})`) {
                        item.setAttribute(attr, `url(#expanded-${old})`);
                    }
                }
            });
        });

        clone.querySelectorAll('[aria-describedby]').forEach(e => {
            e.removeAttribute('aria-describedby');
        });

        canvas.append(clone);

        // Create chart information area
        const info = document.createElement('p');
        info.className = 'expanded-chart-info';
        info.textContent = 'Hover or click a chart mark to see its details.';

        // Add interactions to cloned chart marks
        clone.querySelectorAll('[data-detail],[aria-label]').forEach(mark => {
            if (mark.tagName.toLowerCase() === 'svg') return;

            const text = mark.dataset.detail || mark.getAttribute('aria-label');
            if (!text) return;

            mark.style.cursor = 'pointer';

            mark.onpointerenter = () => {
                info.textContent = text;
            };

            mark.onclick = () => {
                clone.querySelectorAll('.expanded-selected').forEach(e => {
                    e.classList.remove('expanded-selected');
                });

                mark.classList.add('expanded-selected');
                info.textContent = text;
            };

            mark.onfocus = () => {
                info.textContent = text;
            };

            mark.onkeydown = e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    mark.click();
                }
            };
        });

        // Add chart source information
        const note = document.createElement('p');
        note.className = 'expanded-source';

        note.textContent =
            card.querySelector('.card-footer span')?.textContent ||
            'BITRE / AIHW · real data';

        // Configure dialog accessibility
        title.id = 'expanded-chart-title';

        chartDialog.setAttribute('aria-labelledby', title.id);
        info.setAttribute('aria-live', 'polite');

        chartDialog.append(
            close,
            title,
            subtitle,
            canvas,
            info,
            note
        );

        // Include chart insight when available
        const insight = card.querySelector('.story-insight');

        if (insight) {
            const story = insight.cloneNode(true);
            story.classList.add('expanded-story');

            subtitle.after(story);
        }

        // Display expanded chart dialog
        prepareChartDialog(chartDialog);
        chartDialog.showModal();

        addExpandedDetails(source, canvas, info);

        if (source.id === 'people-heatmap') {
            fitExpandedHeatmap(canvas);
        }
    }

    // Add view-chart buttons to chart cards
    function addChartViews() {
        document.querySelectorAll('main .chart-card').forEach(card => {
            if (card.querySelector('.view-chart-button')) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'view-chart-button';
            button.textContent = 'View chart ↗';
            button.onclick = () => openChart(card);

            const footer = card.querySelector('.card-footer');

            if (footer) {
                footer.append(button);
            } else {
                card.append(button);
            }
        });
    }

    // Decorate chart marks with interactive details
    function decorate() {
        addChartViews();

        // Transfer SVG title text into accessible detail attributes
        document.querySelectorAll('main svg title').forEach(title => {
            const mark = title.parentElement;

            if (mark.tagName.toLowerCase() === 'svg') {
                if (!mark.hasAttribute('aria-label')) {
                    mark.setAttribute('aria-label', title.textContent);
                }
            } else {
                mark.dataset.detail = title.textContent;
            }

            title.remove();
        });

        // Add national trend chart details
        document.querySelectorAll('#trend .point').forEach(mark => {
            mark.dataset.detail =
                mark.getAttribute('aria-label') +
                ' · Select this year to update comparison labels';
        });

        // Add road-user bubble chart details
        document.querySelectorAll(
            document.querySelector('script[src="js/state-data.js"]')
                ? '#unused-preview-bubble'
                : '#bubble circle'
        ).forEach((mark, i) => {
            mark.dataset.detail =
                groups[i] +
                ' · Hospitalisations and bed days pending; bubble size undecided';
        });

        // Add remoteness chart details
        document.querySelectorAll(
            document.querySelector('script[src="js/state-data.js"]')
                ? '#unused-preview-remoteness'
                : '#remoteness-donut path'
        ).forEach((mark, i) => {
            mark.dataset.detail =
                [
                    'Major cities',
                    'Inner regional',
                    'Outer regional',
                    'Remote',
                    'Very remote'
                ][i] +
                ' · Proposed category; share unverified';
        });

        // Attach tooltip and keyboard interactions
        document.querySelectorAll('main [data-detail]').forEach(mark => {
            if (mark.dataset.interactive) return;

            mark.dataset.interactive = 'true';
            mark.setAttribute('tabindex', '0');
            mark.setAttribute('aria-describedby', 'chart-tooltip');

            if (!mark.hasAttribute('aria-label')) {
                mark.setAttribute('aria-label', mark.dataset.detail);
            }

            mark.addEventListener('pointerenter', e => show(mark, e));

            mark.addEventListener('pointermove', e => {
                if (!pinned) show(mark, e);
            });

            mark.addEventListener('pointerleave', () => {
                if (!pinned) hide();
            });

            mark.addEventListener('focus', () => show(mark));

            mark.addEventListener('blur', () => {
                if (!pinned) hide();
            });

            // Pin selected chart details
            const pin = e => {
                if (!mark.isConnected) return;

                hide();
                show(mark, e);
                pinned = true;
            };

            mark.addEventListener('click', pin);

            mark.addEventListener('keydown', e => {
                if (
                    (e.key === 'Enter' || e.key === ' ') &&
                    !mark.matches('.point,.state-region')
                ) {
                    e.preventDefault();
                    pin();
                }
            });
        });

        // Expose focusable children to assistive technology rather than flattening the SVG.
        document.querySelectorAll('main svg').forEach(svg => {
            if (svg.querySelector('[data-detail]')) {
                svg.setAttribute('role', 'group');
            }
        });

        // Hide tooltip if the active mark is removed
        if (active && !active.isConnected) {
            hide();
        }
    }

    // Global keyboard and click interactions
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            hide();
        }
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('[data-detail],#chart-tooltip')) {
            hide();
        }
    });

    // Reset button interaction
    document.querySelector('#reset')?.addEventListener('click', hide);

    // Observe chart updates and initialise interactions
    new MutationObserver(decorate).observe(
        document.querySelector('main'),
        {
            childList: true,
            subtree: true
        }
    );

    decorate();
})();
