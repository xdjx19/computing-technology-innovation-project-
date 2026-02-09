// ===============================
// Assignment 3C - D3 
// Charts:
// 1) Bar: Efficiency = LifeExpectancy / HealthExpenditure
// 2) Line: Life Expectancy over time (selected countries)
// 3) Scatter: Expenditure vs Life Expectancy (by year)
// ===============================

// ---------- Basic chart sizes ----------
const W = 900;        // svg width
const H = 380;        // svg height (not too big)
const M = { top: 45, right: 30, bottom: 60, left: 70 };

// ---------- Get UI elements ----------
const yearSlider = d3.select("#yearSlider");
const yearLabel = d3.select("#yearLabel");
const topNSelect = d3.select("#topN");
const countrySelect = d3.select("#countrySelect");
const tooltip = d3.select("#tooltip");

// ---------- Create SVGs ----------
const barSvg = d3.select("#bar")
    .append("svg")
    .attr("width", W)
    .attr("height", H);

const lineSvg = d3.select("#line")
    .append("svg")
    .attr("width", W)
    .attr("height", H);

const scatterSvg = d3.select("#scatter")
    .append("svg")
    .attr("width", W)
    .attr("height", H);

// ---------- Helpers: find column names safely ----------
function pickCol(cols, candidates) {
    // candidates = ["country","Country","REF_AREA",...]
    for (const c of candidates) {
        const found = cols.find(x => x.toLowerCase() === c.toLowerCase());
        if (found) return found;
    }
    // fallback: contains
    for (const c of candidates) {
        const found = cols.find(x => x.toLowerCase().includes(c.toLowerCase()));
        if (found) return found;
    }
    return null;
}

function showTip(msg) {
    // show a console + small red message at bottom if needed
    console.log(msg);
}

