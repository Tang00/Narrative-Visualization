(async function () {
  const svg = d3.select("#table"),
    margin = { top: 40, right: 20, bottom: 120, left: 80 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

  const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  chart.selectAll(".annotation-group").remove();
  const annotationLayer = chart.append("g").attr("class", "annotation-group");

  const rawData = (
    await d3.csv("data/car_prices.csv", (d) => {
      return {
        odometer: +d.odometer,
        sellingprice: +d.sellingprice,
      };
    })
  ).filter((d) => d.odometer < 350000);

  const binSize = 10000;

  const binGenerator = d3
    .bin()
    .value((d) => d.odometer)
    .thresholds(d3.range(0, 350000 + binSize, binSize));

  const binsRaw = binGenerator(rawData);

  const bins = binsRaw
    .filter((bin) => bin.length)
    .map((bin) => ({
      binStart: bin.x0,
      avgPrice: d3.mean(bin, (d) => d.sellingprice),
    }));

  const x = d3.scaleLinear().domain([0, 350000]).range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(bins, (d) => d.avgPrice)])
    .nice()
    .range([height, 0]);

  chart
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(bins.length)
        .tickFormat((d) => `${d / 1000}k`)
    )
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  chart.append("g").call(d3.axisLeft(y));

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

  const line = d3
    .line()
    .x((d) => x(d.binStart + binSize / 2))
    .y((d) => y(d.avgPrice));

  chart
    .append("path")
    .datum(bins)
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 3)
    .attr("d", line);

  chart
    .selectAll("circle")
    .data(bins)
    .join("circle")
    .attr("cx", (d) => x(d.binStart + binSize / 2))
    .attr("cy", (d) => y(d.avgPrice))
    .attr("r", (d) => (d.binStart === 200000 ? 6 : 4))
    .attr("fill", (d) => (d.binStart === 200000 ? "orange" : "blue"))
    .append("title")
    .text(
      (d) =>
        `Odometer: ${d.binStart} - ${
          d.binStart + binSize
        } miles\nAvg Price: $${d.avgPrice.toFixed(0)}`
    );

  const annotations = [
    {
      note: {
        label: "Price drop tends to plateau around $2,500",
        wrap: 200,
      },
      type: d3.annotationLabel,
      x: x(205000),
      y: y(2500),
      dx: 40,
      dy: -50,
    },
  ];

  const makeAnnotations = d3.annotation().annotations(annotations);
  annotationLayer.call(makeAnnotations);
})();
