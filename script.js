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
    return Math.round(num);
  }

  data.forEach(d => {
    d.date = parseDate(d.Release_Date);
    d.releaseWeek = d3.timeWeek.floor(d.date);
    d.Vote_Average = +d.Vote_Average;
    d.Revenue = parseRevenue(d.Revenue);
  });

  const byWeek = d3.rollups(
    data,
    weekMovies => {
      const sorted = weekMovies.sort((a, b) => b.Revenue - a.Revenue);
      return sorted.map(d => ({
        ...d,
        stackIndex: sorted.indexOf(d),
      }));
    },
    d => d.releaseWeek
  ).flatMap(([week, movies]) => movies);

  const weeks = Array.from(new Set(byWeek.map(d => d.releaseWeek))).sort(d3.ascending);

  const margin = { top: 30, right: 40, bottom: 60, left: 40 };
  const width = 1000;
  const height = 500;

  const svg = d3
    .select("#chart-revenue")
    .append("svg")
    .attr("class", "responsive-svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const x = d3
    .scaleBand()
    .domain(weeks)
    .range([margin.left, width - margin.right])
    .paddingInner(0.25)
    .paddingOuter(0.1);

  const maxStackHeight = d3.max(byWeek, d => d.stackIndex + 1);
  const y = d3
    .scaleLinear()
    .domain([0, maxStackHeight])
    .range([height - margin.bottom, margin.top]);

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip");

  svg
    .selectAll("rect.movie-square")
    .data(byWeek)
    .enter()
    .append("rect")
    .attr("class", "movie-square")
    .attr("x", d => x(d.releaseWeek))
    .attr("y", d => y(d.stackIndex + 1))
    .attr("width", x.bandwidth())
    .attr("height", d => y(d.stackIndex) - y(d.stackIndex + 1))
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("fill", "#F4B400")
    .attr("opacity", 0.9)
    .on("mouseover", function (event, d) {
      tooltip
        .style("opacity", 1)
        .html(`
        <strong>${d.Movie_Name}</strong><br>
        Release Date: ${d.Release_Date}<br>
        IMDb Rating: ${d.Vote_Average.toFixed(1)} / 10<br>
        Revenue: ${formatRevenue(d.Revenue)}<br>
        <img src="${d.Poster_URL}" alt="Movie Poster">
      `);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("opacity", 0);
    });

  const xAxis = d3
    .axisBottom(x)
    .tickValues(
      weeks.filter((d, i) => {
        const month = d.getMonth();
        const nextMonth = weeks[i + 1] ? weeks[i + 1].getMonth() : month;
        return month !== nextMonth || i === 0;
      })
    )
    .tickFormat(d3.timeFormat("%b"));

  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .selectAll("text")
    .attr("fill", "#E6E6E6")
    .attr("dy", "1.5em")
    .style("font-family", "Lato")
    .style("font-weight", "bold")
    .style("font-size", "14px");

  const yAxis = d3.axisLeft(y).ticks(5).tickFormat(d => d);

  svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .selectAll("text")
    .attr("fill", "#E6E6E6")
    .style("font-family", "Lato")
    .style("font-size", "12px");

  svg.selectAll(".y-axis line")
    .attr("stroke", "#555");
  svg.selectAll(".y-axis path")
    .attr("stroke", "#555");
}

d3.csv("data/movies_2024_weekly.csv").then(data => {
  drawRevenueChart(data);
});

// TOP 10 CHARTS

