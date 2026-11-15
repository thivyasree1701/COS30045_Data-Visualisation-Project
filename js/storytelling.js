/* AI PROMPT SUMMARY (paraphrased from project development requests; not verbatim prompts)
Scope: records the AI-assisted requests relevant to this file, not a claim that every line was AI-generated.
Assistance: Codex implementation and refinement support during project development.
1. Add chart-specific storytelling captions grounded in the processed data and update them with supported filters.
2. Explain trends, category shares, changes and hospital burden; use restrained transitions rather than decorative animation.
These summaries document assistance; they do not establish data correctness, accessibility compliance or completion of testing. */

/* Derived insights use the same KNIME rows and filter values as the charts. */
(() => {
    // Number formatting and helper functions
    const fmt = new Intl.NumberFormat('en-AU');
    const n = v => fmt.format(Math.round(v));
    const pct = v => Math.abs(v).toFixed(1);
    const direction = v => v >= 0 ? 'increased' : 'decreased';

    const max = (rows, key) =>
        rows.reduce((a, b) => !a || key(b) > key(a) ? b : a, null);

    const change = (a, b) =>
        a
            ? `${direction(b - a)} by ${pct((b - a) / a * 100)}%`
            : 'has no comparable baseline';

    // Shared data and rendering state
    let records = [];
    let queued = false;

    const seen = new WeakSet();

    // Display an insight beneath its corresponding chart
    function put(id, text) {
        const host = document.getElementById(id);

        if (!host || !text) return;

        const card = host.closest('.chart-card');
        let caption = card.querySelector('.story-insight');

        if (!caption) {
            caption = document.createElement('p');
            caption.className = 'story-insight';

            card.querySelector('.card-header').after(caption);
        }

        if (caption.textContent !== text) {
            caption.textContent = text;
        }

        // Update the expanded chart insight when applicable
        const modal = document.querySelector(
            ".expanded-chart-dialog[open]"
        );

        if (
            modal?.querySelector("h2")?.textContent ===
            card.querySelector("h2")?.textContent
        ) {
            const expanded = modal.querySelector(".expanded-story");

            if (expanded && expanded.textContent !== text) {
                expanded.textContent = text;
            }
        }
    }

    // Generate insights using the current chart filters
    function render() {
        queued = false;

        if (!records.length) return;

        const year = +document.querySelector('#year').value;
        const road =
            document.querySelector('#road-user')?.value || 'all';

        // Filter records by data type and selected year
        const rows = type =>
            records.filter(r => r.Data_type === type);

        const at = type =>
            rows(type).filter(r => +r.Year === year);

        // National hospitalisation trend insight
        const trend = rows('national_trend')
            .sort((a, b) => a.Year - b.Year);

        const first = trend[0];
        const last = trend.at(-1);
        const peak = max(
            trend,
            r => +r.Hospitalisations
        );

        if (first && last) {
            put(
                'trend',
                `2011–2021: hospitalisations ${change(+first.Hospitalisations, +last.Hospitalisations)}. Peak: ${peak.Year} (${n(peak.Hospitalisations)}).`
            );
        }

        // Road-user share insight
        const shares = at('road_user_shares');

        const largest = max(
            shares,
            r => +r.Hospitalisations
        );

        const selected = shares.find(
            r => r.Road_user === road
        );

        const item = selected || largest;

        if (item) {
            put(
                'donut',
                `${year}: ${item.Road_user} ${selected ? 'accounts for' : 'has the largest share at'} ${(+item.Percentage).toFixed(1)}% (${n(item.Hospitalisations)} hospitalisations).`
            );
        }

        // Compare road-user shares against the 2011 baseline
        const baseline = rows('road_user_shares')
            .filter(r => +r.Year === 2011);

        const differences = shares
            .map(r => ({
                ...r,
                base: baseline.find(
                    b => b.Road_user === r.Road_user
                )
            }))
            .filter(r => r.base);

        const mover = selected
            ? differences.find(r => r.Road_user === road)
            : max(
                differences,
                r => Math.abs(+r.Percentage - r.base.Percentage)
            );

        if (mover) {
            put(
                'stack',
                year === 2011
                    ? '2011 is the baseline. Select a later year to compare road-user shares.'
                    : `${mover.Road_user}: ${(+mover.base.Percentage).toFixed(1)}% in 2011 → ${(+mover.Percentage).toFixed(1)}% in ${year} (${Math.abs(mover.Percentage - mover.base.Percentage).toFixed(1)} percentage points ${mover.Percentage >= mover.base.Percentage ? 'higher' : 'lower'}).`
            );
        }

        // Road-user hospitalisations and bed-day changes
        const up = max(
            differences,
            r => r.Hospitalisations - r.base.Hospitalisations
        );

        const down = max(
            differences,
            r => r.base.Hospitalisations - r.Hospitalisations
        );

        if (up) {
            put(
                'road-bed-chart',
                year === 2011
                    ? 'Both dots show the 2011 baseline. Select a later year to see changes.'
                    : `Since 2011: ${up.Road_user} ${change(+up.base.Hospitalisations, +up.Hospitalisations)}${down && down.Hospitalisations < down.base.Hospitalisations ? `; ${down.Road_user} ${change(+down.base.Hospitalisations, +down.Hospitalisations)}` : ''}.`
            );
        }

        // Age and sex insight
        const sex =
            document.querySelector('#sex [aria-pressed="true"]')
                ?.textContent.trim() || 'All';

        const ages = new Map();

        at('age_sex')
            .filter(r => sex === 'All' || r.Sex === sex)
            .forEach(r => {
                ages.set(
                    r['Age group'],
                    (ages.get(r['Age group']) || 0) +
                    +r.Hospitalisations
                );
            });

        const age = max(
            [...ages],
            r => r[1]
        );

        if (age) {
            put(
                'age-chart',
                `${year} · ${sex === 'All' ? 'both sexes' : sex}: age ${age[0]} has the largest count (${n(age[1])}). Age groups span different numbers of years.`
            );
        }

        // People heatmap insight
        const ageKeys = [
            '0-7',
            '8-16',
            '17-25',
            '26-39',
            '40-64',
            '65-74',
            '75++'
        ];

        const focus = [
            ...document.querySelectorAll(
                '#people-heatmap [aria-pressed="true"]'
            )
        ].map(el => el.getAttribute('aria-label'));

        const cells = at('road_user_age')
            .flatMap(r =>
                ageKeys
                    .filter(a =>
                        r[a] !== '' &&
                        (
                            !focus.some(
                                f => f.startsWith('Focus age ')
                            ) ||
                            focus.includes(
                                'Focus age ' + a.replace('++', '+')
                            )
                        ) &&
                        (
                            !focus.some(
                                f => !f.startsWith('Focus age ')
                            ) ||
                            focus.includes('Focus ' + r.Road_user)
                        )
                    )
                    .map(a => ({
                        road: r.Road_user,
                        age: a.replace('++', '+'),
                        value: +r[a]
                    }))
            );

        const cell = max(
            cells,
            r => r.value
        );

        if (cell) {
            put(
                'people-heatmap',
                `${year}: ${cell.road}, age ${cell.age}, has the highest count ${focus.length ? 'within the selection' : 'in this heatmap'} (${n(cell.value)}). Both sexes.`
            );
        }

        // State map insight
        const states = at('state_map');
        const state = document.querySelector('#state')?.value;

        const st = states.find(
            r => r.State === state
        ) || max(
            states,
            r => +r.Hospitalisations
        );

        if (st) {
            put(
                'state-map',
                `${year}: ${st.state_name || st.State} ${state && state !== 'all' ? 'recorded' : 'has the largest count at'} ${n(st.Hospitalisations)} hospitalisations. Counts do not measure individual risk.`
            );
        }

        // State bed-day insight
        const burden = max(
            at('state_bubble'),
            r => +r.Bed_days
        );

        if (burden) {
            put(
                'bubble',
                `${year}: ${burden.State} has the most bed days (${n(burden.Bed_days)}). Bubble area shows total bed days, not injury risk.`
            );
        }

        // Display the default First Nations remoteness comparison
        if (
            !document.querySelector('#remoteness-donut')
                ?.dataset.storyRange
        ) {
            remoteness(2011, 2021);
        }

        // Add reveal animation to chart SVG elements once
        document.querySelectorAll(
            'main .plot>svg,main .age-plot>svg,main .map-plot>svg'
        ).forEach(svg => {
            if (!seen.has(svg)) {
                seen.add(svg);
                svg.classList.add('story-reveal');
            }
        });
    }

    // Generate First Nations remoteness comparison insights
    function remoteness(start, end) {
        const rs = records.filter(
            r => r.Data_type === 'first_nations_trends'
        );

        const changes = [
            'Major Cities',
            'Regional',
            'Remote'
        ]
            .map(name => {
                const a = rs.find(
                    r => r.Remoteness === name && +r.Year === start
                );

                const b = rs.find(
                    r => r.Remoteness === name && +r.Year === end
                );

                return a && b
                    ? `${name}: ${n(a.Hospitalisations)} → ${n(b.Hospitalisations)}`
                    : null;
            })
            .filter(Boolean);

        put(
            'remoteness-donut',
            changes.length
                ? `${start}–${end} · ${changes.join('; ')}. National counts.`
                : 'Select a range containing at least one recorded year.'
        );
    }

    // Schedule insight rendering using requestAnimationFrame
    const schedule = () => {
        if (!queued) {
            queued = true;
            requestAnimationFrame(render);
        }
    };

    // Load dashboard data and render insights
    window.dashboardData
        .then(data => {
            records = data;
            schedule();
        })
        .catch(console.error);

    // Listen for filter and year changes
    document.addEventListener('change', schedule);
    document.addEventListener('input', schedule);
    document.addEventListener('national-year-change', schedule);

    // Listen for remoteness range changes
    document.addEventListener('remoteness-range', e => {
        const host = document.querySelector('#remoteness-donut');

        if (host) {
            host.dataset.storyRange = 'true';
        }

        remoteness(e.detail.start, e.detail.end);
    });

    // Observe main content changes and refresh insights when needed
    new MutationObserver(changes => {
        if (
            changes.some(
                c => !c.target.closest?.('.story-insight')
            )
        ) {
            schedule();
        }
    }).observe(
        document.querySelector('main'),
        {
            childList: true,
            subtree: true
        }
    );
})();