// ---------- Load CSV ----------
d3.csv("merged_health_data.csv").then(raw => {

    if (!raw || raw.length === 0) {
        alert("CSV loaded but has 0 rows.");
        return;
    }

    const cols = raw.columns;
    // Try to detect your columns (works with many naming styles)
    const colCountry = pickCol(cols, ["Country", "REF_AREA", "country", "location"]);
    const colYear = pickCol(cols, ["Year", "TIME_PERIOD", "time_period", "year", "Time"]);
    const colLife = pickCol(cols, ["Life Expectancy", "life_expectancy", "LifeExpectancy", "LIFE_EXP", "life"]);
    const colExp = pickCol(cols, ["Health Expenditure", "health_expenditure", "HealthExpenditure", "HEALTH_EXP", "expenditure", "gdp"]);

    // If any column missing -> stop and tell you
    if (!colCountry || !colYear || !colLife || !colExp) {
        console.log("CSV columns found:", cols);
        alert(
            "Column name mismatch.\n\n" +
            "Found:\n" +
            `country=${colCountry}\nyear=${colYear}\nlife=${colLife}\nexp=${colExp}\n\n` +
            "If any is 'null', tell me your CSV headers (first row)."
        );
        return;
    }

    // ---------- Clean / parse data ----------
    const data = raw.map(d => {
        const country = d[colCountry];
        const year = +d[colYear];
        const life = +d[colLife];
        const exp = +d[colExp];

        return {
            country,
            year,
            life,
            exp,
            efficiency: (exp > 0) ? (life / exp) : null
        };
    }).filter(d =>
        d.country &&
        Number.isFinite(d.year) &&
        Number.isFinite(d.life) &&
        Number.isFinite(d.exp) &&
        d.exp > 0
    );

    // ---------- Get years list ----------
    const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b);

    // Setup slider
    yearSlider
        .attr("min", d3.min(years))
        .attr("max", d3.max(years))
        .attr("step", 1)
        .property("value", d3.max(years));

    yearLabel.text(yearSlider.property("value"));

    // Populate country select
    const countries = Array.from(new Set(data.map(d => d.country))).sort(d3.ascending);
    countrySelect.selectAll("option")
        .data(countries)
        .join("option")
        .attr("value", d => d)
        .text(d => d);

    // Preselect a few (nice default)
    const defaultCountries = ["Australia", "Canada", "Japan"];
    countrySelect.selectAll("option")
        .property("selected", d => defaultCountries.includes(d));

    // ---------- Draw first time ----------
    renderAll();

    // ---------- Events ----------
    yearSlider.on("input", () => {
        yearLabel.text(yearSlider.property("value"));
        renderAll();
    });

    topNSelect.on("change", renderAll);
    countrySelect.on("change", renderLine);

    // ---------- Main render ----------
    function renderAll() {
        renderBar();
        renderLine();
        renderScatter();
    }

    // =========================
    // 1) BAR: Efficiency ranking
    // =========================
    function renderBar() {
        const year = +yearSlider.property("value");
        const topN = +topNSelect.property("value");

        const yearData = data.filter(d => d.year === year && d.efficiency !== null);

        // Sort high -> low efficiency
        yearData.sort((a, b) => d3.descending(a.efficiency, b.efficiency));

        const shown = (topN === 999) ? yearData : yearData.slice(0, topN);

        barSvg.selectAll("*").remove();

        const g = barSvg.append("g").attr("transform", `translate(${M.left},${M.top})`);
        const innerW = W - M.left - M.right;
        const innerH = H - M.top - M.bottom;

        const x = d3.scaleBand()
            .domain(shown.map(d => d.country))
            .range([0, innerW])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(shown, d => d.efficiency) || 1])
            .nice()
            .range([innerH, 0]);

        g.append("g").call(d3.axisLeft(y));

        g.append("g")
            .attr("transform", `translate(0,${innerH})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-35)")
            .style("text-anchor", "end");

        g.selectAll("rect")
            .data(shown)
            .join("rect")
            .attr("x", d => x(d.country))
            .attr("y", d => y(d.efficiency))
            .attr("width", x.bandwidth())
            .attr("height", d => innerH - y(d.efficiency))
            .on("mousemove", (event, d) => {
                tooltip.style("opacity", 1)
                    .html(
                        `<b>${d.country}</b><br/>
             Year: ${d.year}<br/>
             Life: ${d.life.toFixed(2)}<br/>
             Exp: ${d.exp.toFixed(2)}<br/>
             Efficiency: ${d.efficiency.toFixed(2)}`
                    )
                    .style("left", (event.pageX + 12) + "px")
                    .style("top", (event.pageY + 12) + "px");
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        // Title
        barSvg.append("text")
            .attr("x", M.left)
            .attr("y", 22)
            .style("font-weight", "600")
            .text(`Top ${shown.length} Spending Efficiency (Life / Expenditure) - ${year}`);

        // Axis labels
        barSvg.append("text")
            .attr("x", W / 2)
            .attr("y", H - 15)
            .style("text-anchor", "middle")
            .text("Country");

        barSvg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -H / 2)
            .attr("y", 18)
            .style("text-anchor", "middle")
            .text("Efficiency");
    }

    // =========================
    // 2) LINE: Life Expectancy over time
    // =========================
    function renderLine() {
        const selected = countrySelect
            .selectAll("option")
            .filter(function () { return this.selected; })
            .nodes()
            .map(n => n.value);

        lineSvg.selectAll("*").remove();

        const g = lineSvg.append("g").attr("transform", `translate(${M.left},${M.top})`);
        const innerW = W - M.left - M.right;
        const innerH = H - M.top - M.bottom;

        const x = d3.scaleLinear()
            .domain(d3.extent(years))
            .range([0, innerW]);

        // y based on selected (or whole dataset if none selected)
        const lineBase = (selected.length === 0)
            ? data
            : data.filter(d => selected.includes(d.country));

        const y = d3.scaleLinear()
            .domain(d3.extent(lineBase, d => d.life))
            .nice()
            .range([innerH, 0]);

        g.append("g").call(d3.axisLeft(y));
        g.append("g")
            .attr("transform", `translate(0,${innerH})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        // group by country
        const grouped = d3.group(lineBase, d => d.country);

        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.life));

        // draw each country line
        for (const [country, arr] of grouped) {
            const sorted = arr.slice().sort((a, b) => a.year - b.year);

            g.append("path")
                .datum(sorted)
                .attr("fill", "none")
                .attr("stroke-width", 2)
                .attr("stroke", "#2c3e50")
                .attr("opacity", selected.length ? 0.9 : 0.25)
                .attr("d", line);

            // points for tooltips
            g.selectAll(`.pt-${country.replaceAll(" ", "")}`)
                .data(sorted)
                .join("circle")
                .attr("cx", d => x(d.year))
                .attr("cy", d => y(d.life))
                .attr("r", 3)
                .attr("fill", "#2c3e50")
                .attr("opacity", selected.length ? 1 : 0.25)
                .on("mousemove", (event, d) => {
                    tooltip.style("opacity", 1)
                        .html(
                            `<b>${d.country}</b><br/>
               Year: ${d.year}<br/>
               Life: ${d.life.toFixed(2)}`
                        )
                        .style("left", (event.pageX + 12) + "px")
                        .style("top", (event.pageY + 12) + "px");
                })
                .on("mouseout", () => tooltip.style("opacity", 0));
        }

        lineSvg.append("text")
            .attr("x", M.left)
            .attr("y", 22)
            .style("font-weight", "600")
            .text("Life Expectancy Over Time (selected countries)");

        // labels
        lineSvg.append("text")
            .attr("x", W / 2)
            .attr("y", H - 15)
            .style("text-anchor", "middle")
            .text("Year");

        lineSvg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -H / 2)
            .attr("y", 18)
            .style("text-anchor", "middle")
            .text("Life Expectancy");
    }

    // =========================
    // 3) SCATTER: Expenditure vs Life Expectancy (by year)
    // =========================
    function renderScatter() {
        const year = +yearSlider.property("value");
        const yearData = data.filter(d => d.year === year);

        scatterSvg.selectAll("*").remove();

        const g = scatterSvg.append("g").attr("transform", `translate(${M.left},${M.top})`);
        const innerW = W - M.left - M.right;
        const innerH = H - M.top - M.bottom;

        const x = d3.scaleLinear()
            .domain(d3.extent(yearData, d => d.exp))
            .nice()
            .range([0, innerW]);

        const y = d3.scaleLinear()
            .domain(d3.extent(yearData, d => d.life))
            .nice()
            .range([innerH, 0]);

        g.append("g").call(d3.axisLeft(y));
        g.append("g")
            .attr("transform", `translate(0,${innerH})`)
            .call(d3.axisBottom(x));

        g.selectAll("circle")
            .data(yearData)
            .join("circle")
            .attr("cx", d => x(d.exp))
            .attr("cy", d => y(d.life))
            .attr("r", 5)
            .attr("fill", "#7f8c8d")
            .attr("opacity", 0.85)
            .on("mousemove", (event, d) => {
                tooltip.style("opacity", 1)
                    .html(
                        `<b>${d.country}</b><br/>
             Year: ${d.year}<br/>
             Exp: ${d.exp.toFixed(2)}<br/>
             Life: ${d.life.toFixed(2)}`
                    )
                    .style("left", (event.pageX + 12) + "px")
                    .style("top", (event.pageY + 12) + "px");
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        scatterSvg.append("text")
            .attr("x", M.left)
            .attr("y", 22)
            .style("font-weight", "600")
            .text(`Health Expenditure (% GDP) vs Life Expectancy - ${year}`);

        // labels
        scatterSvg.append("text")
            .attr("x", W / 2)
            .attr("y", H - 15)
            .style("text-anchor", "middle")
            .text("Health Expenditure (% of GDP)");

        scatterSvg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -H / 2)
            .attr("y", 18)
            .style("text-anchor", "middle")
            .text("Life Expectancy");
    }

}).catch(err => {
    console.error(err);
    alert(
        "Error loading merged_health_data.csv.\n\n" +
        "Check:\n" +
        "1) File name exactly merged_health_data.csv\n" +
        "2) Same folder as ass3_index.html\n" +
        "3) You are running localhost server (not opening file directly)\n"
    );
});
