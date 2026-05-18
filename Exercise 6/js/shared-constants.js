/* ============================================
   SHARED-CONSTANTS.JS — App-wide Constants
   ============================================ */

const CONFIG = {
    /* Chart margins */
    margin: { top: 20, right: 24, bottom: 60, left: 68 },

    /* Histogram */
    binCount: 20,

    /* Animation */
    transitionDuration: 400,

    /* Data path (relative to index.html) */
    dataPath: "data/Ex6_TVdata.csv",

    /* Axis labels */
    xLabel: "Labeled Energy Consumption (kWh/year)",
    yLabel: "Frequency",

    /**
     * Breakpoints used to auto-generate size range pills.
     * Ranges become: [bp[i] .. bp[i+1]-1], with the last bucket open-ended.
     * Only ranges that contain at least one data row are shown.
     * Adjust these to suit the spread in your CSV.
     *
     *  ≤ 32"   → small / bedroom TVs
     *  33–43"  → mid-size
     *  44–55"  → large
     *  56–65"  → XL
     *  66–75"  → XXL
     *  76"+    → cinema / commercial
     */
    sizeBreakpoints: [0, 33, 44, 56, 66, 76],
};

const ACCESSORS = {
    energy: d => d.energyConsumption,
    size: d => d.screenSize,
    brand: d => d.brand,
    tech: d => d.screenTech,
    star: d => d.star,
};

window.CONFIG = CONFIG;
window.ACCESSORS = ACCESSORS;