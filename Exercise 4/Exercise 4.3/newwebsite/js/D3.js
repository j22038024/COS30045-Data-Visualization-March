
const svg = d3.select(".responsive-svg-container")
    .append("svg")
    .attr("viewBox", "0 0 1200 1600")
    .style("border", "1px white solid");


svg
    .append("rect")
    .attr("x", 10)
    .attr("y", 10)
    .attr("width", 414)
    .attr("height", 16)
    .attr("fill", "blue");

d3.csv("data/data.csv", d => {
    return {
        brand: d.Brand,
        mean: +d["Mean(Star2)"] //=> converts to number
    };

}).then(data => {
    console.log(data);
})
