/* ============================================
   HISTOGRAM.JS — D3 Histogram Builder
   ============================================ */

let _svg, _xScale, _yScale, _yAxisG, _barsGroup;
let _width, _height;

/**
 * initHistogram — builds SVG structure once.
 */
function initHistogram(data) {
    const container = document.getElementById("histogram-container");
    const { margin } = CONFIG;

    _width = container.clientWidth - margin.left - margin.right;
    _height = 340;

    _svg = d3.select("#histogram-container")
        .append("svg")
        .attr("class", "histogram-svg")
        .attr("width", _width + margin.left + margin.right)
        .attr("height", _height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    /* X scale — fixed to full dataset extent */
    _xScale = d3.scaleLinear()
        .domain([0, d3.max(data, ACCESSORS.energy)]).nice()
        .range([0, _width]);

    /* Y scale — domain updated each draw */
    _yScale = d3.scaleLinear().range([_height, 0]);

    /* X axis */
    _svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0,${_height})`)
        .call(
            d3.axisBottom(_xScale)
                .ticks(8)
                .tickFormat(d => d === 0 ? "0" : d3.format(",")(d))
        );

    /* X axis label */
    _svg.append("text")
        .attr("class", "axis-label")
        .attr("x", _width / 2)
        .attr("y", _height + 50)
        .attr("text-anchor", "middle")
        .text(CONFIG.xLabel);

    /* Y axis group */
    _yAxisG = _svg.append("g")
        .attr("class", "axis axis--y");

    /* Y axis label */
    _svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -_height / 2)
        .attr("y", -52)
        .attr("text-anchor", "middle")
        .text(CONFIG.yLabel);

    /* Bars group */
    _barsGroup = _svg.append("g").attr("class", "bars-group");

    /* First draw */
    updateHistogram(data);
}

/**
 * updateHistogram — rebins and transitions bars for filtered data.
 */
function updateHistogram(filteredData) {
    /* Clear no-data message */
    _svg.select(".no-data-msg").remove();

    if (filteredData.length === 0) {
        _barsGroup.selectAll(".bar").remove();
        _svg.append("text")
            .attr("class", "no-data-msg")
            .attr("x", _width / 2)
            .attr("y", _height / 2)
            .attr("text-anchor", "middle")
            .text("No data matches the current filters.");
        return;
    }

    /* Bin */
    const bins = d3.bin()
        .value(ACCESSORS.energy)
        .domain(_xScale.domain())
        .thresholds(_xScale.ticks(CONFIG.binCount))(filteredData);

    /* Update Y scale */
    _yScale.domain([0, d3.max(bins, d => d.length)]).nice();

    /* Y axis */
    _yAxisG
        .transition().duration(CONFIG.transitionDuration)
        .call(
            d3.axisLeft(_yScale)
                .ticks(6)
                .tickSize(-_width)
                .tickFormat(d3.format(","))
        );
    _yAxisG.selectAll(".tick line")
        .attr("stroke", "var(--border-light)");
    _yAxisG.select(".domain").remove();

    /* Bars — key by bin start */
    const bars = _barsGroup.selectAll(".bar").data(bins, d => d.x0);

    bars.exit()
        .transition().duration(CONFIG.transitionDuration)
        .attr("y", _height).attr("height", 0).remove();

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => _xScale(d.x0) + 1)
        .attr("width", d => Math.max(0, _xScale(d.x1) - _xScale(d.x0) - 2))
        .attr("y", _height)
        .attr("height", 0)
        .on("mousemove", _onBarHover)
        .on("mouseleave", _onBarLeave)
        .merge(bars)
        .transition().duration(CONFIG.transitionDuration).ease(d3.easeCubicOut)
        .attr("x", d => _xScale(d.x0) + 1)
        .attr("width", d => Math.max(0, _xScale(d.x1) - _xScale(d.x0) - 2))
        .attr("y", d => _yScale(d.length))
        .attr("height", d => _height - _yScale(d.length));
}

/* ---- Tooltip ---- */
const _tooltip = document.getElementById("tooltip");

function _onBarHover(event, d) {
    _tooltip.innerHTML = `
    <div class="tooltip-range">${d3.format(",")(Math.round(d.x0))} – ${d3.format(",")(Math.round(d.x1))} kWh/yr</div>
    <div class="tooltip-row"><span>Frequency</span><span>${d.length.toLocaleString()}</span></div>
    <div class="tooltip-row"><span>Avg energy</span><span>${d.length ? d3.mean(d, ACCESSORS.energy).toFixed(0) : "—"} kWh</span></div>
  `;
    _tooltip.classList.add("visible");
    _tooltip.style.left = `${event.clientX + 14}px`;
    _tooltip.style.top = `${event.clientY - 10}px`;
}

function _onBarLeave() {
    _tooltip.classList.remove("visible");
}

/* ============================================
   Bootstrap
   ============================================ */
(async () => {
    try {
        const data = await loadTVData();
        document.getElementById("loading-msg")?.remove();
        window._tvData = data;
        initHistogram(data);
        initFilters(data);
    } catch (err) {
        const msg = document.getElementById("loading-msg");
        if (msg) msg.textContent = "⚠ Could not load data. Check the console.";
        console.error("[Histogram]", err);
    }
})();