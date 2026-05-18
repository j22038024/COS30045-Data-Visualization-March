/* =====================================================
   scatter.js — Energy Consumption vs Star Rating
   Data: Ex5_TV_energy.csv
   ===================================================== */
(function () {
    'use strict';

    // ── CONFIG ──────────────────────────────────────────
    const CSV = 'data/Ex5_TV_energy.csv';

    // Consistent technology colour palette (matches bar + donut)
    const TECH_COLORS = {
        'LCD': '#2dd4bf',
        'LCD (LED)': '#fb923c',
        'OLED': '#f472b6'
    };
    const TECHS = ['LCD', 'LCD (LED)', 'OLED'];

    let cachedData = null;
    const container = document.getElementById('scatter-chart');
    const tooltip = document.getElementById('tooltip');

    // ── DATA LOAD ────────────────────────────────────────
    async function load() {
        const raw = await d3.csv(CSV);
        cachedData = raw
            .map(d => ({
                brand: d.brand,
                tech: d.screen_tech,
                size: +d.screensize,
                energy: +d.energy_consumpt,
                stars: +d.star2,
                count: +d.count,
                // pre-compute jitter so it stays stable on resize
                jx: (Math.random() - 0.5) * 0.12
            }))
            .filter(d => isFinite(d.energy) && isFinite(d.stars));
    }

    // ── DRAW ─────────────────────────────────────────────
    function draw() {
        if (!cachedData) return;
        container.innerHTML = '';

        const W = container.clientWidth;
        const H = container.clientHeight;
        const m = { top: 16, right: 24, bottom: 52, left: 68 };
        const iW = W - m.left - m.right;
        const iH = H - m.top - m.bottom;
        if (iW <= 0 || iH <= 0) return;

        const svg = d3.select(container).append('svg')
            .attr('width', W).attr('height', H);

        const g = svg.append('g')
            .attr('transform', `translate(${m.left},${m.top})`);

        // ── CLIP PATH (keep dots inside axes)
        svg.append('defs').append('clipPath').attr('id', 'scatter-clip')
            .append('rect').attr('width', iW).attr('height', iH);

        // ── SCALES
        const xExt = d3.extent(cachedData, d => d.stars);
        const xSc = d3.scaleLinear()
            .domain([xExt[0] - 0.25, xExt[1] + 0.25])
            .range([0, iW]);

        const ySc = d3.scaleLinear()
            .domain([0, d3.max(cachedData, d => d.energy) * 1.07])
            .range([iH, 0]);

        // ── GRID LINES
        const gridY = g.append('g');
        gridY.selectAll('line').data(ySc.ticks(6)).join('line')
            .attr('x1', 0).attr('x2', iW)
            .attr('y1', d => ySc(d)).attr('y2', d => ySc(d))
            .attr('stroke', 'rgba(255,255,255,0.055)')
            .attr('stroke-dasharray', '3,4');

        const gridX = g.append('g');
        gridX.selectAll('line').data(xSc.ticks(8)).join('line')
            .attr('x1', d => xSc(d)).attr('x2', d => xSc(d))
            .attr('y1', 0).attr('y2', iH)
            .attr('stroke', 'rgba(255,255,255,0.055)')
            .attr('stroke-dasharray', '3,4');

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
            .call(d3.axisBottom(xSc).ticks(8).tickFormat(d => `${d}★`))
            .call(styleAxis);

        g.append('g')
            .call(d3.axisLeft(ySc).ticks(6))
            .call(styleAxis);

        // ── AXIS LABELS
        const labelStyle = sel => {
            sel.attr('fill', '#8899b0')
                .style('font-family', "'Plus Jakarta Sans', sans-serif")
                .style('font-size', '11px');
        };

        g.append('text')
            .attr('x', iW / 2).attr('y', iH + 44)
            .attr('text-anchor', 'middle')
            .call(labelStyle)
            .text('Energy Star Rating');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -iH / 2).attr('y', -56)
            .attr('text-anchor', 'middle')
            .call(labelStyle)
            .text('Energy Consumption (kWh/year)');

        // ── DOTS (layered per technology for clean z-ordering)
        const dotLayer = g.append('g').attr('clip-path', 'url(#scatter-clip)');

        TECHS.forEach(tech => {
            const techData = cachedData.filter(d => d.tech === tech);
            dotLayer.selectAll(null)
                .data(techData)
                .join('circle')
                .attr('cx', d => xSc(d.stars + d.jx))
                .attr('cy', d => ySc(d.energy))
                .attr('r', 4.5)
                .attr('fill', TECH_COLORS[tech] || '#aaa')
                .attr('fill-opacity', 0.55)
                .attr('stroke', TECH_COLORS[tech] || '#aaa')
                .attr('stroke-opacity', 0.2)
                .attr('stroke-width', 0.5)
                .style('cursor', 'crosshair')
                .on('mouseover', function (evt, d) {
                    d3.select(this)
                        .raise()
                        .attr('r', 7)
                        .attr('fill-opacity', 1)
                        .attr('stroke-opacity', 0.6);
                    tooltip.style.opacity = 1;
                    tooltip.innerHTML = `
            <strong>${d.brand}</strong>
            <div class="tt-row"><span>Technology</span><span>${d.tech}</span></div>
            <div class="tt-row"><span>Screen size</span><span>${d.size}&Prime;</span></div>
            <div class="tt-row"><span>Energy use</span><span>${d.energy}&thinsp;kWh/yr</span></div>
            <div class="tt-row"><span>Star rating</span><span>${d.stars}&nbsp;★</span></div>
          `;
                })
                .on('mousemove', function (evt) {
                    positionTooltip(evt);
                })
                .on('mouseout', function () {
                    d3.select(this)
                        .attr('r', 4.5)
                        .attr('fill-opacity', 0.55)
                        .attr('stroke-opacity', 0.2);
                    tooltip.style.opacity = 0;
                });
        });

        // ── TREND LINES per technology (linear regression)
        TECHS.forEach(tech => {
            const pts = cachedData.filter(d => d.tech === tech);
            if (pts.length < 3) return;

            const n = pts.length;
            const mx = d3.mean(pts, d => d.stars);
            const my = d3.mean(pts, d => d.energy);
            const num = d3.sum(pts, d => (d.stars - mx) * (d.energy - my));
            const denom = d3.sum(pts, d => (d.stars - mx) ** 2);
            if (denom === 0) return;

            const slope = num / denom;
            const intercept = my - slope * mx;
            const xMin = xExt[0] - 0.25;
            const xMax = xExt[1] + 0.25;

            g.append('line')
                .attr('x1', xSc(xMin)).attr('x2', xSc(xMax))
                .attr('y1', ySc(slope * xMin + intercept))
                .attr('y2', ySc(slope * xMax + intercept))
                .attr('stroke', TECH_COLORS[tech])
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', '6,4')
                .attr('stroke-opacity', 0.45)
                .attr('pointer-events', 'none');
        });

        // ── HTML LEGEND
        buildLegend('scatter-legend', TECHS, TECH_COLORS, 'dot');
    }

    // ── HELPERS ──────────────────────────────────────────
    function buildLegend(id, items, colors, style) {
        const el = document.getElementById(id);
        el.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'legend-item';
            const swatch = style === 'dot'
                ? `<span class="legend-dot" style="background:${colors[item]}"></span>`
                : `<span class="legend-swatch" style="background:${colors[item]}"></span>`;
            div.innerHTML = `${swatch}<span>${item}</span>`;
            el.appendChild(div);
        });
    }

    function positionTooltip(evt) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const tw = 220;
        const th = 120;
        let lx = evt.clientX + 16;
        let ly = evt.clientY - 20;
        if (lx + tw > vw - 8) lx = evt.clientX - tw - 16;
        if (ly + th > vh - 8) ly = evt.clientY - th - 10;
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