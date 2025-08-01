(async function () {
  const svg = d3.select("#table"),
    margin = { top: 40, right: 20, bottom: 120, left: 80 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

  const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  const annotationLayer = chart.append("g").attr("class", "annotation-group");

  const rawData = (
    await d3.csv("data/car_prices.csv", (d) => {
      const saleDate = new Date(d.saledate);
      return {
        year: +d.year,
        make: d.make,
        model: d.model,
        body: d.body,
        transmission: d.transmission,
        state: d.state,
        condition: +d.condition,
        odometer: +d.odometer,
        sellingprice: +d.sellingprice,
        saledate: saleDate,
      };
    })
  ).filter((d) => d.year >= 1990 && d.year < 2015);

  const x = d3.scaleBand().range([0, width]).padding(0.3);
  const y = d3.scaleLinear().range([height, 0]);
  const xAxisGroup = chart
    .append("g")
    .attr("transform", `translate(0,${height})`);
  const yAxisGroup = chart.append("g");

  chart.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 30)
    .text("Year");

  chart.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -height / 2)
    .attr("y", -60)
    .text("Average Selling Price ($)");

  
  const data = Array.from(
    d3.rollup(
      rawData,
      (v) => d3.mean(v, (d) => d.sellingprice),
      (d) => d.year
    ),
    ([year, avg_price]) => ({ year, avg_price })
  ).sort((a, b) => a.year - b.year);

  x.domain(data.map((d) => d.year));
  y.domain([0, d3.max(data, (d) => d.avg_price)]).nice();

  xAxisGroup
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  yAxisGroup.call(d3.axisLeft(y));

  const line = d3
    .line()
    .x((d) => x(d.year) + x.bandwidth() / 2)
    .y((d) => y(d.avg_price));

  chart
    .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 3)
    .attr("d", line);

  chart
    .selectAll("circle.point")
    .data(data)
    .join("circle")
    .attr("class", "point")
    .attr("cx", (d) => x(d.year) + x.bandwidth() / 2)
    .attr("cy", (d) => y(d.avg_price))
    .attr("r", (d) => (d.year === 2011 ? 6 : 4))
    .attr("fill", (d) => (d.year === 2011 ? "orange" : "blue"))
    .append("title")
    .text((d) => `${d.year}: $${d.avg_price.toFixed(0)}`);

  const year2011 = data.find((d) => d.year === 2011);
  const year2010 = data.find((d) => d.year === 2010);
  const percentChange2010to2011 =
    year2010 && year2011
      ? ((year2011.avg_price - year2010.avg_price) / year2010.avg_price) * 100
      : 0;

  const annotations = [
    {
      note: {
        label: `+${percentChange2010to2011.toFixed(1)}% increase from previous year.`,
      },
      type: d3.annotationLabel,
      x: x(2011) + x.bandwidth() / 2,
      y: y(year2011.avg_price),
      dx: -20,
      dy: -30,
    },
  ];

  const makeAnnotations = d3.annotation().annotations(annotations);
  annotationLayer.call(makeAnnotations);

})();
