/* AI PROMPT SUMMARY (paraphrased from project development requests; not verbatim prompts)
Scope: records the AI-assisted requests relevant to this file, not a claim that every line was AI-generated.
Assistance: Codex implementation and refinement support during project development.
1. Load the combined KNIME CSV and use the appropriate data-type rows for the chart components.
2. Implement the people comparisons and remoteness timeline; preserve usable interactions when rendering charts at expanded modal dimensions.
These summaries document assistance; they do not establish data correctness, accessibility compliance or completion of testing. */

/* GenAI acknowledgement: Codex assisted with parts of the shared D3 chart code, CSV integration and interactions.
 * Claude provided website ideas. The team reviewed, edited and verified the AI-assisted work. */

(() => {
    const d3 = window.d3;

    /* ---------- Load dashboard data ---------- */
    // Parse the prepared CSV once, keep typed records, and share them with each chart module.

    window.dashboardData = d3.text(
        'data/processed/australian_road_injury_dashboard.csv'
    ).then(text => {
        const rows = d3.csvParse(
            text.replace(/\r\r\n/g, '\n')
        ).filter(r => r.Data_type?.trim());

        if (rows.length !== 638) {
            throw Error('Expected 638 combined records');
        }

        return rows;
    });

    const fmt = d3.format(',');

    /* ---------- Shared chart canvas ---------- */

    function canvas(host) {
        host.replaceChildren();

        const w = Math.max(320, host.clientWidth);
        const h = Math.max(220, host.clientHeight);

        const svg = d3.select(host)
            .append('svg')
            .attr('viewBox', `0 0 ${w} ${h}`)
            .style('width', '100%')
            .style('height', '100%');

        return { svg, w, h };
    }

    /* ---------- View data button ---------- */

    function dataButton(host, rows, columns) {
        let b = host.parentElement.querySelector('.combined-data');

        if (!b) {
            b = document.createElement('button');
            b.className = 'real-table-button combined-data';
            b.textContent = 'View data';
            host.after(b);
        }

        b.onclick = () => {
            const dialog = document.querySelector('#details');

            dialog.querySelectorAll('.dialog-table').forEach(n => n.remove());

            document.querySelector('#detail-title').textContent =
                host.closest('section').querySelector('h2').textContent;

            document.querySelector('#detail-text').textContent =
                'BITRE / AIHW · real KNIME combined CSV · hospitalisation counts, not population-adjusted risk.';

            const t = document.createElement('table');
            t.className = 'dialog-table';

            const head = t.createTHead().insertRow();

            columns.forEach(c => {
                const th = document.createElement('th');
                th.textContent = c;
                head.append(th);
            });

            rows.forEach(r => {
                const tr = t.insertRow();

                columns.forEach(c => {
                    tr.insertCell().textContent = r[c];
                });
            });

            dialog.append(t);
            dialog.showModal();
        };
    }

    /* ---------- Dumbbell chart: road user comparison ---------- */

    async function dumbbell(target) {
        const expanded = target instanceof HTMLElement;
        const host = expanded
            ? target
            : document.querySelector('#road-bed-chart');

        if (!host) return;

        try {
            const all = await window.dashboardData;

            const yr = +document.querySelector('#year').value || 2021;

            const rs = all.filter(
                r => r.Data_type === 'road_user_shares'
            );

            const base = new Map(
                rs.filter(r => +r.Year === 2011).map(
                    r => [r.Road_user, +r.Hospitalisations]
                )
            );

            const rows = rs.filter(r => +r.Year === yr).map(r => ({
                Road_user: r.Road_user,
                Baseline: base.get(r.Road_user),
                Selected: +r.Hospitalisations
            })).sort((a, b) => b.Selected - a.Selected);

            const { svg, w, h } = canvas(host);

            const left = Math.min(
                expanded ? 230 : 190,
                w * .36
            );

            const bottom = h - 28;

            const x = d3.scaleLinear()
                .domain([
                    0,
                    d3.max(rows, r => Math.max(r.Baseline, r.Selected)) * 1.12
                ])
                .nice()
                .range([left, w - 18]);

            const y = d3.scaleBand()
                .domain(rows.map(r => r.Road_user))
                .range([12, bottom - 8])
                .padding(.3);

            svg.append('g')
                .attr('transform', `translate(0,${bottom})`)
                .call(
                    d3.axisBottom(x)
                        .ticks(4)
                        .tickFormat(d3.format('~s'))
                );

            rows.forEach(r => {
                const cy = y(r.Road_user) + y.bandwidth() / 2;

                svg.append('text')
                    .attr('x', left - 8)
                    .attr('y', cy)
                    .attr('dy', '.35em')
                    .attr('text-anchor', 'end')
                    .style('font-size', expanded ? '15px' : '12px')
                    .text(
                        r.Road_user
                            .replace('Heavy transport', 'Heavy')
                            .replace('unknown position', 'unknown')
                            .replace(
                                'Pick-up truck or van occupant',
                                'Pick-up / van'
                            )
                    );

                const g = svg.append('g')
                    .attr('tabindex', 0)
                    .attr(
                        'aria-label',
                        `${r.Road_user}: 2011 ${fmt(r.Baseline)}; ${yr} ${fmt(r.Selected)}; change ${fmt(r.Selected - r.Baseline)}`
                    );

                g.append('title')
                    .text(g.attr('aria-label'));

                g.append('line')
                    .attr('x1', x(r.Baseline))
                    .attr('x2', x(r.Selected))
                    .attr('y1', cy)
                    .attr('y2', cy)
                    .attr('stroke', '#b6c6d9')
                    .attr('stroke-width', 3);

                [r.Baseline, r.Selected].forEach((v, i) => {
                    g.append('circle')
                        .attr('cx', x(v))
                        .attr('cy', cy)
                        .attr('r', 4)
                        .attr('fill', i ? '#eea34f' : '#518fc8');
                });
            });

            if (!expanded) {
                dataButton(
                    host,
                    rows.map(r => ({
                        'Road user': r.Road_user,
                        '2011': r.Baseline,
                        [String(yr) + ' selected']: r.Selected,
                        Change: r.Selected - r.Baseline
                    })),
                    [
                        'Road user',
                        '2011',
                        String(yr) + ' selected',
                        'Change'
                    ]
                );
            }
        } catch (e) {
            host.textContent = e.message;
        }
    }

    window.drawExpandedDumbbell = dumbbell;

    /* ---------- Remoteness chart state ---------- */

    let range = null;
    let focusedGroup = null;
    let lastRemoteness = null;

    /* ---------- Remoteness chart: yearly trends ---------- */

    window.drawRemoteness = (rows, yr, options = {}) => {
        if (!options.host) {
            lastRemoteness = { rows, yr };
        }

        const host = options.host ||
            document.querySelector('#remoteness-donut');

        if (!host) return;

        const { svg, w, h } = canvas(host);

        const left = 48;
        const right = w - 18;
        const bottom = h - 88;
        const ct = h - 52;
        const cb = h - 22;

        const names = [
            'Major Cities',
            'Regional',
            'Remote'
        ];

        const colors = d3.scaleOrdinal(
            names,
            ['#dc9cc3', '#5b9bd5', '#f4b860']
        );

        const x = d3.scaleLinear()
            .domain([2011, 2021])
            .range([left, right]);

        const y = d3.scaleLinear()
            .domain([
                0,
                d3.max(rows, r => +r.Hospitalisations) * 1.12
            ])
            .nice()
            .range([bottom, 20]);

        const yc = y.copy().range([cb, ct]);

        /* ---------- Chart axes ---------- */

        svg.append('g')
            .attr('transform', `translate(${left},0)`)
            .call(d3.axisLeft(y).ticks(5));

        svg.append('g')
            .attr('transform', `translate(0,${bottom})`)
            .call(
                d3.axisBottom(x)
                    .tickValues(d3.range(2011, 2022, 2))
                    .tickFormat(d3.format('d'))
            );

        /* ---------- Remoteness data series ---------- */

        const series = [
            ...d3.group(rows, r => r.Remoteness)
        ].map(([name, rs]) => [
            name,
            rs.slice().sort((a, b) => a.Year - b.Year)
        ]);

        const groups = svg.selectAll('.remoteness-series')
            .data(series)
            .join('g')
            .attr('class', 'remoteness-series');

        groups.each(function ([name, rs]) {
            const g = d3.select(this);

            g.append('path')
                .datum(rs)
                .attr(
                    'd',
                    d3.line()
                        .x(r => x(r.Year))
                        .y(r => y(r.Hospitalisations))
                )
                .attr('fill', 'none')
                .attr('stroke', colors(name))
                .attr('stroke-width', 3);

            g.selectAll('circle')
                .data(rs)
                .join('circle')
                .attr('cx', r => x(r.Year))
                .attr('cy', r => y(r.Hospitalisations))
                .attr('r', r => +r.Year === +yr ? 5 : 3)
                .attr('fill', colors(name));
        });

        series.forEach(([name, rs]) => {
            svg.append('path')
                .datum(rs)
                .attr(
                    'd',
                    d3.line()
                        .x(r => x(r.Year))
                        .y(r => yc(r.Hospitalisations))
                )
                .attr('fill', 'none')
                .attr('stroke', colors(name))
                .attr('stroke-width', 1.5);
        });

        /* ---------- Timeline highlight and guide ---------- */

        const shade = svg.append('rect')
            .attr('y', 20)
            .attr('height', bottom - 20)
            .attr('fill', '#518fc8')
            .attr('opacity', .08)
            .attr('pointer-events', 'none');

        const guide = svg.append('g')
            .style('display', 'none')
            .attr('pointer-events', 'none');

        guide.append('line')
            .attr('y1', 20)
            .attr('y2', bottom)
            .attr('stroke', '#63768b')
            .attr('stroke-dasharray', '4 3');

        const label = guide.append('text')
            .attr('y', 12)
            .attr('text-anchor', 'middle')
            .attr('fill', '#284568')
            .style('font-size', '12px');

        /* ---------- Summary text ---------- */

        let summary = options.summary ||
            host.parentElement.querySelector('.brush-summary');

        if (!summary) {
            summary = document.createElement('p');
            summary.className = 'brush-summary';
            summary.style.cssText =
                'font-size:12px;line-height:1.5;margin:4px 10px;color:#284568';

            host.after(summary);
        }

        function focus() {
            groups.attr(
                'opacity',
                ([name]) => !focusedGroup || focusedGroup === name ? 1 : .18
            );
        }

        function totals() {
            const a = range ? Math.ceil(range[0]) : 2011;
            const b = range ? Math.floor(range[1]) : 2021;

            document.dispatchEvent(
                new CustomEvent('remoteness-range', {
                    detail: { start: a, end: b }
                })
            );

            summary.textContent =
                `${a}–${b} totals · ` +
                names.map(n =>
                    `${n}: ${fmt(
                        d3.sum(
                            rows.filter(
                                r => r.Remoteness === n &&
                                    r.Year >= a &&
                                    r.Year <= b
                            ),
                            r => +r.Hospitalisations
                        )
                    )}`
                ).join(' · ');
        }

        /* ---------- Interactive year guide ---------- */

        svg.append('rect')
            .attr('x', left)
            .attr('y', 20)
            .attr('width', right - left)
            .attr('height', bottom - 20)
            .attr('fill', 'transparent')
            .on('pointermove', function (e) {
                const year = Math.max(
                    2011,
                    Math.min(
                        2021,
                        Math.round(x.invert(d3.pointer(e, this)[0]))
                    )
                );

                guide.style('display', null);

                guide.select('line')
                    .attr('x1', x(year))
                    .attr('x2', x(year));

                label
                    .attr(
                        'x',
                        Math.max(
                            left + 20,
                            Math.min(right - 20, x(year))
                        )
                    )
                    .text(year);

                summary.textContent =
                    year + ' · ' +
                    names.map(n => {
                        const r = rows.find(
                            r => +r.Year === year && r.Remoteness === n
                        );

                        return n + ': ' +
                            fmt(r ? +r.Hospitalisations : 0);
                    }).join(' · ');
            })
            .on('pointerleave', () => {
                guide.style('display', 'none');
                totals();
            });

        /* ---------- Timeline brush selection ---------- */

        let clearTimeline = null;

        const brush = d3.brushX()
            .extent([
                [left, ct - 5],
                [right, cb + 5]
            ])
            .on('brush end', e => {
                range = e.selection
                    ? e.selection.map(x.invert)
                    : null;

                if (clearTimeline) {
                    clearTimeline.hidden = !range;
                }

                shade
                    .attr('x', range ? x(range[0]) : left)
                    .attr(
                        'width',
                        range ? x(range[1]) - x(range[0]) : 0
                    );

                groups.selectAll('circle')
                    .attr(
                        'opacity',
                        r => !range ||
                            (r.Year >= range[0] && r.Year <= range[1])
                            ? 1
                            : .2
                    );

                totals();
            });

        svg.append('g')
            .call(brush)
            .call(brush.move, range ? range.map(x) : null);

        /* ---------- Remoteness highlight controls ---------- */

        const legend = options.legend ||
            document.querySelector('.remoteness-list');

        legend.replaceChildren();
        legend.classList.add('remoteness-controls');

        const heading = document.createElement('span');
        heading.className = 'remoteness-control-heading';
        heading.textContent = 'Highlight remoteness';
        legend.append(heading);

        const choices = document.createElement('div');
        choices.className = 'remoteness-choices';
        choices.setAttribute('role', 'group');
        choices.setAttribute(
            'aria-label',
            'Highlight remoteness in this chart'
        );

        legend.append(choices);

        const sync = () => {
            choices.querySelectorAll('button').forEach(b => {
                b.setAttribute(
                    'aria-pressed',
                    String((b.dataset.category || null) === focusedGroup)
                );
            });
        };

        [null, ...names].forEach(name => {
            const b = document.createElement('button');

            b.type = 'button';
            b.className = 'remoteness-choice';
            b.dataset.category = name || '';

            if (name) {
                const dot = document.createElement('span');

                dot.className = 'remoteness-dot';
                dot.style.backgroundColor = colors(name);
                dot.setAttribute('aria-hidden', 'true');

                b.append(dot);
            }

            b.append(document.createTextNode(name || 'All'));

            b.onclick = () => {
                focusedGroup = name === focusedGroup ? null : name;
                sync();
                focus();
            };

            choices.append(b);
        });

        sync();

        /* ---------- Timeline reset control ---------- */

        const footer = document.createElement('div');
        footer.className = 'remoteness-control-footer';

        const clear = document.createElement('button');
        clear.type = 'button';
        clear.textContent = 'Clear timeline selection';
        clear.className = 'remoteness-reset';

        clearTimeline = clear;
        clear.hidden = !range;

        clear.onclick = () => {
            svg.select('.brush').call(brush.move, null);
        };

        footer.append(clear);
        legend.append(footer);

        svg.selectAll('g')
            .filter(function () {
                return !!d3.select(this).select('.overlay').node();
            })
            .classed('brush', true);

        focus();
        totals();

        if (!options.host) {
            dataButton(host, rows, [
                'Year',
                'Remoteness',
                'Hospitalisations'
            ]);
        }
    };

    /* ---------- Expanded remoteness chart ---------- */

    window.drawExpandedRemoteness = options => {
        if (lastRemoteness) {
            window.drawRemoteness(
                lastRemoteness.rows,
                lastRemoteness.yr,
                options
            );
        }
    };

    /* ---------- Chart event listeners and initial render ---------- */

    document.addEventListener('national-year-change', dumbbell);
    window.addEventListener('resize', dumbbell);

    dumbbell();
})();


