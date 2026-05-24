/* ============================================
   INTERACTIONS.JS

   Each chart has its own independent filter state:

   HISTOGRAM
     · tech pills  → #filter-tech-hist
     · energy slider

   SCATTER
     · tech pills  → #filter-tech-scatter
     · size slider

   Changing a histogram filter only redraws the
   histogram; changing a scatter filter only
   redraws the scatter.
   ============================================ */

const _histState = {
  tech:      "all",
  energyMin: 0,
  energyMax: Infinity,
};

const _scatterState = {
  tech:    "all",
  sizeMin: 0,
  sizeMax: Infinity,
};

/* ============================================
   Entry point
   ============================================ */
function initFilters(data) {
  _buildTechPills(data, "filter-tech-hist",    "tech-hist");
  _buildTechPills(data, "filter-tech-scatter", "tech-scatter");
  _buildEnergySlider(data);
  _buildSizeSlider(data);
  _wireClicks();
}

/* ============================================
   Tech pills  (shared builder, two instances)
   ============================================ */
function _buildTechPills(data, rowId, group) {
  const techs = Array.from(new Set(data.map(ACCESSORS.tech))).sort();
  const row   = document.getElementById(rowId);
  techs.forEach(tech => {
    const btn = document.createElement("button");
    btn.className     = "pill";
    btn.dataset.group = group;
    btn.dataset.value = tech;
    btn.textContent   = tech;
    row.appendChild(btn);
  });
}

function _setActivePill(rowId, activeBtn) {
  document.querySelectorAll(`#${rowId} .pill`).forEach(p => p.classList.remove("active"));
  activeBtn.classList.add("active");
}

/* ============================================
   Slider factory
   ============================================ */
function _buildSlider(containerId, minVal, maxVal, labelFn, onChangeFn, idPrefix) {
  const wrap = document.getElementById(containerId);

  wrap.innerHTML = `
    <div class="slider-header">
      <span class="slider-label">${wrap.dataset.label || ""}</span>
      <span class="slider-value" id="${idPrefix}-value">${labelFn(minVal, maxVal)}</span>
    </div>
    <div class="slider-track-wrap">
      <div class="slider-track" id="${idPrefix}-track"></div>
      <input type="range" class="range-input" id="${idPrefix}-min"
             min="${minVal}" max="${maxVal}" value="${minVal}" step="1">
      <input type="range" class="range-input range-max" id="${idPrefix}-max"
             min="${minVal}" max="${maxVal}" value="${maxVal}" step="1">
    </div>
  `;

  const elMin   = document.getElementById(`${idPrefix}-min`);
  const elMax   = document.getElementById(`${idPrefix}-max`);
  const track   = document.getElementById(`${idPrefix}-track`);
  const display = document.getElementById(`${idPrefix}-value`);
  const pct     = v => ((v - minVal) / (maxVal - minVal)) * 100;

  track.style.left  = "0%";
  track.style.width = "100%";

  function onInput() {
    let lo = parseInt(elMin.value);
    let hi = parseInt(elMax.value);
    if (lo > hi) {
      if (this === elMin) { lo = hi; elMin.value = lo; }
      else                { hi = lo; elMax.value = hi; }
    }
    track.style.left    = `${pct(lo)}%`;
    track.style.width   = `${pct(hi) - pct(lo)}%`;
    display.textContent = labelFn(lo, hi);
    onChangeFn(lo, hi);
  }

  elMin.addEventListener("input", onInput);
  elMax.addEventListener("input", onInput);
}

/* ---- Energy slider (histogram card) ---- */
function _buildEnergySlider(data) {
  const vals = data.map(ACCESSORS.energy);
  const lo   = Math.floor(Math.min(...vals));
  const hi   = Math.ceil (Math.max(...vals));
  _histState.energyMin = lo;
  _histState.energyMax = hi;

  _buildSlider(
    "energy-slider-wrap",
    lo, hi,
    (a, b) => `${a.toLocaleString()} – ${b.toLocaleString()} kWh/yr`,
    (a, b) => { _histState.energyMin = a; _histState.energyMax = b; _applyHistogram(); },
    "energy"
  );
}

/* ---- Size slider (scatter card) ---- */
function _buildSizeSlider(data) {
  const vals = data.map(ACCESSORS.size);
  const lo   = Math.floor(Math.min(...vals));
  const hi   = Math.ceil (Math.max(...vals));
  _scatterState.sizeMin = lo;
  _scatterState.sizeMax = hi;

  _buildSlider(
    "size-slider-wrap",
    lo, hi,
    (a, b) => a === b ? `${a}"` : `${a}" – ${b}"`,
    (a, b) => { _scatterState.sizeMin = a; _scatterState.sizeMax = b; _applyScatter(); },
    "size"
  );
}

/* ============================================
   Click wiring
   ============================================ */
function _wireClicks() {
  /* Histogram tech pills */
  document.getElementById("filter-tech-hist").addEventListener("click", e => {
    const btn = e.target.closest(".pill");
    if (!btn) return;
    _setActivePill("filter-tech-hist", btn);
    _histState.tech = btn.dataset.value;
    _applyHistogram();
  });

  /* Scatter tech pills */
  document.getElementById("filter-tech-scatter").addEventListener("click", e => {
    const btn = e.target.closest(".pill");
    if (!btn) return;
    _setActivePill("filter-tech-scatter", btn);
    _scatterState.tech = btn.dataset.value;
    _applyScatter();
  });
}

/* ============================================
   Filter functions
   ============================================ */

function filterByTech(data, tech) {
  if (tech === "all") return data;
  return data.filter(d => d.screenTech === tech);
}

function filterByEnergy(data, min, max) {
  return data.filter(d => { const e = ACCESSORS.energy(d); return e >= min && e <= max; });
}

function filterBySize(data, min, max) {
  return data.filter(d => { const s = ACCESSORS.size(d); return s >= min && s <= max; });
}

/* ============================================
   Apply — one function per chart
   ============================================ */

function _applyHistogram() {
  let result = window._tvData;
  result = filterByTech  (result, _histState.tech);
  result = filterByEnergy(result, _histState.energyMin, _histState.energyMax);

  const counter = document.getElementById("record-count-hist");
  if (counter) counter.textContent = `${result.length.toLocaleString()} records`;

  console.log(
    `%c[Histogram] ${result.length} records | tech: ${_histState.tech} | ` +
    `energy: ${_histState.energyMin}–${_histState.energyMax} kWh`,
    "color:#d4780a;"
  );
  updateHistogram(result);
}

function _applyScatter() {
  let result = window._tvData;
  result = filterByTech(result, _scatterState.tech);
  result = filterBySize(result, _scatterState.sizeMin, _scatterState.sizeMax);

  const counter = document.getElementById("record-count-scatter");
  if (counter) counter.textContent = `${result.length.toLocaleString()} records`;

  console.log(
    `%c[Scatter] ${result.length} records | tech: ${_scatterState.tech} | ` +
    `size: ${_scatterState.sizeMin}"–${_scatterState.sizeMax}"`,
    "color:#4a90d9;"
  );
  updateScatter(result);
}

/* Expose */
window.filterByTech   = filterByTech;
window.filterByEnergy = filterByEnergy;
window.filterBySize   = filterBySize;
window.initFilters    = initFilters;