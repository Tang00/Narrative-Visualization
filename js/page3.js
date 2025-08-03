(async function () {
  const svg = d3.select("#table"),
    margin = { top: 40, right: 20, bottom: 120, left: 80 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

  const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const rawData = (
    await d3.csv("data/car_prices.csv", (d) => {
      return {
        make: d.make,
        model: d.model,
        odometer: +d.odometer,
        sellingprice: +d.sellingprice,
      };
    })
  ).filter((d) => d.odometer < 350000);

  const uniqueCombos = Array.from(
    new Set(rawData.map((d) => `${d.make}|${d.model}`))
  ).sort();

  const dropdown = d3.select("#makeModelDropdown");
  dropdown
    .selectAll("option")
    .data(["", ...uniqueCombos])
    .join("option")
    .attr("value", (d) => d)
    .text((d) => (d ? d.replace("|", " ") : "Select a Make & Model"));

  const x = d3.scaleLinear().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);
  const xAxisGroup = chart
    .append("g")
    .attr("transform", `translate(0,${height})`);
  const yAxisGroup = chart.append("g");

  chart
    .append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 30)
    .text("Odometer Reading (miles)");

  chart
    .append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -height / 2)
    .attr("y", -60)
    .text("Average Selling Price ($)");

  function updateChart(makeModel) {
    if (!makeModel) return;

    const [make, model] = makeModel.split("|");
    const filtered = rawData.filter(
      (d) => d.make === make && d.model === model
    );

    const binSize = 10000;

    const binGenerator = d3
      .bin()
      .value((d) => d.odometer)
      .thresholds(d3.range(0, 350000 + binSize, binSize))(filtered);

    const avgData = binGenerator
      .filter((bin) => bin.length)
      .map((bin) => ({
        binMid: (bin.x0 + bin.x1) / 2,
        avgPrice: d3.mean(bin, (d) => d.sellingprice),
      }));

    x.domain([0, 350000]);
    y.domain([0, d3.max(avgData, (d) => d.avgPrice)]).nice();

    xAxisGroup.call(
      d3
        .axisBottom(x)
        .ticks(10)
        .tickFormat((d) => `${d / 1000}k`)
    );
    yAxisGroup.call(d3.axisLeft(y));

    chart.selectAll("path.line").remove();
    chart.selectAll("circle.point").remove();

    const line = d3
      .line()
      .x((d) => x(d.binMid))
      .y((d) => y(d.avgPrice));

    chart
      .append("path")
      .datum(avgData)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 3)
      .attr("d", line);

    chart
      .selectAll("circle.point")
      .data(avgData)
      .join("circle")
      .attr("class", "point")
      .attr("cx", (d) => x(d.binMid))
      .attr("cy", (d) => y(d.avgPrice))
      .attr("r", 4)
      .attr("fill", "blue")
      .append("title")
      .text(
        (d) =>
          `Odometer: ${Math.round(d.binMid)}\nAvg Price: $${d.avgPrice.toFixed(
            0
          )}`
      );
  }

  d3.select("#makeModelDropdown").property("value", "Ford|F-150");
  updateChart("Ford|F-150")

  dropdown.on("change", function () {
    updateChart(this.value);
  });
})();
