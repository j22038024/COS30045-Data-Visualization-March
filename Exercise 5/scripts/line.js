/* =====================================================
   line.js — Australian Electricity Spot Prices 1998–2024
   Data: data_Ex5_ARE_Spot_Prices.csv
   ===================================================== */
(function () {
    'use strict';

    const CSV = 'data/Ex5_ARE_Spot_Prices.csv';

    // State configuration — colour, label, column name in CSV
    const STATES = [
        { col: 'Queensland ($ per megawatt hour)', label: 'QLD', color: '#fbbf24' },
        { col: 'New South Wales ($ per megawatt hour)', label: 'NSW', color: '#60a5fa' },
        { col: 'Victoria ($ per megawatt hour)', label: 'VIC', color: '#4ade80' },
        { col: 'South Australia ($ per megawatt hour)', label: 'SA', color: '#f87171' },
        { col: 'Tasmania ($ per megawatt hour)', label: 'TAS', color: '#c084fc' },
        { col: 'Average Price (notTas-Snowy)', label: 'Average', color: '#f8fafc' },
    ];

    // Which states are currently visible (all on by default)
    const activeSet = new Set(STATES.map(s => s.col));

    let cachedData = null;
    const container = document.getElementById('line-chart');
    const tooltip = document.getElementById('tooltip');

    // ── DATA LOAD ────────────────────────────────────────
    async function load() {
        const raw = await d3.csv(CSV);
        cachedData = raw.map(row => {
            const entry = { year: +row['Year'] };
            STATES.forEach(s => {
                const v = row[s.col];
                entry[s.col] = (v === '' || v == null || v === undefined) ? null : +v;
            });
            return entry;
        });
    }

    // ── LEGEND (re-built each draw so inactive class stays current) ──
    function buildLegend() {
        const el = document.getElementById('line-legend');
        el.innerHTML = '';
        STATES.forEach(state => {
            const item = document.createElement('div');
            item.className = 'legend-item' + (activeSet.has(state.col) ? '' : ' inactive');

            const isAvg = state.label === 'Average';
            item.innerHTML = `
        <span class="legend-swatch" style="
          background:${state.color};
          height:${isAvg ? '3px' : '2.5px'};
          opacity:${isAvg ? '1' : '0.75'}
        "></span>
        <span>${state.label}</span>
      `;

            item.addEventListener('click', () => {
                // Prevent deactivating all series
                if (activeSet.has(state.col) && activeSet.size === 1) return;
                activeSet.has(state.col) ? activeSet.delete(state.col) : activeSet.add(state.col);
                draw();
            });

            el.appendChild(item);
        });
    }

    // ── DRAW ─────────────────────────────────────────────
    function draw() {
        if (!cachedData) return;
        container.innerHTML = '';
        buildLegend();

        const W = container.clientWidth;
        const H = container.clientHeight;
        const m = { top: 16, right: 28, bottom: 50, left: 62 };
        const iW = W - m.left - m.right;
        const iH = H - m.top - m.bottom;
        if (iW <= 0 || iH <= 0) return;

        const svg = d3.select(container).append('svg')
            .attr('width', W).attr('height', H);

        const g = svg.append('g')
            .attr('transform', `translate(${m.left},${m.top})`);

        // ── CLIP PATH
        svg.select('defs').remove();
        svg.append('defs').append('clipPath').attr('id', 'line-clip')
            .append('rect').attr('width', iW).attr('height', iH + 4).attr('y', -4);

        // ── SCALES
        const xSc = d3.scaleLinear()
            .domain(d3.extent(cachedData, d => d.year))
            .range([0, iW]);

        // y-domain from active states only
        let yMax = 0;
        STATES.forEach(s => {
            if (!activeSet.has(s.col)) return;
            const mx = d3.max(cachedData, d => d[s.col]);
            if (mx > yMax) yMax = mx;
        });

        const ySc = d3.scaleLinear()
            .domain([0, yMax * 1.12])
            .range([iH, 0]);

        // ── GRID
        const yTicks = ySc.ticks(6);
        g.selectAll('.gy').data(yTicks).join('line')
            .attr('x1', 0).attr('x2', iW)
            .attr('y1', d => ySc(d)).attr('y2', d => ySc(d))
            .attr('stroke', 'rgba(255,255,255,0.055)')
            .attr('stroke-dasharray', '3,4');

        // ── YEAR BAND ANNOTATIONS
        // Shade 2016-2018 price spike period
        const spikeX1 = xSc(2016);
        const spikeX2 = xSc(2022);
        g.append('rect')
            .attr('x', spikeX1).attr('y', 0)
            .attr('width', spikeX2 - spikeX1).attr('height', iH)
            .attr('fill', 'rgba(232,168,56,0.04)')
            .attr('pointer-events', 'none');

        g.append('text')
            .attr('x', spikeX1 + (spikeX2 - spikeX1) / 2)
            .attr('y', 8)
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(232,168,56,0.4)')
            .style('font-family', "'JetBrains Mono', monospace")
            .style('font-size', '9px')
            .text('Price surge period');

        // ── AXES
        const styleAxis = sel => {
            sel.select('.domain').attr('stroke', 'rgba(255,255,255,0.15)');
            sel.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.15)');
            sel.selectAll('.tick text')
                .attr('fill', '#586880')
                .style('font-family', "'JetBrains Mono', monospace")
                .style('font-size', '10px');
        };

        g.append('g')
            .attr('transform', `translate(0,${iH})`)
            .call(d3.axisBottom(xSc).ticks(10).tickFormat(d3.format('d')).tickSizeOuter(0))
            .call(styleAxis);

        g.append('g')
            .call(d3.axisLeft(ySc).tickValues(yTicks).tickFormat(d => `$${d}`).tickSizeOuter(0))
            .call(styleAxis);

        // ── AXIS LABELS
        g.append('text')
            .attr('x', iW / 2).attr('y', iH + 42)
            .attr('text-anchor', 'middle')
            .attr('fill', '#8899b0')
            .style('font-size', '11px')
            .style('font-family', "'Plus Jakarta Sans', sans-serif")
            .text('Year');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -iH / 2).attr('y', -50)
            .attr('text-anchor', 'middle')
            .attr('fill', '#8899b0')
            .style('font-size', '11px')
            .style('font-family', "'Plus Jakarta Sans', sans-serif")
            .text('Spot Price ($/MWh)');

        // ── LINE GENERATOR
        const lineGroup = g.append('g').attr('clip-path', 'url(#line-clip)');

        const makeLine = col => d3.line()
            .x(d => xSc(d.year))
            .y(d => ySc(d[col]))
            .defined(d => d[col] !== null)
            .curve(d3.curveMonotoneX);

        // Draw state lines first, Average on top
        const drawOrder = [...STATES].sort((a, b) =>
            (a.label === 'Average' ? 1 : 0) - (b.label === 'Average' ? 1 : 0)
        );

        drawOrder.forEach(state => {
            if (!activeSet.has(state.col)) return;
            const isAvg = state.label === 'Average';

            lineGroup.append('path')
                .datum(cachedData)
                .attr('fill', 'none')
                .attr('stroke', state.color)
                .attr('stroke-width', isAvg ? 2.5 : 1.5)
                .attr('stroke-opacity', isAvg ? 1 : 0.65)
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round')
                .attr('d', makeLine(state.col));

            // End-of-line dot
            const lastRow = [...cachedData].reverse().find(d => d[state.col] !== null);
            if (lastRow) {
                lineGroup.append('circle')
                    .attr('cx', xSc(lastRow.year))
                    .attr('cy', ySc(lastRow[state.col]))
                    .attr('r', isAvg ? 4 : 3)
                    .attr('fill', state.color)
                    .attr('fill-opacity', isAvg ? 1 : 0.7);
            }
        });

        // ── HOVER CROSSHAIR + TOOLTIP ─────────────────────
        // Vertical guideline
        const guideLine = g.append('line')
            .attr('y1', 0).attr('y2', iH)
            .attr('stroke', 'rgba(255,255,255,0.18)')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,3')
            .attr('pointer-events', 'none')
            .style('opacity', 0);

        // Dots that appear on hover per active state
        const hoverDots = g.append('g').attr('pointer-events', 'none');

        // Invisible overlay to capture mouse events
        g.append('rect')
            .attr('width', iW).attr('height', iH)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .style('cursor', 'crosshair')
            .on('mousemove', function (evt) {
                const [mx] = d3.pointer(evt);
                const rawYear = xSc.invert(mx);
                const year = Math.round(rawYear);
                // Clamp to data range
                const dataYears = cachedData.map(d => d.year);
                const minY = d3.min(dataYears);
                const maxY = d3.max(dataYears);
                if (year < minY || year > maxY) return;

                const row = cachedData.find(d => d.year === year);
                if (!row) return;

                const snapX = xSc(year);
                guideLine.attr('x1', snapX).attr('x2', snapX).style('opacity', 1);

                // Update hover dots
                hoverDots.selectAll('circle').remove();
                STATES.forEach(s => {
                    if (!activeSet.has(s.col)) return;
                    const v = row[s.col];
                    if (v === null) return;
                    hoverDots.append('circle')
                        .attr('cx', snapX)
                        .attr('cy', ySc(v))
                        .attr('r', s.label === 'Average' ? 5 : 4)
                        .attr('fill', s.color)
                        .attr('stroke', '#0c1220')
                        .attr('stroke-width', 1.5);
                });

                // Build tooltip — sorted descending by value
                const activeRows = STATES
                    .filter(s => activeSet.has(s.col) && row[s.col] !== null)
                    .sort((a, b) => row[b.col] - row[a.col]);

                let html = `<strong>${year}</strong><hr class="tt-divider">`;
                activeRows.forEach(s => {
                    const isAvg = s.label === 'Average';
                    html += `
            <div class="tt-row">
              <span style="color:${s.color};font-weight:${isAvg ? 600 : 400}">${s.label}</span>
              <span>$${row[s.col]}/MWh</span>
            </div>`;
                });

                tooltip.innerHTML = html;
                tooltip.style.opacity = 1;
                positionTooltip(evt);
            })
            .on('mouseout', function () {
                guideLine.style('opacity', 0);
                hoverDots.selectAll('circle').remove();
                tooltip.style.opacity = 0;
            });
    }

    // ── HELPER ───────────────────────────────────────────
    function positionTooltip(evt) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let lx = evt.clientX + 18;
        let ly = evt.clientY - 30;
        if (lx + 200 > vw - 8) lx = evt.clientX - 218;
        if (ly + 200 > vh - 8) ly = evt.clientY - 210;
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