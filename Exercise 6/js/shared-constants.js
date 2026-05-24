/* ============================================
   SHARED-CONSTANTS.JS
   ============================================ */

const CONFIG = {
  margin:              { top: 20, right: 24, bottom: 60, left: 68 },
  binCount:            20,
  transitionDuration:  400,
  dataPath:            "data/Ex6_TVdata.csv",
  xLabel:              "Labeled Energy Consumption (kWh/year)",
  yLabel:              "Frequency",
  scatterYLabel:       "Screen Size (inches)",
};

const ACCESSORS = {
  energy: d => d.energyConsumption,
  size:   d => d.screenSize,
  brand:  d => d.brand,
  model:  d => d.model,
  tech:   d => d.screenTech,
  star:   d => d.star,
};

/* Colour per screen technology */
const TECH_COLOURS = {
  LED:     "#d4780a",
  LCD:     "#4a90d9",
  OLED:    "#2dbe7a",
  QLED:    "#9b59b6",
  PLASMA:  "#e74c3c",
  DEFAULT: "#999999",
};

function getTechColour(tech) {
  return TECH_COLOURS[(tech || "").toUpperCase()] || TECH_COLOURS.DEFAULT;
}

window.CONFIG         = CONFIG;
window.ACCESSORS      = ACCESSORS;
window.TECH_COLOURS   = TECH_COLOURS;
window.getTechColour  = getTechColour;