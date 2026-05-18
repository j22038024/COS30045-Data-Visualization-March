/* ═══════════════════════════════════════════════════════════
   PowerSmart AU — D3.js
   ═══════════════════════════════════════════════════════════ */

const margin = { top: 60, right: 320, bottom: 80, left: 300 };
const svgWidth = 1100;
const svgHeight = 1600;
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

// ── 1. Create SVG ──────────────────────────────────────────
const svg = d3.select(".responsive-svg-container")
    .append("svg")
    .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
    .style("border", "1px white solid")


// DEBUG banner

const chart = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// ── 2. Load CSV ─────────────────────────────────────────────
d3.csv("data/data.csv", d => ({
    brand: d.Brand,
    mean: +d["Mean(Star2)"]
}))
    .then(data => {
        svg.select("rect").attr("fill", "green");
        svg.select("text").text(`CSV loaded — ${data.length} rows`);

        data.sort((a, b) => b.mean - a.mean);

        // ── 3. Scales ────────────────────────────────────────
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.mean) * 1.05])
            .range([0, width]);

        const yScale = d3.scaleBand()
            .domain(data.map(d => d.brand))
            .range([0, height])
            .padding(0.25);

        // ── 4. Gridlines ─────────────────────────────────────
        chart.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(""))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("line")
                .attr("stroke", "rgba(255,255,255,0.1)")
                .attr("stroke-dasharray", "3,3"));

        // ── 5. Axes ───────────────────────────────────────────
        chart.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale).ticks(6))
            .call(g => g.select(".domain").attr("stroke", "rgba(255,255,255,0.4)"))
            .call(g => g.selectAll("text").attr("fill", "#ccc").attr("font-size", "14px"))
            .call(g => g.selectAll("line").attr("stroke", "rgba(255,255,255,0.3)"));

        chart.append("g")
            .call(d3.axisLeft(yScale))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").attr("fill", "#ddd").attr("font-size", "13px"))
            .call(g => g.selectAll("line").remove());

        // ── 6. Bars — one <rect> per CSV row ─────────────────
        // NOTE: class is "chart-bar" not "bar" — avoids conflict
        // with the CSS .bar rule used by the home page HTML chart
        chart.selectAll("rect.chart-bar")
            .data(data)
            .join("rect")
            .attr("class", "chart-bar")   // ← "chart-bar" not "bar"
            .attr("x", 0)
            .attr("y", d => yScale(d.brand))
            .attr("width", d => xScale(d.mean))
            .attr("height", yScale.bandwidth())
            .attr("fill", "#63b3ed")
            .attr("rx", 3);

        // ── 7. Value labels ───────────────────────────────────
        chart.selectAll("text.label")
            .data(data)
            .join("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.mean) + 8)
            .attr("y", d => yScale(d.brand) + yScale.bandwidth() / 2 + 5)
            .attr("fill", "#ccc").attr("font-size", "13px")
            .text(d => d.mean.toFixed(2));

        // ── 8. Titles ─────────────────────────────────────────
        svg.append("text")
            .attr("x", svgWidth / 2).attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "white").attr("font-size", "22px").attr("font-weight", "bold")
            .text("Mean Star Rating by TV Brand");

        svg.append("text")
            .attr("x", margin.left + width / 2).attr("y", svgHeight - 20)
            .attr("text-anchor", "middle")
            .attr("fill", "#aaa").attr("font-size", "15px")
            .text("Mean Star Rating (Star²)");
    })
    .catch(err => {
        console.error("CSV load failed:", err);
        svg.select("rect").attr("fill", "red");
        svg.select("text").text("CSV failed — open via Live Server, not file://");
    });