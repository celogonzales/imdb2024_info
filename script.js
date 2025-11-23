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

const duneTooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltipRevenue")
  .style("opacity", 0);

d3.csv("data/imdb_posters.csv").then(data => {
  drawRevenueChart(data);
});

d3.csv("data/imdb_posters.csv").then(data => {
  // Clean numeric fields
  data.forEach(d => {
    d.Revenue = parseFloat(d.Revenue.replace(/[^0-9.]/g, ""));
    d.Vote_Average = +d.Vote_Average;
  });

  // Get top 10 by revenue
  const topRevenue = [...data]
    .sort((a, b) => b.Revenue - a.Revenue)
    .slice(0, 10);

  // Get top 10 by score
  const topScore = [...data]
    .sort((a, b) => b.Vote_Average - a.Vote_Average)
    .slice(0, 10);

  // Find overlap
  const topRevenueNames = topRevenue.map(d => d.Movie_Name);
  const topScoreNames = topScore.map(d => d.Movie_Name);
  const sharedTitles = topRevenueNames.filter(name => topScoreNames.includes(name));

  console.log("Top Revenue:", topRevenue);
  console.log("Top Score:", topScore);
  console.log("Shared Titles:", sharedTitles);

  function drawTop10Lists(topRevenue, topScore, sharedTitles) {
    const formatRevenue = value => {
      if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)} billion`;
      if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)} million`;
      return `$${value}`;
    };

    const containerStyle = "font-family: Lato; font-size: 16px; color: #E6E6E6;";
    const titleStyle = "color: #F4B400; font-size: 20px; font-weight: bold; margin-bottom: 12px;";
    const itemStyle = "display: flex; justify-content: space-between; margin-bottom: 4px;";
    const highlightStyle = "color: #F4B400; font-weight: bold;";

    function renderList(containerId, data, valueFormatter, title) {
      const container = d3.select(containerId)
        .append("div")
        .attr("style", containerStyle);

      container.append("div")
        .attr("style", titleStyle)
        .text(title);

      data.forEach(d => {
        const row = container.append("div")
          .attr("style", itemStyle)
          .html(`<span>${d.Movie_Name}</span><span>${valueFormatter(d)}</span>`);

        if (d.Movie_Name === "Dune: Part Two") {
          row
            .on("mouseover", (event) => {
              duneTooltip
                .style("opacity", 1)
                .html(`
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <img src="${d.Poster_URL}" alt="Poster" style="width: 60px; height: auto; border-radius: 4px;" />
            <div>
               Dune is also the movie with the highest number of user ratings - almost 600,000!
            </div>
          </div>
        `
                );
            })
            .on("mousemove", (event) => {
              duneTooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
              duneTooltip.style("opacity", 0);
            });
        }


        if (sharedTitles.includes(d.Movie_Name)) {
          row.classed("shared-title", true); // give shared entries a CSS class
        }
      });

    }

    renderList("#top-revenue-chart", topRevenue, d => formatRevenue(d.Revenue), "Top 10 by Revenue");
    renderList("#top-score-chart", topScore, d =>
      typeof d.Vote_Average === "number" ? `${d.Vote_Average.toFixed(1)}` : "—",
      "Top 10 by Score"
    );
  }
  drawTop10Lists(topRevenue, topScore, sharedTitles);
  setInterval(() => {
    d3.selectAll(".shared-title")
      .classed("flash", false) // reset class
      .each(function () {
        // Force a reflow to re-trigger animation
        void this.offsetWidth;
      })
      .classed("flash", true); // reapply
  }, 3000);
});

