
/* Summed from the team's KNIME national_traffic_cleaned.csv by year and road user.
   Bed_days is the original total, including bed days for in-hospital deaths. */
(async () => {
    const host = document.querySelector('#road-bed-chart');
    if (!host) return;

    const d3 = window.d3;
    const fmt = d3.format(',');
    let selected = null;

    try {
        // Load and convert the processed road-user bed-day data
        const rows = await d3.csv(
            'data/processed/road_user_bed_days.csv',
            r => ({
                ...r,
                Year: +r.Year,
                Hospitalisations: +r.Hospitalisations,
                Bed_days: +r.Bed_days
            })
        );

        // Define road-user categories and their colours
        const names = [...new Set(rows.map(r => r.Road_user))];
        const color = d3.scaleOrdinal(
            [
                "Car driver",
                "Car passenger",
                "Car unknown position",
                "Bus occupant",
                "Heavy transport driver",
                "Heavy transport passenger",
                "Heavy transport unknown position",
                "Motorcyclist",
                "Pedal cyclist",
                "Pedestrian",
                "Pick-up truck or van occupant",
                "Other or unknown"
            ],
            [
                '#4f8fcf',
                '#8bbbe8',
                '#c3dcf4',
                '#f1dc6b',
                '#3fae8a',
                '#7fcdb1',
                '#bfe6d6',
                '#f2a65a',
                '#e08fb8',
                '#9f8fd0',
                '#e07a5f',
                '#aab2bf'
            ]
        );

        // Render the chart for the selected year
        function render() {
            const year = +document.querySelector('#year').value;
            const data = rows.filter(r => r.Year === year);

            if (!data.length) return;

            const card = host.closest('section');
            const w = Math.max(320, host.clientWidth);
            const h = Math.max(140, host.clientHeight);

            // Clear previous chart content
            host.replaceChildren();

            // Create SVG container
            const svg = d3.select(host)
                .append('svg')
                .attr('viewBox', `0 0 ${w} ${h}`)
                .attr('role', 'img')
                .attr(
                    'aria-label',
                    `Road-user hospitalisations and total bed days, ${year}`
                );

            // Define chart scales
            const x = d3.scaleLinear()
                .domain([
                    0,
                    d3.max(data, r => r.Hospitalisations) * 1.15
                ])
                .nice()
                .range([60, w - 30]);

            const y = d3.scaleLinear()
                .domain([
                    0,
                    d3.max(data, r => r.Bed_days) * 1.2
                ])
                .nice()
                .range([h - 38, 25]);

            const radius = d3.scaleSqrt()
                .domain([0, d3.max(rows, r => r.Bed_days)])
                .range([0, 27]);

            // Add horizontal axis
            svg.append('g')
                .attr('transform', `translate(0,${h - 38})`)
                .call(
                    d3.axisBottom(x)
                        .ticks(4)
                        .tickFormat(d3.format('~s'))
                );

            // Add vertical axis and gridlines
            svg.append('g')
                .attr('transform', 'translate(60,0)')
                .call(
                    d3.axisLeft(y)
                        .ticks(3)
                        .tickFormat(d3.format('~s'))
                        .tickSize(-(w - 90))
                )
                .call(g => g.selectAll('line').attr('stroke', '#e6ecf5'))
                .call(g => g.select('.domain').remove());

            // Add axis labels
            svg.append('text')
                .attr('x', 60)
                .attr('y', 13)
                .text('Total bed days');

            svg.append('text')
                .attr('x', w / 2)
                .attr('y', h - 3)
                .attr('text-anchor', 'middle')
                .text('Hospitalisations');

            // Draw bubbles for each road-user category
            [...data]
                .sort((a, b) => b.Bed_days - a.Bed_days)
                .forEach(r => {
                    const dot = svg.append('circle')
                        .attr('cx', x(r.Hospitalisations))
                        .attr('cy', y(r.Bed_days))
                        .attr('r', Math.max(3, radius(r.Bed_days)))
                        .attr('fill', color(r.Road_user))
                        .attr(
                            'fill-opacity',
                            selected && selected !== r.Road_user ? .15 : .9
                        )
                        .attr(
                            'stroke',
                            selected === r.Road_user ? '#33415c' : 'white'
                        )
                        .attr('stroke-width', 2)
                        .attr('tabindex', 0)
                        .attr('role', 'button')
                        .attr(
                            'aria-label',
                            `${r.Road_user}: ${fmt(r.Hospitalisations)} hospitalisations; ${fmt(r.Bed_days)} total bed days`
                        )
                        .style('cursor', 'pointer');

                    // Handle bubble selection
                    const choose = () => {
                        selected = selected === r.Road_user
                            ? null
                            : r.Road_user;

                        render();
                    };

                    dot.on('click', choose)
                        .on('keydown', e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                choose();
                            }
                        })
                        .append('title')
                        .text(
                            `${year} · ${r.Road_user}: ${fmt(r.Hospitalisations)} hospitalisations; ${fmt(r.Bed_days)} total bed days`
                        );

                    // Display labels for larger bubbles or selected categories
                    if (
                        r.Hospitalisations >
                            d3.max(data, d => d.Hospitalisations) * .15 ||
                        selected === r.Road_user
                    ) {
                        svg.append('text')
                            .attr('x', x(r.Hospitalisations))
                            .attr(
                                'y',
                                y(r.Bed_days) - radius(r.Bed_days) - 5
                            )
                            .attr('text-anchor', 'middle')
                            .text(r.Road_user);
                    }
                });

            // Create the View Data button if it does not already exist
            let button = card.querySelector('.road-bed-table');

            if (!button) {
                button = document.createElement('button');
                button.type = 'button';
                button.className = 'real-table-button road-bed-table';
                button.textContent = 'View data';

                host.after(button);
            }

            // Display detailed data in a dialog table
            button.onclick = () => {
                const dialog = document.querySelector('#details');

                dialog.querySelectorAll('.dialog-table')
                    .forEach(e => e.remove());

                document.querySelector('#detail-title').textContent =
                    'Hospitalisations vs bed days · ' + year;

                document.querySelector('#detail-text').textContent =
                    'Summed from national_traffic_cleaned.csv. Total bed days include in-hospital deaths; hospitalisations exclude them. Both sexes. These totals do not measure risk or average stay.';

                // Create table
                const table = document.createElement('table');
                table.className = 'dialog-table';

                // Add table headers
                const header = table.createTHead().insertRow();

                [
                    'Road user',
                    'Hospitalisations',
                    'Total bed days'
                ].forEach(v => {
                    const th = document.createElement('th');
                    th.textContent = v;
                    header.append(th);
                });

                // Add table data
                const body = table.createTBody();

                data.forEach(r => {
                    const tr = body.insertRow();

                    [
                        r.Road_user,
                        fmt(r.Hospitalisations),
                        fmt(r.Bed_days)
                    ].forEach(v => {
                        tr.insertCell().textContent = v;
                    });
                });

                dialog.append(table);
                dialog.showModal();
            };
        }

        // Listen for year changes
        document.addEventListener('national-year-change', render);

        // Reset the selected road-user category
        document.querySelector('#reset').addEventListener('click', () => {
            selected = null;
            render();
        });

        // Re-render the chart when its section is resized
        let frame;

        new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(render);
        }).observe(host.closest('section'));

        // Initial chart rendering
        render();

    } catch (e) {
        host.textContent =
            'Unable to load real road-user bed-day data: ' + e.message;
    }
})();