d3.csv("data/movies_2024_top10.csv").then(data => {
  data.forEach(d => {
    d.Revenue = +d.Revenue;
    d.Vote_Average = +d.Vote_Average;
  });

  const topRevenue = data
    .slice()
    .sort((a, b) => b.Revenue - a.Revenue)
    .slice(0, 10);

  const topScore = data
    .slice()
    .sort((a, b) => b.Vote_Average - a.Vote_Average)
    .slice(0, 10);

  const topRevenueNames = topRevenue.map(d => d.Movie_Name);
  const topScoreNames = topScore.map(d => d.Movie_Name);
  const sharedTitles = topRevenueNames.filter(name => topScoreNames.includes(name));

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

      const duneTooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip");

      data.forEach((d, index) => {
        const rank = String(index + 1).padStart(2, "0");
        const row = container.append("div")
          .attr("style", itemStyle)
          .html(`<span>${rank}. ${d.Movie_Name}</span><span>${valueFormatter(d)}</span>`);

        if (d.Movie_Name === "Dune: Part Two") {
          row
            .on("mouseover", (event) => {
              duneTooltip
                .style("opacity", 1)
                .html(`
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <img src="${d.Poster_URL}" alt="Poster" style="width: 60px; height: auto; border-radius: 4px;" />
            <div>
               <em>Dune: Part Two</em> also has the highest number of IMDb user ratings—around 600,000—making it the most widely rated film in this dataset.
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
          row.classed("shared-title", true);
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
      .classed("flash", false)
      .each(function () {
        void this.offsetWidth;
      })
      .classed("flash", true);
  }, 3000);
});

// GENRE CHART

d3.csv("data/genre_chart_data.csv").then(data => {
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

  const margin = { top: 20, right: 60, bottom: 40, left: 140 };
  const width = 800;
  const height = 260;

  const svg = d3.select("#chart-genres")
    .append("svg")
    .attr("class", "responsive-svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const x = d3.scaleLinear()
    .range([margin.left, width - margin.right]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.Genre))
    .range([margin.top, height - margin.bottom])
    .padding(0.2);

  const tooltipGenre = d3.select("#genreTooltip");

  function formatMetricValue(metricKey, value) {
    if (metricKey === "movies") {
      return `${value} movies`;
    } else if (metricKey === "revenue") {
      if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
      if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
      return `$${value}`;
    } else if (metricKey === "rating") {
      return `${value.toFixed(2)} / 10`;
    }
    return value;
  }

  function updateScale(metricKey) {
    const metricField = metricMap[metricKey];
    const maxValue = d3.max(data, d => d[metricField]);
    x.domain([0, maxValue * 1.1]);
  }

  updateScale(currentMetric);

  const xAxis = d3.axisBottom(x)
    .ticks(5)
    .tickSizeOuter(0);

  const yAxis = d3.axisLeft(y);

  const xAxisGroup = svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis);

  xAxisGroup.selectAll("text")
    .attr("fill", "#E6E6E6")
    .style("font-family", "Lato")
    .style("font-size", "12px");

  xAxisGroup.selectAll("line")
    .attr("stroke", "#555");

  xAxisGroup.selectAll("path")
    .attr("stroke", "#555");

  const yAxisGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis);

  yAxisGroup.selectAll("text")
    .attr("fill", "#E6E6E6")
    .style("font-family", "Lato")
    .style("font-size", "12px");

  yAxisGroup.selectAll("line")
    .attr("stroke", "#555");

  yAxisGroup.selectAll("path")
    .attr("stroke", "#555");

  const bars = svg.selectAll(".bar")
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
      tooltipGenre
        .style("opacity", 1)
        .html(`<strong>${d.Genre}</strong><br>${formatMetricValue(activeMetric, d[metricMap[activeMetric]])}`);
    })
    .on("mousemove", function (event) {
      tooltipGenre
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      tooltipGenre.style("opacity", 0);
    });

  function updateBars(metricKey) {
    const metricField = metricMap[metricKey];
    updateScale(metricKey);

    svg.select(".x-axis-container")?.remove();

    const newXAxisGroup = svg.append("g")
      .attr("class", "x-axis-container")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0));

    newXAxisGroup.selectAll("text")
      .attr("fill", "#E6E6E6")
      .style("font-family", "Lato")
      .style("font-size", "12px");

    newXAxisGroup.selectAll("line")
      .attr("stroke", "#555");

    newXAxisGroup.selectAll("path")
      .attr("stroke", "#555");

    bars.transition()
      .duration(600)
      .attr("width", d => x(d[metricField]) - x(0));
  }

  d3.selectAll("#toggle-buttons button")
    .on("click", function () {
      const clickedButton = d3.select(this);
      const metricKey = clickedButton.attr("data-metric");
      currentMetric = metricKey;

      d3.selectAll("#toggle-buttons button").classed("active", false);
      clickedButton.classed("active", true);

      updateBars(metricKey);
    });
});

// QUIZ

d3.csv("data/movies_quiz_pairs.csv").then(pairs => {
  const moviesById = {};
  pairs.forEach(d => {
    moviesById[d.Left_ID] = {
      title: d.Left_Title,
      revenue: +d.Left_Revenue,
      rating: +d.Left_Rating,
      poster: d.Left_Poster
    };
    moviesById[d.Right_ID] = {
      title: d.Right_Title,
      revenue: +d.Right_Revenue,
      rating: +d.Right_Rating,
      poster: d.Right_Poster
    };
  });

  let currentIndex = 0;

  const leftCard = d3.select("#movie-left");
  const rightCard = d3.select("#movie-right");
  const resultDiv = d3.select(".quiz-result");
  const retryButton = d3.select(".quiz-retry");

  function formatRevenueShort(value) {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value}`;
  }

  function showPair(index) {
    const pair = pairs[index];
    const leftMovie = moviesById[pair.Left_ID];
    const rightMovie = moviesById[pair.Right_ID];

    leftCard.select("img").attr("src", leftMovie.poster);
    leftCard.select(".movie-title").text(leftMovie.title);
    leftCard.select(".movie-revenue").text(formatRevenueShort(leftMovie.revenue));

    rightCard.select("img").attr("src", rightMovie.poster);
    rightCard.select(".movie-title").text(rightMovie.title);
    rightCard.select(".movie-revenue").text(formatRevenueShort(rightMovie.revenue));

    resultDiv.classed("hidden", true);
    retryButton.classed("hidden", true);

    leftCard.on("click", () => evaluateGuess("left"));
    rightCard.on("click", () => evaluateGuess("right"));
  }

  function evaluateGuess(guessSide) {
    const pair = pairs[currentIndex];
    const leftRating = moviesById[pair.Left_ID].rating;
    const rightRating = moviesById[pair.Right_ID].rating;

    const correctSide = leftRating > rightRating ? "left" : "right";
    const guessedCorrectly = guessSide === correctSide;

    const leftMovie = moviesById[pair.Left_ID];
    const rightMovie = moviesById[pair.Right_ID];

    const message = guessedCorrectly
      ? `Correct! ${leftMovie.title} (${leftRating.toFixed(1)}) vs ${rightMovie.title} (${rightRating.toFixed(1)}).`
      : `Not quite! ${leftMovie.title} (${leftRating.toFixed(1)}) vs ${rightMovie.title} (${rightRating.toFixed(1)}).`;

    resultDiv
      .text(message)
      .classed("hidden", false);

    retryButton.classed("hidden", false);
  }

  retryButton.on("click", () => {
    currentIndex = (currentIndex + 1) % pairs.length;
    showPair(currentIndex);
  });

  showPair(currentIndex);
});
