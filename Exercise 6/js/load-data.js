/* ============================================
   LOAD-DATA.JS — CSV Loading & Parsing
   ============================================ */

/**
 * Loads Ex6_TVdata.csv and returns a cleaned array.
 * Columns: brand, model, screenSize, screenTech, energyConsumption, star
 */
async function loadTVData() {
    const raw = await d3.csv(CONFIG.dataPath, row => {
        const energy = +row.energyConsumption;
        const size = +row.screenSize;
        const star = +row.star;

        if (isNaN(energy) || isNaN(size)) return null;

        return {
            brand: (row.brand || "Unknown").trim(),
            model: (row.model || "Unknown").trim(),
            screenSize: size,
            screenTech: (row.screenTech || "Unknown").trim(),
            energyConsumption: energy,
            star: isNaN(star) ? null : star,
        };
    });

    const clean = raw.filter(d => d !== null);

    console.log(`%c[TV Data] Loaded ${clean.length} records`, "color: #d4780a; font-weight: bold;");
    console.table(clean.slice(0, 10));   // preview first 10 rows
    console.log("[TV Data] Full dataset:", clean);

    return clean;
}

window.loadTVData = loadTVData;