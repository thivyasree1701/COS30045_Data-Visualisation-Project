/* AI PROMPT SUMMARY (paraphrased from project development requests; not verbatim prompts)
Scope: records the AI-assisted requests relevant to this file, not a claim that every line was AI-generated.
Assistance: Codex implementation and refinement support during project development.
1. Join geographic boundaries with annual state counts and render the map, state ranking and hospital-burden bubble chart.
2. Support year and state selection with details, keeping national First Nations trends independent of state selection.
These summaries document assistance; they do not establish data correctness, accessibility compliance or completion of testing. */

/* Loads and validates state and First Nations rows, joining map labels to state-year counts.
 * Rendering filters by year, then updates the map or bubbles, scales, axes and selection details.
 * GenAI acknowledgement: Codex assisted with parts of D3 chart code and CSV integration. The team reviewed, edited and verified the code. */
(async () => {
    const d3 = window.d3;
    const $ = s => document.querySelector(s);
    const mapPage = document.body.dataset.page === 'states';

    const year = $('#year');
    const state = $('#state');

    let data, geo, firstNations;
    let selectedBubble = null;

    const fmt = d3?.format(',');
    const decimal = d3?.format('.2f');

    // State colours
    const colours = d3?.scaleOrdinal(
        ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'],
        [
            '#aab2bf',
            '#ec8f66',
            '#8ccbed',
            '#dc9cc3',
            '#6cc5a4',
            '#9f8fd0',
            '#5b9bd5',
            '#f4b860'
        ]
    );

    try {
        // Validate D3 and load the exported dashboard data
        if (!d3) throw Error('D3 did not load.');

        const exported = (await window.dashboardData)
            .filter(r => ['state_map', 'state_bubble'].includes(r.Data_type));

        if (exported.length !== 176) {
            throw Error('Expected 176 state rows.');
        }

        // Separate map and bubble chart records
        const mapRows = exported.filter(r => r.Data_type === 'state_map');
        const bubbleRows = exported.filter(r => r.Data_type === 'state_bubble');

        if (mapRows.length !== 88 || bubbleRows.length !== 88) {
            throw Error('Expected 88 rows for each state chart.');
        }

        // Match map and bubble records by year and state
        const byKey = new Map(
            mapRows.map(r => [r.Year + ':' + r.State, r])
        );

        data = bubbleRows.map(r => {
            const m = byKey.get(r.Year + ':' + r.State);

            if (!m || +m.Hospitalisations !== +r.Hospitalisations) {
                throw Error('Map and bubble counts disagree.');
            }

            return {
                ...r,
                State_name: m.state_name,
                Year: +r.Year,
                Hospitalisations: +r.Hospitalisations,
                Bed_days: +r.Bed_days,
                Average_stay_days:
                    r.Average_stay_days.trim() === ''
                        ? null
                        : +r.Average_stay_days
            };
        });

        // Validate state records and average-stay calculations
        if (
            new Set(data.map(r => r.Year + ':' + r.State)).size !== 88 ||
            data.some(
                r =>
                    r.Hospitalisations <= 0 ||
                    r.Average_stay_days === null ||
                    Math.abs(
                        r.Bed_days / r.Hospitalisations -
                        r.Average_stay_days
                    ) > .00051
            )
        ) {
            throw Error('State data validation failed.');
        }

        // Load First Nations trend data for the map page
        if (mapPage) {
            firstNations = (await window.dashboardData)
                .filter(r => r.Data_type === 'first_nations_trends')
                .map(r => ({
                    ...r,
                    Year: +r.Year,
                    Hospitalisations: +r.Hospitalisations
                }));

            if (firstNations.length !== 33) {
                throw Error('Expected 33 First Nations records.');
            }
        }

        // Initialise map page controls and event listeners
        if (mapPage) {
            geo = await d3.json('assets/australia-states.geojson');

            for (let y = 2011; y <= 2021; y++) {
                year.add(new Option(y, y, false, y === 2021));
            }

            year.onchange = render;

            $('#year-range').oninput = () => {
                year.value = $('#year-range').value;
                render();
            };

            state.onchange = render;

            $('#reset').onclick = () => {
                year.value = '2021';
                state.value = 'all';
                render();
            };

            $('#close-dialog').onclick = () => $('#details').close();

            document.querySelector('[data-info="map"]').onclick = () => {
                show(
                    'Map notes',
                    'Colour shows recorded hospitalisation counts, not population-adjusted risk. Click a state to highlight it. Boundaries: simplified ABS 2021 / GDA2020. Counts: BITRE / AIHW state workbook, 2011–2021.'
                );
            };
        }

        // Display information in the details dialog
        function show(title, text) {
            const dialog = $('#details');

            dialog.querySelectorAll('.dialog-table')
                .forEach(e => e.remove());

            $('#detail-title').textContent = title;
            $('#detail-text').textContent = text;

            dialog.showModal();
        }

        // Create and display the state data table
        function table(host, rows) {
            let b = host.parentElement.querySelector('.state-data-button');

            if (!b) {
                b = document.createElement('button');
                b.type = 'button';
                b.className = 'real-table-button state-data-button';
                b.textContent = 'View state data';

                host.after(b);
            }

            b.onclick = () => {
                show(
                    'State hospital burden, ' + year.value,
                    'Counts are hospitalisations, not risk. Average stay = bed days ÷ hospitalisations.'
                );

                const t = document.createElement('table');
                t.className = 'dialog-table';

                // Add table headers
                const header = t.createTHead().insertRow();

                [
                    'State',
                    'Hospitalisations',
                    'Bed days',
                    'Average stay (days)'
                ].forEach(v => {
                    const th = document.createElement('th');
                    th.textContent = v;
                    header.append(th);
                });

                // Add state records
                const body = t.createTBody();

                rows.forEach(r => {
                    const tr = body.insertRow();

                    [
                        r.State_name,
                        fmt(r.Hospitalisations),
                        fmt(r.Bed_days),
                        decimal(r.Average_stay_days)
                    ].forEach(v => {
                        tr.insertCell().textContent = v;
                    });
                });

                $('#details').append(t);
            };
        }

        // Render First Nations trends
        function renderFirstNations(yr) {
            window.drawRemoteness(firstNations, yr);
        }

        // Main rendering function
        function render() {
            const yr = +year.value || 2021;
            const rows = data.filter(r => r.Year === yr);

            // State map page
            if (mapPage) {
                $('#year-range').value = yr;

                document.querySelectorAll('[data-year]')
                    .forEach(e => e.textContent = yr);

                $('#status').textContent =
                    `BITRE / AIHW · ${yr} · ${state.value === 'all' ? 'all jurisdictions' : state.value} · counts, not population-adjusted risk. First Nations trends: national, known remoteness only.`;

                // Set up the map container
                const host = $('#state-map');
                const w = Math.max(300, host.clientWidth);
                const h = Math.max(160, host.clientHeight);

                host.replaceChildren();

                const svg = d3.select(host)
                    .append('svg')
                    .attr('viewBox', `0 0 ${w} ${h}`)
                    .attr('role', 'group')
                    .attr('aria-label', 'Hospitalisations by state, ' + yr);

                // Configure map projection and colour scale
                const projection = d3.geoMercator()
                    .fitExtent([[20, 15], [w - 55, h - 20]], geo);

                const path = d3.geoPath(projection);

                const color = d3.scaleSequential(
                    d3.interpolateRgb('#eef4fc', '#78a5d6')
                ).domain([
                    0,
                    d3.max(rows, r => r.Hospitalisations)
                ]);

                // Draw Australian state boundaries
                svg.selectAll('path')
                    .data(geo.features)
                    .join('path')
                    .attr('d', path)
                    .attr(
                        'fill',
                        f => color(
                            rows.find(r => r.State === f.properties.code)
                                ?.Hospitalisations || 0
                        )
                    )
                    .attr(
                        'stroke',
                        f => state.value === f.properties.code
                            ? '#BA611B'
                            : '#637B8D'
                    )
                    .attr(
                        'stroke-width',
                        f => state.value === f.properties.code ? 3 : 1
                    )
                    .attr('tabindex', 0)
                    .attr('role', 'button')
                    .attr('aria-label', f => {
                        const r = rows.find(
                            r => r.State === f.properties.code
                        );

                        return `${r.State_name}: ${fmt(r.Hospitalisations)} hospitalisations`;
                    })
                    .on('click', (e, f) => {
                        state.value = f.properties.code;
                        render();
                    })
                    .on('keydown', (e, f) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            state.value = f.properties.code;
                            render();
                        }
                    })
                    .append('title')
                    .text(f => {
                        const r = rows.find(
                            r => r.State === f.properties.code
                        );

                        return `${yr}, ${r.State_name}: ${fmt(r.Hospitalisations)} hospitalisations`;
                    });

                // Add state labels and ACT pointer
                const centres = {
                    WA: [122, -25],
                    NT: [133, -20],
                    SA: [135, -30],
                    QLD: [145, -23],
                    NSW: [147, -32],
                    VIC: [144, -37],
                    TAS: [147, -42],
                    ACT: [149.13, -35.3]
                };

                Object.entries(centres).forEach(([code, coords]) => {
                    const [x, y] = projection(coords);

                    svg.append('text')
                        .attr('x', x + (code === 'ACT' ? 30 : 0))
                        .attr('y', y + 4)
                        .attr(
                            'text-anchor',
                            code === 'ACT' ? 'start' : 'middle'
                        )
                        .attr('paint-order', 'stroke')
                        .attr('stroke', 'white')
                        .attr('stroke-width', 3)
                        .style('font-size', '13px')
                        .style('font-weight', '700')
                        .style('fill', '#203B50')
                        .text(code);

                    if (code === 'ACT') {
                        svg.append('line')
                            .attr('x1', x)
                            .attr('y1', y)
                            .attr('x2', x + 27)
                            .attr('y2', y)
                            .attr('stroke', '#203B50');
                    }
                });

                // Add the state data table
                table(host, rows);

                // Display selected state summary
                const ranking = $('#state-ranking');

                let summary = ranking.parentElement
                    .querySelector('.ranking-summary');

                if (!summary) {
                    summary = document.createElement('p');
                    summary.className = 'ranking-summary';
                    summary.setAttribute('aria-live', 'polite');

                    ranking.before(summary);
                }

                summary.replaceChildren();

                const chosen = rows.find(r => r.State === state.value);

                if (chosen) {
                    const code = document.createElement('strong');
                    code.textContent = chosen.State;

                    const total = d3.sum(
                        rows,
                        r => r.Hospitalisations
                    );

                    summary.append(
                        code,
                        document.createTextNode(
                            ` · ${fmt(chosen.Hospitalisations)} hospitalisations · ${d3.format('.1f')(chosen.Hospitalisations / total * 100)}% of states total · avg stay ${d3.format('.1f')(chosen.Average_stay_days)} days · ${fmt(chosen.Bed_days)} bed days`
                        )
                    );
                } else {
                    summary.textContent =
                        'Click a state ranking row or the map to view its details.';
                }

                // Build the state ranking list
                ranking.replaceChildren();

                const largest = d3.max(
                    rows,
                    r => r.Hospitalisations
                );

                [...rows]
                    .sort((a, b) => b.Hospitalisations - a.Hospitalisations)
                    .forEach((r, i) => {
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'rank-row';

                        button.setAttribute(
                            'aria-pressed',
                            String(state.value === r.State)
                        );

                        button.setAttribute(
                            'aria-label',
                            `${i + 1}. ${r.State_name}: ${fmt(r.Hospitalisations)} hospitalisations, average stay ${decimal(r.Average_stay_days)} days`
                        );

                        const code = document.createElement('strong');
                        code.textContent = r.State;

                        const track = document.createElement('span');
                        track.className = 'rank-track';

                        const bar = document.createElement('i');
                        bar.style.width =
                            (r.Hospitalisations / largest * 100) + '%';

                        bar.style.background = colours(r.State);
                        bar.style.opacity =
                            state.value === 'all' || state.value === r.State
                                ? '1'
                                : '.45';

                        track.append(bar);

                        const value = document.createElement('span');
                        value.textContent =
                            `${fmt(r.Hospitalisations)} · ${decimal(r.Average_stay_days)}d`;

                        button.append(code, track, value);

                        button.onclick = () => {
                            state.value = state.value === r.State
                                ? 'all'
                                : r.State;

                            render();
                        };

                        ranking.append(button);
                    });

                // Render First Nations trends for the selected year
                renderFirstNations(yr);

                // Build map colour legend
                const lo = 0;
                const hi = d3.max(rows, r => r.Hospitalisations);
                const key = $('.map-key');

                key.replaceChildren();

                const fewer = document.createElement('span');
                fewer.textContent = 'Fewer';

                const ramp = document.createElement('span');
                ramp.className = 'map-colour-ramp';
                ramp.setAttribute('role', 'img');
                ramp.setAttribute(
                    'aria-label',
                    `Hospitalisation colour scale: ${fmt(lo)} to ${fmt(hi)}`
                );
                ramp.title = `${fmt(lo)} to ${fmt(hi)} hospitalisations`;

                const more = document.createElement('span');
                more.textContent = 'More';

                key.append(fewer, ramp, more);

            // State bubble chart page
            } else {
                const host = $('#bubble');
                const card = host.closest('section');

                const w = Math.max(320, host.clientWidth);

                const h = Math.max(
                    150,
                    card.clientHeight -
                    card.querySelector('.card-header').offsetHeight -
                    (card.querySelector('.card-footer')?.offsetHeight || 0) -
                    50
                );

                // Set up the bubble chart
                host.replaceChildren();

                const svg = d3.select(host)
                    .append('svg')
                    .attr('viewBox', `0 0 ${w} ${h}`)
                    .style('position', 'absolute')
                    .style('inset', '0')
                    .attr('role', 'group')
                    .attr('aria-label', 'State hospital burden, ' + yr);

                // Configure bubble chart scales
                const x = d3.scaleLinear()
                    .domain([
                        0,
                        d3.max(rows, r => r.Hospitalisations) * 1.15
                    ])
                    .nice()
                    .range([55, w - 30]);

                const y = d3.scaleLinear()
                    .domain([
                        0,
                        d3.max(rows, r => r.Average_stay_days) * 1.2
                    ])
                    .nice()
                    .range([h - 42, 20]);

                const radius = d3.scaleSqrt()
                    .domain([0, d3.max(data, r => r.Bed_days)])
                    .range([0, Math.min(34, h * .18)]);

                // Add horizontal axis
                svg.append('g')
                    .attr('class', 'burden-x')
                    .attr('transform', `translate(0,${h - 42})`)
                    .call(
                        d3.axisBottom(x)
                            .ticks(5)
                            .tickSize(0)
                            .tickPadding(10)
                            .tickFormat(d3.format('~s'))
                    )
                    .call(g => g.select('.domain').remove());

                // Add vertical axis and gridlines
                svg.append('g')
                    .attr('class', 'burden-grid')
                    .attr('transform', 'translate(55,0)')
                    .call(
                        d3.axisLeft(y)
                            .ticks(4)
                            .tickSize(-(w - 85))
                            .tickPadding(9)
                    )
                    .call(g => g.select('.domain').remove())
                    .call(
                        g => g.selectAll('line').attr('stroke', '#e6ecf5')
                    );

                // Add axis labels
                svg.append('text')
                    .attr('x', w / 2)
                    .attr('y', h - 5)
                    .attr('text-anchor', 'middle')
                    .text('Hospitalisations');

                svg.append('text')
                    .attr('x', 58)
                    .attr('y', 12)
                    .text('Average stay (days)');

                // Draw state bubbles and labels
                [...rows]
                    .sort((a, b) => b.Bed_days - a.Bed_days)
                    .forEach(r => {
                        svg.append('circle')
                            .attr('data-state', r.State)
                            .style('cursor', 'pointer')

                            // Handle bubble selection
                            .on('click', () => {
                                selectedBubble =
                                    selectedBubble === r.State
                                        ? null
                                        : r.State;

                                const circles =
                                    svg.selectAll('circle[data-state]');

                                circles
                                    .attr('fill-opacity', function () {
                                        return !selectedBubble ||
                                            this.dataset.state === selectedBubble
                                            ? .95
                                            : .12;
                                    })
                                    .attr('stroke', function () {
                                        return this.dataset.state === selectedBubble
                                            ? '#33415c'
                                            : 'white';
                                    })
                                    .attr('stroke-width', function () {
                                        return this.dataset.state === selectedBubble
                                            ? 3
                                            : 1.5;
                                    });

                                svg.selectAll('text[data-state]')
                                    .attr('opacity', function () {
                                        return !selectedBubble ||
                                            this.dataset.state === selectedBubble
                                            ? 1
                                            : .3;
                                    });
                            })

                            // Support keyboard selection
                            .on('keydown', (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();

                                    e.currentTarget.dispatchEvent(
                                        new MouseEvent('click', {
                                            bubbles: true
                                        })
                                    );
                                }
                            })

                            // Set bubble position and appearance
                            .attr('cx', x(r.Hospitalisations))
                            .attr('cy', y(r.Average_stay_days))
                            .attr('r', radius(r.Bed_days))
                            .attr('fill', colours(r.State))
                            .attr(
                                'fill-opacity',
                                !selectedBubble
                                    ? .9
                                    : selectedBubble === r.State
                                        ? .95
                                        : .12
                            )
                            .attr(
                                'stroke',
                                selectedBubble === r.State
                                    ? '#33415c'
                                    : 'white'
                            )
                            .attr(
                                'stroke-width',
                                selectedBubble === r.State ? 3 : 1.5
                            )
                            .attr('tabindex', 0)
                            .attr(
                                'aria-label',
                                `${r.State_name}: ${fmt(r.Hospitalisations)} hospitalisations, average ${decimal(r.Average_stay_days)} days, ${fmt(r.Bed_days)} bed days`
                            )
                            .append('title')
                            .text(
                                `${yr}, ${r.State_name}: ${fmt(r.Hospitalisations)} hospitalisations; average stay ${decimal(r.Average_stay_days)} days; ${fmt(r.Bed_days)} bed days`
                            );

                        // Add state label
                        svg.append('text')
                            .attr('data-state', r.State)
                            .attr(
                                'opacity',
                                !selectedBubble || selectedBubble === r.State
                                    ? 1
                                    : .3
                            )
                            .attr(
                                'x',
                                x(r.Hospitalisations) +
                                (r.State === 'NT' ? 28 : r.State === 'TAS' ? 0 : 0)
                            )
                            .attr(
                                'y',
                                r.State === 'NT'
                                    ? y(r.Average_stay_days) + 18
                                    : y(r.Average_stay_days) - radius(r.Bed_days) - 7
                            )
                            .attr('text-anchor', 'middle')
                            .style('font-size', '12px')
                            .style('font-weight', '600')
                            .attr('paint-order', 'stroke')
                            .attr('stroke', 'white')
                            .attr('stroke-width', 3)
                            .style('fill', '#536781')
                            .text(r.State);
                    });

                // Add the state data table
                table(host, rows);
            }
        }

        // Add year playback controls to the map page
        if (mapPage) {
            let timer = null;

            const play = document.createElement('button');
            play.type = 'button';
            play.className = 'reset';
            play.id = 'play-years';
            play.textContent = '▶ Play years';
            play.setAttribute('aria-pressed', 'false');
            play.style.cssText = 'width:100%;margin:8px 0 12px';

            const labels = $('.range-labels');
            labels.after(play);

            // Stop year playback
            const stop = () => {
                clearInterval(timer);
                timer = null;

                play.textContent = '▶ Play years';
                play.setAttribute('aria-pressed', 'false');
            };

            // Start or pause year playback
            play.onclick = () => {
                if (timer) {
                    stop();
                    return;
                }

                if (+year.value === 2021) {
                    year.value = '2011';
                }

                render();

                play.textContent = '❚❚ Pause years';
                play.setAttribute('aria-pressed', 'true');

                timer = setInterval(() => {
                    if (+year.value >= 2021) {
                        stop();
                        return;
                    }

                    year.value = String(+year.value + 1);
                    render();
                }, 1200);
            };

            // Stop playback when the year is changed manually
            year.addEventListener('change', stop);
            $('#year-range').addEventListener('input', stop);
            $('#reset').addEventListener('click', stop);

            // Stop playback when leaving the page
            window.addEventListener('pagehide', stop);
        }

        // Reset bubble chart selection
        if (!mapPage) {
            $('#reset').addEventListener('click', () => {
                selectedBubble = null;
                render();
            });
        }

        // Initial rendering and chart update listeners
        render();

        document.addEventListener('national-year-change', render);

        // Re-render charts when the main section is resized
        let frame;

        new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(render);
        }).observe($('main'));

    } catch (e) {
        // Display an error if the state chart data cannot be loaded
        $('#status').textContent =
            'State charts could not load: ' + e.message;

        const host = $(mapPage ? '#state-map' : '#bubble');

        host.textContent =
            'Check state_dashboard.csv and open using Live Server. ' +
            e.message;

        console.error(e);
    }
})();


