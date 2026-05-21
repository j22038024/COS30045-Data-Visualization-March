/* ============================================
   INTERACTIONS.JS — Pill + Range Slider Logic
   ============================================ */

const _state = {
    tech: "all",
    sizeMin: 0,
    sizeMax: Infinity,
};

function initFilters(data) {
    _buildTechPills(data);
    _buildSizeSlider(data);
    _wireClicks();
}

/* ============================================
   Tech Pills
   ============================================ */

function _buildTechPills(data) {
    const techs = Array.from(new Set(data.map(ACCESSORS.tech))).sort();
    const row = document.getElementById("filter-tech-row");
    techs.forEach(tech => row.appendChild(_makePill(tech, "tech", tech)));
}

function _makePill(label, group, value) {
    const btn = document.createElement("button");
    btn.className = "pill";
    btn.dataset.group = group;
    btn.dataset.value = value;
    btn.textContent = label;
    return btn;
}

function _setActivePill(rowId, activeBtn) {
    document.querySelectorAll(`#${rowId} .pill`).forEach(p => p.classList.remove("active"));
    activeBtn.classList.add("active");
}

/* ============================================
   Dual Range Slider
   ============================================ */

function _buildSizeSlider(data) {
    const sizes = data.map(ACCESSORS.size);
    const minSize = Math.floor(Math.min(...sizes));
    const maxSize = Math.ceil(Math.max(...sizes));

    _state.sizeMin = minSize;
    _state.sizeMax = maxSize;

    console.log(`%c[TV Data] Screen sizes span ${minSize}" – ${maxSize}"`,
        "color: #d4780a; font-weight: bold;");

    const wrap = document.getElementById("size-slider-wrap");

    wrap.innerHTML = `
    <div class="slider-header">
      <span class="slider-label">Screen Size</span>
      <span class="slider-value" id="slider-value">${minSize}" – ${maxSize}"</span>
    </div>
    <div class="slider-track-wrap">
      <div class="slider-track" id="slider-track"></div>
      <input type="range" class="range-input" id="range-min"
             min="${minSize}" max="${maxSize}" value="${minSize}" step="1">
      <input type="range" class="range-input" id="range-max"
             min="${minSize}" max="${maxSize}" value="${maxSize}" step="1">
    </div>
  `;

    const rangeMin = document.getElementById("range-min");
    const rangeMax = document.getElementById("range-max");
    const track = document.getElementById("slider-track");
    const valueLabel = document.getElementById("slider-value");

    function updateSlider() {
        let lo = parseInt(rangeMin.value);
        let hi = parseInt(rangeMax.value);

        /* Prevent handles crossing */
        if (lo > hi) {
            if (this === rangeMin) { lo = hi; rangeMin.value = lo; }
            else { hi = lo; rangeMax.value = hi; }
        }

        /* Fill track between handles */
        const pct = (v) => ((v - minSize) / (maxSize - minSize)) * 100;
        track.style.left = `${pct(lo)}%`;
        track.style.width = `${pct(hi) - pct(lo)}%`;

        valueLabel.textContent = lo === hi ? `${lo}"` : `${lo}" – ${hi}"`;

        _state.sizeMin = lo;
        _state.sizeMax = hi;
        _applyFilters();
    }

    rangeMin.addEventListener("input", updateSlider);
    rangeMax.addEventListener("input", updateSlider);

    /* Initial track fill */
    const pct = (v) => ((v - minSize) / (maxSize - minSize)) * 100;
    track.style.left = `${pct(minSize)}%`;
    track.style.width = `${pct(maxSize) - pct(minSize)}%`;
}

/* ============================================
   Event wiring
   ============================================ */

function _wireClicks() {
    document.getElementById("filter-tech-row").addEventListener("click", e => {
        const btn = e.target.closest(".pill");
        if (!btn) return;
        _setActivePill("filter-tech-row", btn);
        _state.tech = btn.dataset.value;
        _applyFilters();
    });
}

/* ============================================
   Filter Functions
   ============================================ */

function filterByTech(data, tech) {
    if (tech === "all") return data;
    return data.filter(d => d.screenTech === tech);
}

function filterBySize(data, min, max) {
    return data.filter(d => {
        const s = ACCESSORS.size(d);
        return s >= min && s <= max;
    });
}

function _applyFilters() {
    let result = window._tvData;
    result = filterByTech(result, _state.tech);
    result = filterBySize(result, _state.sizeMin, _state.sizeMax);
    console.log(
        `%c[TV Data] ${result.length} records — tech: ${_state.tech}, size: ${_state.sizeMin}"–${_state.sizeMax}"`,
        "color: #d4780a;"
    );
    updateHistogram(result);
}

window.filterByTech = filterByTech;
window.filterBySize = filterBySize;
window.initFilters = initFilters;