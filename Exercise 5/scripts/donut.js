/* =====================================================
   donut.js — Mean Energy by Screen Technology (all sizes)
   Data: data_Ex5_TV_energy_Allsizes_byScreenType.csv
   ===================================================== */
(function () {
    'use strict';

    const CSV = 'data/Ex5_TV_energy_Allsizes_byScreenType.csv';

    const COLORS = {
        'LCD': '#2dd4bf',
        'LED': '#fb923c',
        'OLED': '#f472b6'
    };

    let cachedData = null;
    const container = document.getElementById('donut-chart');
    const tooltip = document.getElementById('tooltip');

    // ── DATA LOAD ────────────────────────────────────────
    async function load() {
        const raw = await d3.csv(CSV);
        cachedData = raw.map(d => ({
            tech: d['Screen_Tech'],
            value: +d['Mean(Labelled energy consumption (kWh/year))']
        }));
        const total = d3.sum(cachedData, d => d.value);
        cachedData.forEach(d => { d.pct = d.value / total * 100; });
    }

    // ── DRAW ─────────────────────────────────────────────
    function draw() {
        if (!cachedData) return;
        container.innerHTML = '';

        const W = container.clientWidth;
        const H = container.clientHeight;
        if (W <= 0 || H <= 0) return;

        // Compute radii from available space
        const size = Math.min(W, H) * 0.85;
        const outerR = size / 2;
        const innerR = outerR * 0.56;
        const cx = W / 2;
        const cy = H / 2;

        const svg = d3.select(container).append('svg')
            .attr('width', W).attr('height', H);

        // ── GLOW FILTER
        const defs = svg.append('defs');
        const filter = defs.append('filter').attr('id', 'donut-glow');
        filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

        // ── PIE LAYOUT
        const pie = d3.pie()
            .value(d => d.value)
            .sort(null)
            .padAngle(0.035);

        const arc = d3.arc().innerRadius(innerR).outerRadius(outerR).cornerRadius(3);
        const arcHover = d3.arc().innerRadius(innerR * 0.97).outerRadius(outerR * 1.05).cornerRadius(3);
        const labelArc = d3.arc()
            .innerRadius(outerR * 1.13)
            .outerRadius(outerR * 1.13);

        const arcs = pie(cachedData);

        // Center display refs (updated on hover)
        let centerValue, centerSub;

        // ── SEGMENTS
        const paths = g.selectAll('path').data(arcs).join('path')
            .attr('d', arc)
            .attr('fill', d => COLORS[d.data.tech] || '#aaa')
            .attr('fill-opacity', 0.82)
            .attr('stroke', '#0c1220')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function (evt, d) {
                d3.select(this)
                    .transition().duration(120)
                    .attr('d', arcHover)
                    .attr('fill-opacity', 1);

                // Update center text
                centerValue.text(d.data.value.toFixed(0));
                centerSub.text(d.data.tech);

                tooltip.style.opacity = 1;
                tooltip.innerHTML = `
          <strong>${d.data.tech}</strong>
          <div class="tt-row"><span>Mean energy</span><span>${d.data.value.toFixed(1)}&thinsp;kWh/yr</span></div>
          <div class="tt-row"><span>Share</span><span>${d.data.pct.toFixed(1)}%</span></div>
        `;
            })
            .on('mousemove', evt => positionTooltip(evt))
            .on('mouseout', function () {
                d3.select(this)
                    .transition().duration(120)
                    .attr('d', arc)
                    .attr('fill-opacity', 0.82);

                centerValue.text(meanAll.toFixed(0));
                centerSub.text('mean kWh/yr');
                tooltip.style.opacity = 0;
            });

        // ── CENTER CIRCLE (background)
        g.append('circle')
            .attr('r', innerR - 2)
            .attr('fill', '#0c1220');

        // ── CENTER TEXT
        const meanAll = d3.mean(cachedData, d => d.value);
        const fontSize = Math.max(16, outerR * 0.27);

        centerValue = g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.1em')
            .attr('fill', '#eef2f7')
            .style('font-family', "'JetBrains Mono', monospace")
            .style('font-size', `${fontSize}px`)
            .style('font-weight', '500')
            .text(meanAll.toFixed(0));

        centerSub = g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', `${fontSize * 0.085 + 18}px`)
            .attr('fill', '#4a5a6e')
            .style('font-family', "'Plus Jakarta Sans', sans-serif")
            .style('font-size', `${Math.max(9, outerR * 0.11)}px`)
            .text('mean kWh/yr');

        // ── EXTERNAL LABELS
        const minLabelR = outerR * 0.5; // don't show labels for tiny charts
        if (outerR > 80) {
            g.selectAll('.dlabel').data(arcs).join('g')
                .attr('class', 'dlabel')
                .each(function (d) {
                    const pos = labelArc.centroid(d);
                    const midAng = (d.startAngle + d.endAngle) / 2;
                    const isRight = midAng < Math.PI;

                    const lineStart = arc.centroid(d);
                    const lineMid = [pos[0] * 0.88, pos[1] * 0.88];
                    const lineEnd = [...pos];

                    d3.select(this).append('polyline')
                        .attr('points', [lineStart, lineMid, lineEnd].map(p => p.join(',')).join(' '))
                        .attr('fill', 'none')
                        .attr('stroke', COLORS[d.data.tech])
                        .attr('stroke-opacity', 0.45)
                        .attr('stroke-width', 1);

                    const anchor = isRight ? 'start' : 'end';
                    const xOff = isRight ? 6 : -6;

                    const labelG = d3.select(this).append('g')
                        .attr('transform', `translate(${lineEnd[0] + xOff}, ${lineEnd[1]})`);

                    labelG.append('text')
                        .attr('text-anchor', anchor)
                        .attr('dy', '-0.15em')
                        .attr('fill', COLORS[d.data.tech])
                        .style('font-family', "'JetBrains Mono', monospace")
                        .style('font-size', `${Math.max(9, Math.min(12, outerR * 0.11))}px`)
                        .style('font-weight', '500')
                        .text(d.data.tech);

                    labelG.append('text')
                        .attr('text-anchor', anchor)
                        .attr('dy', '0.95em')
                        .attr('fill', '#586880')
                        .style('font-family', "'JetBrains Mono', monospace")
                        .style('font-size', `${Math.max(8, Math.min(10, outerR * 0.095))}px`)
                        .text(`${d.data.pct.toFixed(1)}%`);
                });
        }
    }

    // ── HELPERS ──────────────────────────────────────────
    function positionTooltip(evt) {
        const vw = window.innerWidth;
        let lx = evt.clientX + 16;
        let ly = evt.clientY - 20;
        if (lx + 200 > vw - 8) lx = evt.clientX - 216;
        tooltip.style.left = lx + 'px';
        tooltip.style.top = ly + 'px';
    }

    // ── INIT ─────────────────────────────────────────────
    load().then(draw);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(draw, 180);
    });

})();