d3.csv("data/genre_chart_data.csv").then(data => {
  // Parse and clean
  data.forEach(d => {
    d.Movie_Count = +d.Movie_Count;
    d.Total_Revenue = +d.Total_Revenue;
    d.Average_Rating = +(+d.Average_Rating).toFixed(2);
  });

  const metricMap = {
    movies: "Movie_Count",
    revenue: "Total_Revenue",
    rating: "Average_Rating"
  };

  let currentMetric = "movies";
  const metric = metricMap[currentMetric];

  // Chart setup
  const width = 600;
  const height = 180;
  const margin = { top: 20, right: 20, bottom: 30, left: 140 };

  const container = d3.select("#chart-genres");
  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .classed("responsive-svg", true);

  const tooltip = d3.select("#genreTooltip");

  // Scales (defined globally so we can update later)
  let x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[metric])])
    .nice()
    .range([margin.left, width - margin.right]);

  let y = d3.scaleBand()
    .domain(data.sort((a, b) => b[metric] - a[metric]).map(d => d.Genre))
    .range([margin.top, height - margin.bottom])
    .padding(0.3);

  // Axis groups
  const xAxisGroup = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`);

  const yAxisGroup = svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left - 10},0)`);

  // Initial bars
  const bars = svg.selectAll("rect")
    .data(data, d => d.Genre)
    .enter()
    .append("rect")
    .attr("x", x(0))
    .attr("y", d => y(d.Genre))
    .attr("height", y.bandwidth())
    .attr("width", d => x(d[metric]) - x(0))
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("class", d => d.Color)
    .on("mouseover", function (event, d) {
      const activeMetric = d3.select("#toggle-buttons button.active").attr("data-metric");
      tooltip
        .style("opacity", 1)
        .html(`<strong>${d.Genre}</strong><br>${formatMetric(d, activeMetric)}`);
    })

    .on("mousemove", (event) => {
      tooltip
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 32}px`);
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  updateAxes(metric);

  // Button toggle
  d3.selectAll("#toggle-buttons button").on("click", function () {
    const metricKey = d3.select(this).attr("data-metric");
    if (metricKey === currentMetric) return;

    currentMetric = metricKey;
    const newMetric = metricMap[currentMetric];

    d3.selectAll("#toggle-buttons button").classed("active", false);
    d3.select(this).classed("active", true);

    updateChart(newMetric);
  });

  function updateChart(metric) {
    // Resort and update domains
    data.sort((a, b) => b[metric] - a[metric]);
    y.domain(data.map(d => d.Genre));
    x.domain([0, d3.max(data, d => d[metric])]).nice();

    // Update bars
    svg.selectAll("rect")
      .data(data, d => d.Genre)
      .transition()
      .duration(800)
      .attr("y", d => y(d.Genre))
      .attr("height", y.bandwidth())
      .attr("width", d => x(d[metric]) - x(0));

    // Update axes
    updateAxes(metric);
  }

  function updateAxes(metric) {
    yAxisGroup
      .transition()
      .duration(800)
      .call(d3.axisLeft(y))
      .selectAll("text")
      .attr("fill", "#E6E6E6")
      .style("font-family", "Lato")
      .style("font-size", "8px")
      .style("font-weight", "bold");

    xAxisGroup
      .transition()
      .duration(800)
      .call(d3.axisBottom(x).ticks(5)
        .tickFormat(d => {
          if (metric === "Average_Rating") return d.toFixed(2);
          if (metric === "Total_Revenue") return `$${(d / 1e9).toFixed(0)}B`;
          if (metric === "Movie_Count") return d;
        }))
      .selectAll("text")
      .attr("fill", "#E6E6E6")
      .style("font-family", "Lato")
      .style("font-size", "6px");

    svg.selectAll(".domain").attr("stroke", "none");
    svg.selectAll(".tick line").attr("stroke", "#444").attr("stroke-dasharray", "2 2");
  }

  function formatMetric(d, metric) {
    if (metric === "movies") return `${d.Movie_Count} movies`;
    if (metric === "revenue") return `Revenue: $${(d.Total_Revenue / 1e9).toFixed(1)}B`;
    if (metric === "rating") return `Avg. Rating: ${d.Average_Rating.toFixed(2)}`;
  }


});

d3.csv("data/imdb_posters.csv").then(data => {
  // Parse numeric fields
  data.forEach(d => {
    d.Vote_Average = +d.Vote_Average;
    d.Revenue = +d.Revenue;
  });

  const formatRevenue = d3.format("$.2s");

  const leftCard = d3.select("#movie-left");
  const rightCard = d3.select("#movie-right");
  const resultBox = d3.select(".quiz-result");
  const retryButton = d3.select(".quiz-retry");

  let currentPair = [];

  function pickRandomPair() {
    const shuffled = d3.shuffle(data);
    currentPair = shuffled.slice(0, 2);
    updateCards();
  }

  function updateCards() {
    resultBox.classed("hidden", true);
    retryButton.classed("hidden", true);
    d3.selectAll(".movie-card").style("pointer-events", "auto");


    [leftCard, rightCard].forEach((card, i) => {
      const movie = currentPair[i];
      card.select("img").attr("src", movie.Poster_URL);
      card.select(".movie-title").text(movie.Movie_Name);
      card.select(".movie-revenue").text(`Revenue: ${formatRevenue(movie.Revenue)}`);
      card.select(".guess-button").attr("disabled", null);
    });
  }

  function handleGuess(side) {
    const [left, right] = currentPair;
    const userCorrect =
      (side === "left" && left.Vote_Average >= right.Vote_Average) ||
      (side === "right" && right.Vote_Average >= left.Vote_Average);

    resultBox
      .text(
        userCorrect
          ? `✅ Correct! "${left.Movie_Name}" (${left.Vote_Average}) vs "${right.Movie_Name}" (${right.Vote_Average})`
          : `❌ Incorrect. "${left.Movie_Name}" (${left.Vote_Average}) vs "${right.Movie_Name}" (${right.Vote_Average})`
      )
      .classed("hidden", false);

    d3.selectAll(".movie-card").style("pointer-events", "none");

    retryButton.classed("hidden", false);
  }

  d3.selectAll(".movie-card").on("click", function () {
    const side = d3.select(this).attr("data-side");
    handleGuess(side);
  });


  retryButton.on("click", pickRandomPair);

  pickRandomPair();
});
