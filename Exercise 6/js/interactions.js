/* ============================================
   INTERACTIONS.JS — Pill Filter Logic
   ============================================ */

/* Active filter state */
const _state = {
    tech: "all",   // "all" | "LED" | "LCD" | "OLED" | ...
    sizeMin: 0,       // lower bound (inclusive) for size range
    sizeMax: Infinity // upper bound (inclusive) for size range
};

/**
 * initFilters — populates pill rows from live data, wires click events.
 * Called by histogram.js bootstrap after data loads.
 */
function initFilters(data) {
    _buildTechPills(data);
    _buildSizeRangePills(data);
    _wireClicks();
}

/* ============================================
   Pill builders
   ============================================ */

function _buildTechPills(data) {
    const techs = Array.from(new Set(data.map(ACCESSORS.tech))).sort();
    const row = document.getElementById("filter-tech-row");

    techs.forEach(tech => {
        const btn = _makePill(tech, "tech", tech);
        row.appendChild(btn);
    });
}

/**
 * _buildSizeRangePills
 * 1. Finds the true min and max screen size in the data.
 * 2. Walks CONFIG.sizeBreakpoints to produce labelled range buckets.
 * 3. Only renders a pill if at least one row falls in that range.
 */
function _buildSizeRangePills(data) {
    const sizes = data.map(ACCESSORS.size);
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);

    console.log(`%c[TV Data] Screen sizes span ${minSize}" – ${maxSize}"`,
        "color: #d4780a; font-weight: bold;");

    const bp = CONFIG.sizeBreakpoints;
    const row = document.getElementById("filter-size-row");

    /* Build one bucket per consecutive pair of breakpoints, plus an open-ended last bucket */
    for (let i = 0; i < bp.length; i++) {
        const lo = bp[i];
        const hi = i + 1 < bp.length ? bp[i + 1] - 1 : Infinity;

        /* Clamp to data's actual range so we don't show empty buckets */
        const effectiveLo = Math.max(lo, minSize);
        const effectiveHi = hi === Infinity ? maxSize : Math.min(hi, maxSize);

        /* Skip if nothing in data falls here */
        if (effectiveLo > effectiveHi) continue;
        const count = data.filter(d => {
            const s = ACCESSORS.size(d);
            return s >= effectiveLo && s <= effectiveHi;
        }).length;
        if (count === 0) continue;

        /* Label */
        const label = hi === Infinity || effectiveHi === maxSize
            ? `${effectiveLo}" – ${effectiveHi}"`
            : `${effectiveLo}" – ${effectiveHi}"`;

        /* Encode range as "lo:hi" in data-value */
        const btn = _makePill(label, "size", `${effectiveLo}:${effectiveHi}`);
        row.appendChild(btn);
    }

    console.log("[TV Data] Size range pills created.");
}

function _makePill(label, group, value) {
    const btn = document.createElement("button");
    btn.className = "pill";
    btn.dataset.group = group;
    btn.dataset.value = value;
    btn.textContent = label;
    return btn;
}

/* ============================================
   Event wiring
   ============================================ */

function _wireClicks() {
    document.getElementById("filter-tech-row").addEventListener("click", e => {
        const btn = e.target.closest(".pill");
        if (!btn) return;
        _setActivePill("filter-tech-row", btn);
        _state.tech = btn.dataset.value;   // "all" or tech string
        _applyFilters();
    });

    document.getElementById("filter-size-row").addEventListener("click", e => {
        const btn = e.target.closest(".pill");
        if (!btn) return;
        _setActivePill("filter-size-row", btn);

        if (btn.dataset.value === "all") {
            _state.sizeMin = 0;
            _state.sizeMax = Infinity;
        } else {
            const [lo, hi] = btn.dataset.value.split(":").map(Number);
            _state.sizeMin = lo;
            _state.sizeMax = hi;
        }
        _applyFilters();
    });
}

function _setActivePill(rowId, activeBtn) {
    document.querySelectorAll(`#${rowId} .pill`).forEach(p => p.classList.remove("active"));
    activeBtn.classList.add("active");
}

/* ============================================
   Filter Functions
   ============================================ */

/**
 * filterByTech — single-value match; "all" is a pass-through.
 */
function filterByTech(data, tech) {
    if (tech === "all") return data;
    return data.filter(d => d.screenTech === tech);
}

/**
 * filterBySize — inclusive range filter using sizeMin / sizeMax.
 */
function filterBySize(data, min, max) {
    if (min === 0 && max === Infinity) return data;
    return data.filter(d => {
        const s = ACCESSORS.size(d);
        return s >= min && s <= max;
    });
}

/**
 * _applyFilters — chains active filters and redraws histogram.
 */
function _applyFilters() {
    let result = window._tvData;
    result = filterByTech(result, _state.tech);
    result = filterBySize(result, _state.sizeMin, _state.sizeMax);
    console.log(`%c[TV Data] Filtered → ${result.length} records (tech: ${_state.tech}, size: ${_state.sizeMin}"–${_state.sizeMax === Infinity ? "∞" : _state.sizeMax + '"'})`,
        "color: #d4780a;");
    updateHistogram(result);
}

/* Expose for debugging / extension */
window.filterByTech = filterByTech;
window.filterBySize = filterBySize;
window.initFilters = initFilters;