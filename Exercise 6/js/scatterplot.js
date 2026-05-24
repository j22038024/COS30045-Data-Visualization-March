/* ============================================
   SCATTERPLOT.JS
   X: Energy Consumption (kWh/year)  — shares
      domain with histogram's _xScale
   Y: Screen Size (inches)
   Colour: Screen Technology
   ============================================ */

let _scatterSvg, _sxScale, _syScale, _dotsGroup;
let _sWidth, _sHeight;

/* ---- Init ---- */
function initScatter(data) {
  const container = document.getElementById("scatter-container");
  const { margin } = CONFIG;

  _sWidth  = container.clientWidth - margin.left - margin.right;
  _sHeight = 260;

  _scatterSvg = d3.select("#scatter-container")
    .append("svg")
    .attr("class", "scatter-svg")
    .attr("width",  _sWidth  + margin.left + margin.right)
    .attr("height", _sHeight + margin.top  + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  /* X — same domain as histogram for visual alignment */
  _sxScale = d3.scaleLinear()
    .domain(_xScale.domain())
    .range([0, _sWidth]);

  /* Y — screen size, padded slightly */
  const [yMin, yMax] = d3.extent(data, ACCESSORS.size);
  _syScale = d3.scaleLinear()
    .domain([Math.max(0, yMin - 4), yMax + 4]).nice()
    .range([_sHeight, 0]);

  /* X axis */
  _scatterSvg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(0,${_sHeight})`)
    .call(
      d3.axisBottom(_sxScale)
        .ticks(8)
        .tickFormat(d => d === 0 ? "0" : d3.format(",")(d))
    );

  /* X axis label */
  _scatterSvg.append("text")
    .attr("class", "axis-label")
    .attr("x", _sWidth / 2)
    .attr("y", _sHeight + 50)
    .attr("text-anchor", "middle")
    .text(CONFIG.xLabel);

  /* Y axis */
  const yAxisG = _scatterSvg.append("g")
    .attr("class", "axis axis--y")
    .call(
      d3.axisLeft(_syScale)
        .ticks(6)
        .tickSize(-_sWidth)
        .tickFormat(d => `${d}"`)
    );
  yAxisG.selectAll(".tick line").attr("stroke", "var(--border-light)");
  yAxisG.select(".domain").remove();

  /* Y axis label */
  _scatterSvg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -_sHeight / 2)
    .attr("y", -52)
    .attr("text-anchor", "middle")
    .text(CONFIG.scatterYLabel);

  /* Dots group */
  _dotsGroup = _scatterSvg.append("g").attr("class", "dots-group");

  /* Legend — one swatch per tech type found in the data */
  _buildLegend(data);

  updateScatter(data);
}

/* ---- Legend ---- */
function _buildLegend(data) {
  const techs   = Array.from(new Set(data.map(ACCESSORS.tech))).sort();
  const itemW   = 80;
  const totalW  = techs.length * itemW;
  const offsetX = _sWidth - totalW + itemW * 0.5;

  const legendG = _scatterSvg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${offsetX}, ${-16})`);

  techs.forEach((tech, i) => {
    const g = legendG.append("g")
      .attr("transform", `translate(${i * itemW}, 0)`);

    g.append("circle")
      .attr("r", 5)
      .attr("fill", getTechColour(tech));

    g.append("text")
      .attr("x", 10).attr("y", 4)
      .attr("class", "legend-item")
      .style("font-family", "var(--font)")
      .style("font-size", "12px")
      .style("fill", "var(--text-secondary)")
      .text(tech);
  });
}

/* ---- Update (called on every filter change) ---- */
function updateScatter(filteredData) {
  _scatterSvg.select(".no-data-msg-s").remove();

  if (filteredData.length === 0) {
    _dotsGroup.selectAll(".dot").remove();
    _scatterSvg.append("text")
      .attr("class", "no-data-msg no-data-msg-s")
      .attr("x", _sWidth / 2).attr("y", _sHeight / 2)
      .attr("text-anchor", "middle")
      .text("No data matches the current filters.");
    return;
  }

  /* Unique key: brand + model + energy (handles duplicates gracefully) */
  const key = d => `${d.brand}|${d.model}|${d.energyConsumption}|${d.screenSize}`;

  const dots = _dotsGroup.selectAll(".dot").data(filteredData, key);

  /* EXIT */
  dots.exit()
    .transition().duration(CONFIG.transitionDuration)
    .attr("r", 0).remove();

  /* ENTER */
  dots.enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx",   d => _sxScale(ACCESSORS.energy(d)))
    .attr("cy",   d => _syScale(ACCESSORS.size(d)))
    .attr("r",    0)
    .attr("fill", d => getTechColour(ACCESSORS.tech(d)))
    .on("mousemove",  _onDotHover)
    .on("mouseleave", _onDotLeave)
  /* ENTER + UPDATE */
  .merge(dots)
    .transition().duration(CONFIG.transitionDuration).ease(d3.easeCubicOut)
    .attr("cx",   d => _sxScale(ACCESSORS.energy(d)))
    .attr("cy",   d => _syScale(ACCESSORS.size(d)))
    .attr("r",    4)
    .attr("fill", d => getTechColour(ACCESSORS.tech(d)));
}

/* ---- Tooltip ---- */
const _sTooltip = document.getElementById("tooltip");

function _onDotHover(event, d) {
  const stars    = d.star !== null ? "★".repeat(d.star) + "☆".repeat(Math.max(0, 6 - d.star)) : "—";
  _sTooltip.innerHTML = `
    <div class="tooltip-title">${d.brand} ${d.model}</div>
    <div class="tooltip-row"><span>Screen size</span>  <span>${d.screenSize}"</span></div>
    <div class="tooltip-row"><span>Technology</span>   <span>${d.screenTech}</span></div>
    <div class="tooltip-row"><span>Energy</span>       <span>${d.energyConsumption} kWh/yr</span></div>
    <div class="tooltip-row"><span>Star rating</span>  <span>${stars}</span></div>
  `;
  _sTooltip.classList.add("visible");
  _sTooltip.style.left = `${event.clientX + 14}px`;
  _sTooltip.style.top  = `${event.clientY - 10}px`;
}
function _onDotLeave() { _sTooltip.classList.remove("visible"); }

window.initScatter   = initScatter;
window.updateScatter = updateScatter;