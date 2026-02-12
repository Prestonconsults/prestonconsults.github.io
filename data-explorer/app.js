let rawData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;
let chartInstance;

fetch("data.csv")
  .then(res => res.text())
  .then(text => {
    rawData = parseCSV(text);
    initializeFilters();
  });

function parseCSV(text) {
  const rows = text.split("\n").map(r => r.split(","));
  const headers = rows[0];
  return rows.slice(1).map(r => {
    let obj = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] || "";
    });
    return obj;
  });
}

function initializeFilters() {
  ["Indicator", "Country", "Year"].forEach(type => {
    let values = [...new Set(rawData.map(d => d[type]))];
    const container = document.getElementById(type + "-options");
    values.forEach(v => {
      container.innerHTML += `<label><input type="checkbox" value="${v}" data-type="${type}"> ${v}</label><br>`;
    });
  });
}

document.getElementById("showResults").onclick = () => {
  applyFilters();
  renderTable();
  updateChart();
};

function applyFilters() {
  const selected = {};
  ["Indicator", "Country", "Year"].forEach(type => {
    selected[type] = [...document.querySelectorAll(`input[data-type="${type}"]:checked`)].map(cb => cb.value);
  });

  filteredData = rawData.filter(d =>
    (selected.Indicator.length === 0 || selected.Indicator.includes(d.Indicator)) &&
    (selected.Country.length === 0 || selected.Country.includes(d.Country)) &&
    (selected.Year.length === 0 || selected.Year.includes(d.Year))
  );

  currentPage = 1;
}

function renderTable() {
  const table = document.getElementById("dataTable");
  const placeholder = document.getElementById("tablePlaceholder");
  table.innerHTML = "";

  if (!filteredData.length) {
    placeholder.style.display = "block";
    return;
  }

  placeholder.style.display = "none";

  const headers = Object.keys(filteredData[0]);
  table.innerHTML += "<thead><tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr></thead>";

  const pageData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  table.innerHTML += "<tbody>" +
    pageData.map(row =>
      "<tr>" + headers.map(h =>
        `<td>${row[h] === "" ? "..." : row[h]}</td>`
      ).join("") + "</tr>"
    ).join("") +
    "</tbody>";

  document.getElementById("pageInfo").innerText =
    `Page ${currentPage} of ${Math.ceil(filteredData.length / rowsPerPage)}`;
}

function updateChart() {
  const placeholder = document.getElementById("chartPlaceholder");
  const controls = document.querySelector(".chart-controls");

  if (!filteredData.length) {
    placeholder.style.display = "block";
    controls.classList.add("hidden");
    return;
  }

  placeholder.style.display = "none";
  controls.classList.remove("hidden");

  const first = filteredData[0];
  renderChart(first);
}

function renderChart(row) {
  const ctx = document.getElementById("mainChart").getContext("2d");

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: [row.Year],
      datasets: [{
        label: row.Indicator + " - " + row.Country,
        data: [row.Value || null],
        borderWidth: 2
      }]
    }
  });
}

document.getElementById("exportBtn").onclick = () => {
  if (!filteredData.length) return;

  const headers = Object.keys(filteredData[0]);
  const csv = headers.join(",") + "\n" +
    filteredData.map(row =>
      headers.map(h => `"${row[h]}"`).join(",")
    ).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "filtered_data.csv";
  link.click();
};
