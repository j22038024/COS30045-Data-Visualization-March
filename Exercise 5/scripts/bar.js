/* =====================================================
   bar.js — 55-inch TV Energy Consumption by Screen Technology
   Data: data_Ex5_TV_energy_55inchtv_byScreenType.csv
   ===================================================== */
(function () {
    'use strict';

    const CSV = 'data/Ex5_TV_energy_55inchtv_byScreenType.csv';

    // Consistent technology colour palette (matches scatter + donut)
    const COLORS = {
        'LCD': '#2dd4bf',
        'LED': '#fb923c',
        'OLED': '#f472b6'
    };

    let cachedData = null;
    let isFirstDraw = true;
    const container = document.getElementById('bar-chart');
    const tooltip = document.getElementById('tooltip');

    // ── DATA LOAD ────────────────────────────────────────
    async function load() {
        const raw = await d3.csv(CSV);
        cachedData = raw.map(d => ({
            tech: d['Screen_Tech'],
            value: +d['Mean(Labelled energy consumption (kWh/year))']
        }));
    }

    // ── DRAW ─────────────────────────────────────────────
    function draw() {
        if (!cachedData) return;
        container.innerHTML = '';

        const W = container.clientWidth;
        const H = container.clientHeight;
        const m = { top: 32, right: 28, bottom: 58, left: 74 };
        const iW = W - m.left - m.right;
        const iH = H - m.top - m.bottom;
        if (iW <= 0 || iH <= 0) return;

        const svg = d3.select(container).append('svg')
            .attr('width', W).attr('height', H);

        const g = svg.append('g')
            .attr('transform', `translate(${m.left},${m.top})`);

        // ── SCALES
        const xSc = d3.scaleBand()
            .domain(cachedData.map(d => d.tech))
            .range([0, iW])
            .padding(0.38);

        const yMax = d3.max(cachedData, d => d.value);
        const ySc = d3.scaleLinear()
            .domain([0, yMax * 1.2])
            .range([iH, 0]);

        // ── GRID LINES
        const yTicks = ySc.ticks(5);
        g.selectAll('.grid-h').data(yTicks).join('line')
            .attr('class', 'grid-h')
            .attr('x1', 0).attr('x2', iW)
            .attr('y1', d => ySc(d)).attr('y2', d => ySc(d))
            .attr('stroke', 'rgba(255,255,255,0.055)')
            .attr('stroke-dasharray', '3,4');

        // ── Y-AXIS
        g.append('g')
            .call(d3.axisLeft(ySc).tickValues(yTicks).tickFormat(d3.format('d')))
            .call(ax => {
                ax.select('.domain').attr('stroke', 'rgba(255,255,255,0.15)');
                ax.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.15)');
                ax.selectAll('.tick text')
                    .attr('fill', '#586880')
                    .style('font-size', '10px');
            });

        // ── X-AXIS (tech names, coloured)
        const xAxisG = g.append('g')
            .attr('transform', `translate(0,${iH})`)
            .call(d3.axisBottom(xSc).tickSize(0));
        xAxisG.select('.domain').remove();
        xAxisG.selectAll('.tick text')
            .attr('fill', d => COLORS[d] || '#8899b0')
            .attr('dy', '1.6em')
            .style('font-size', '13px')
            .style('font-weight', '500');

        // ── Y-AXIS LABEL
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -iH / 2).attr('y', -60)
            .attr('text-anchor', 'middle')
            .attr('fill', '#8899b0')
            .style('font-size', '11px')
            .text('Mean Energy Consumption (kWh/year)');

        // ── BAR BACKGROUNDS (subtle full-height ghost bars)
        g.selectAll('.bar-bg').data(cachedData).join('rect')
            .attr('class', 'bar-bg')
            .attr('x', d => xSc(d.tech))
            .attr('y', 0)
            .attr('width', xSc.bandwidth())
            .attr('height', iH)
            .attr('fill', d => COLORS[d.tech] || '#aaa')
            .attr('fill-opacity', 0.04)
            .attr('rx', 4);

        // ── BARS
        const bars = g.selectAll('.bar').data(cachedData).join('rect')
            .attr('class', 'bar')
            .attr('x', d => xSc(d.tech))
            .attr('width', xSc.bandwidth())
            .attr('rx', 5)
            .attr('fill', d => COLORS[d.tech] || '#aaa')
            .attr('fill-opacity', 0.82)
            .style('cursor', 'pointer');

        // Animate bars up on first draw; instant on resize
        if (isFirstDraw) {
            bars
                .attr('y', iH).attr('height', 0)
                .transition().duration(700).delay((_, i) => i * 100).ease(d3.easeCubicOut)
                .attr('y', d => ySc(d.value))
                .attr('height', d => iH - ySc(d.value));
            isFirstDraw = false;
        } else {
            bars
                .attr('y', d => ySc(d.value))
                .attr('height', d => iH - ySc(d.value));
        }

        // ── REFERENCE LINE: average across the three technologies
        const avg = d3.mean(cachedData, d => d.value);
        const refY = ySc(avg);

        g.append('line')
            .attr('x1', -4).attr('x2', iW + 4)
            .attr('y1', refY).attr('y2', refY)
            .attr('stroke', 'rgba(255,255,255,0.22)')
            .attr('stroke-dasharray', '5,4')
            .attr('stroke-width', 1);

        g.append('text')
            .attr('x', iW + 7).attr('y', refY)
            .attr('dy', '0.35em')
            .attr('fill', '#586880')
            .style('font-size', '9px')
            .text(`avg ${avg.toFixed(0)}`);

        // ── VALUE LABELS ON TOP OF BARS
        // Delay label appearance to match bar animation
        const labelsG = g.append('g').attr('opacity', isFirstDraw ? 0 : 1);

        g.selectAll('.bar-val').data(cachedData).join('text')
            .attr('class', 'bar-val')
            .attr('x', d => xSc(d.tech) + xSc.bandwidth() / 2)
            .attr('y', d => ySc(d.value) - 9)
            .attr('text-anchor', 'middle')
            .attr('fill', d => COLORS[d.tech] || '#aaa')
            .style('font-size', '13px')
            .style('font-weight', '500')
            .text(d => d.value.toFixed(0));

        // ── TOOLTIP INTERACTIONS
        g.selectAll('.bar')
            .on('mouseover', function (evt, d) {
                d3.select(this)
                    .transition().duration(80)
                    .attr('fill-opacity', 1);

                // Highlight the bar with a top glow
                g.selectAll('.bar-val')
                    .filter(v => v.tech === d.tech)
                    .attr('fill', '#fff');

                tooltip.style.opacity = 1;
                tooltip.style.minWidth = '300px';
                tooltip.innerHTML = `
          <strong>${d.tech} — 55&Prime; TVs</strong>
          <div class="tt-row"><span>Mean annual energy</span><span>${d.value.toFixed(1)}&thinsp;kWh/yr</span></div>
          <div class="tt-row"><span>vs. 3-tech average</span><span>${d.value > avg ? '+' : ''}${(d.value - avg).toFixed(1)}&thinsp;kWh/yr</span></div>
        `;
            })
            .on('mousemove', evt => positionTooltip(evt))
            .on('mouseout', function (evt, d) {
                d3.select(this)
                    .transition().duration(80)
                    .attr('fill-opacity', 0.82);

                g.selectAll('.bar-val')
                    .attr('fill', v => COLORS[v.tech] || '#aaa');

                tooltip.style.opacity = 0;
                tooltip.style.minWidth = '';
            });
    }

    // ── HELPER ───────────────────────────────────────────
    function positionTooltip(evt) {
        const vw = window.innerWidth;
        let lx = evt.clientX + 16;
        let ly = evt.clientY - 20;
        if (lx + 220 > vw - 8) lx = evt.clientX - 236;
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