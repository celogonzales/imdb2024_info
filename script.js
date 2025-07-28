//THE BIG CHART

function drawTimeline(data) {
  const parseDate = d3.timeParse("%m/%d/%Y");
  data.forEach(d => {
    d.date = parseDate(d.Release_Date);
    d.releaseWeek = d3.timeWeek.floor(d.date);
    d.Vote_Average = +d.Vote_Average;
  });

  const weekFormat = d3.timeFormat("%Y-%W");
  const weekParse = d3.timeParse("%Y-%W");

  const moviesByWeek = d3.groups(data, d => weekFormat(d.date));
  const stackedData = [];
  moviesByWeek.forEach(([week, movies]) => {
    movies.sort((a, b) => d3.ascending(a.Vote_Average, b.Vote_Average));
    movies.forEach((movie, i) => {
      movie.week = weekParse(week);
      movie.stackIndex = i;
      stackedData.push(movie);
    });
  });

  const width = 1200;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };

const svg = d3.select("#chart-timeline") // or "#chart-revenue"
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .classed("responsive-svg", true);

  const x = d3.scaleTime()
    .domain(d3.extent(stackedData, d => d.week))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(moviesByWeek, ([, movies]) => movies.length) * 1.8])
    .range([height - margin.bottom, margin.top]);

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("opacity", 0);

  const size = 12;
  svg.selectAll("rect")
    .data(stackedData)
    .enter()
    .append("rect")
    .attr("x", d => x(d.week) - size / 2)
    .attr("y", d => y(d.stackIndex) - size / 2)
    .attr("width", size)
    .attr("height", size)
    .attr("rx", 3)
    .attr("ry", 3)
    .attr("fill", "#E6E6E6")
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr("fill", "#F4B400");

      tooltip
        .style("opacity", 1)
        .html(`
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <img src="${d.Poster_URL}" alt="Poster" style="width: 60px; height: auto; border-radius: 4px;" />
            <div>
              <strong>${d.Movie_Name}</strong><br>
              ${d3.timeFormat("%b. %-d")(d.date)}<br>
              ⭐ ${d.Vote_Average}
            </div>
          </div>
        `)
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 32}px`);
    })
    .on("mouseout", (event) => {
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr("fill", "#E6E6E6");

      tooltip.style("opacity", 0);
    });

  const xAxis = d3.axisBottom(x)
    .tickValues(d3.timeMonths(
      d3.timeMonth.floor(d3.min(stackedData, d => d.date)),
      d3.timeMonth.ceil(d3.max(stackedData, d => d.date))
    ))
    .tickFormat(d3.timeFormat("%b"));

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .selectAll("text")
    .attr("fill", "#E6E6E6")
    .attr("dy", "1.5em")
    .style("font-family", "Lato")
    .style("font-weight", "bold")
    .style("font-size", "14px");

  svg.selectAll(".domain").attr("stroke", "none");
  svg.selectAll(".tick line").attr("stroke", "none");
}

//THE BIG CHART - REVENUE

function formatRevenue(value) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value}`;
}

function drawRevenueChart(data) {
  const parseDate = d3.timeParse("%m/%d/%Y");

 function parseRevenue(revenueStr) {
  if (!revenueStr || typeof revenueStr !== "string") return 0;
  const num = parseFloat(revenueStr.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return 0;
  if (revenueStr.includes("B")) return num * 1_000_000_000;
  if (revenueStr.includes("M")) return num * 1_000_000;
  if (revenueStr.includes("K")) return num * 1_000;
  return num;
}


  data.forEach(d => {
    d.date = parseDate(d.Release_Date);
    d.releaseWeek = d3.timeWeek.floor(d.date);
    d.Vote_Average = +d.Vote_Average;
    d.Revenue = parseRevenue(d.Revenue);
  });

  const weekFormat = d3.timeFormat("%Y-%W");
  const weekParse = d3.timeParse("%Y-%W");

  const moviesByWeek = d3.groups(data, d => weekFormat(d.date));
  const stackedData = [];
  moviesByWeek.forEach(([week, movies]) => {
    movies.sort((a, b) => d3.ascending(a.Revenue, b.Revenue));
    movies.forEach((movie, i) => {
      movie.week = weekParse(week);
      movie.stackIndex = i;
      stackedData.push(movie);
    });
  });

  const width = 1200;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };

const svg = d3.select("#chart-revenue") // or "#chart-revenue"
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .classed("responsive-svg", true);


  const x = d3.scaleTime()
    .domain(d3.extent(stackedData, d => d.week))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(moviesByWeek, ([, movies]) => movies.length) * 1.8])
    .range([height - margin.bottom, margin.top]);

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("opacity", 0);

  const size = 12;
  svg.selectAll("rect")
    .data(stackedData)
    .enter()
    .append("rect")
    .attr("x", d => x(d.week) - size / 2)
    .attr("y", d => y(d.stackIndex) - size / 2)
    .attr("width", size)
    .attr("height", size)
    .attr("rx", 3)
    .attr("ry", 3)
    .attr("fill", "#E6E6E6")
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr("fill", "#F4B400");

      tooltip
        .style("opacity", 1)
        .html(`
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <img src="${d.Poster_URL}" alt="Poster" style="width: 60px; height: auto; border-radius: 4px;" />
            <div>
              <strong>${d.Movie_Name}</strong><br>
              ${d3.timeFormat("%b. %-d")(d.date)}<br>
              ⭐ ${d.Vote_Average}<br>
              💰 ${formatRevenue(d.Revenue)}
            </div>
          </div>
        `)
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 32}px`);
    })
    .on("mouseout", (event) => {
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr("fill", "#E6E6E6");

      tooltip.style("opacity", 0);
    });

  const xAxis = d3.axisBottom(x)
    .tickValues(d3.timeMonths(
      d3.timeMonth.floor(d3.min(stackedData, d => d.date)),
      d3.timeMonth.ceil(d3.max(stackedData, d => d.date))
    ))
    .tickFormat(d3.timeFormat("%b"));

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .selectAll("text")
    .attr("fill", "#E6E6E6")
    .attr("dy", "1.5em")
    .style("font-family", "Lato")
    .style("font-weight", "bold")
    .style("font-size", "14px");

  svg.selectAll(".domain").attr("stroke", "none");
  svg.selectAll(".tick line").attr("stroke", "none");
}
d3.csv("data/imdb_posters.csv").then(data => {
  drawTimeline(data);
  drawRevenueChart(data);
});
