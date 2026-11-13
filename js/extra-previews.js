
/* Design-only geometry. No values here are hospitalisation records. */
(() => {
    if (!window.d3) return;

    // Colour palette and category names
    const colors = [
        '#9BC7E5',
        '#F2C3A2',
        '#A8D6C5',
        '#CDB8DE'
    ];

    const names = [
        'Car occupant',
        'Motorcyclist',
        'Pedal cyclist',
        'Pedestrian'
    ];

    // Create SVG canvas
    function canvas(id) {
        const el = document.getElementById(id);
        if (!el) return null;

        const w = el.clientWidth;
        const h = el.clientHeight;

        d3.select(el).selectAll('*').remove();

        const svg = d3.select(el)
            .append('svg')
            .attr('viewBox', `0 0 ${w} ${h}`)
            .attr('role', 'img')
            .attr(
                'aria-label',
                'Illustrative design preview, not real statistics'
            );

        return { svg, w, h };
    }

    // Draw design previews
    function draw() {

        // Bubble chart design preview
        let c = canvas('people-bubble');

        if (c) {
            const { svg, w, h } = c;

            const x = d3.scaleLinear()
                .domain([0, 100])
                .range([45, w - 30]);

            const y = d3.scaleLinear()
                .domain([0, 100])
                .range([h - 42, 30]);

            // Draw axes
            svg.append('path')
                .attr('d', `M45,20 V${h - 42} H${w - 20}`)
                .attr('stroke', '#C8D6DF')
                .attr('fill', 'none');

            // Add axis labels
            svg.append('text')
                .attr('x', 46)
                .attr('y', 14)
                .text('Bed days');

            svg.append('text')
                .attr('x', w - 20)
                .attr('y', h - 9)
                .attr('text-anchor', 'end')
                .text('Hospitalisations →');

            // Add illustrative bubbles and labels
            [
                [82, 75, 20],
                [57, 62, 17],
                [32, 42, 13],
                [12, 26, 10]
            ].forEach((p, i) => {

                svg.append('circle')
                    .attr('cx', x(p[0]))
                    .attr('cy', y(p[1]))
                    .attr('r', Math.min(p[2], h * 0.12))
                    .attr('fill', colors[i])
                    .append('title')
                    .text(
                        names[i] +
                        ' — illustrative position and size'
                    );

                svg.append('text')
                    .attr('x', x(p[0]))
                    .attr('y', y(p[1]) + Math.min(p[2], h * 0.12) + 14)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '10px')
                    .text(names[i]);
            });
        }

        // Heatmap design preview
        c = document.querySelector('script[src="js/national-data.js"]')
            ? null
            : canvas('people-heatmap');

        if (c) {
            const { svg, w, h } = c;

            const ages = [
                '17–25',
                '26–39',
                '40–64',
                '65–74'
            ];

            const rows = [
                'Car occupant',
                'Motorcyclist',
                'Pedal cyclist'
            ];

            const x = d3.scaleBand()
                .domain(ages)
                .range([112, w - 8])
                .padding(0.025);

            const y = d3.scaleBand()
                .domain(rows)
                .range([26, h - 10])
                .padding(0.07);

            // Illustrative intensity values
            const values = [
                [0.25, 0.5, 1, 0.08],
                [0.5, 0.75, 0.08, 0.25],
                [0.75, 1, 0.25, 0.5]
            ];

            // Add age-group headings
            ages.forEach(a => {
                svg.append('text')
                    .attr('x', x(a) + x.bandwidth() / 2)
                    .attr('y', 17)
                    .attr('text-anchor', 'middle')
                    .text(a);
            });

            // Add row labels and heatmap cells
            rows.forEach((r, i) => {

                svg.append('text')
                    .attr('x', 102)
                    .attr('y', y(r) + y.bandwidth() / 2 + 4)
                    .attr('text-anchor', 'end')
                    .style('font-size', '11px')
                    .text(r);

                ages.forEach((a, j) => {

                    svg.append('rect')
                        .attr('x', x(a))
                        .attr('y', y(r))
                        .attr('width', x.bandwidth())
                        .attr('height', y.bandwidth())
                        .attr(
                            'fill',
                            d3.interpolateRgb(
                                '#EEF5FB',
                                '#8DBCDC'
                            )(values[i][j])
                        )
                        .append('title')
                        .text(
                            `${r}, ${a}: illustrative intensity, real count pending`
                        );

                    svg.append('text')
                        .attr('x', x(a) + x.bandwidth() / 2)
                        .attr('y', y(r) + y.bandwidth() / 2 + 4)
                        .attr('text-anchor', 'middle')
                        .style('fill', '#203B50')
                        .text('—');
                });
            });
        }

        // Remoteness donut chart design preview
        c = canvas('remoteness-donut');

        if (c) {
            const { svg, w, h } = c;

            const r = Math.min(w * 0.27, h * 0.43);

            const arc = d3.arc()
                .innerRadius(r * 0.64)
                .outerRadius(r);

            // Draw donut segments
            svg.append('g')
                .attr('transform', `translate(${w / 2},${h / 2})`)
                .selectAll('path')
                .data(d3.pie().sort(null)([1, 1, 1, 1, 1]))
                .join('path')
                .attr('d', arc)
                .attr('fill', (d, i) => [
                    '#EEE8F5',
                    '#E0D4ED',
                    '#CFBDE3',
                    '#BDA8D7',
                    '#AB94CA'
                ][i])
                .attr('stroke', 'white')
                .attr('stroke-width', 2);

            // Add centre placeholder label
            svg.append('text')
                .attr('x', w / 2)
                .attr('y', h / 2 + 4)
                .attr('text-anchor', 'middle')
                .style('font-size', '11px')
                .text('PLACEHOLDER');
        }
    }

    // Redraw charts when the layout is resized
    let frame;

    new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(draw);
    }).observe(document.querySelector('.comparison-layout'));

    draw();
})();
