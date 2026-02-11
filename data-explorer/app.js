const csvURL = "data.csv";

let rawData = [];
let chart;

Papa.parse(csvURL, {
  download: true,
  header: true,
  dynamicTyping: false,
  complete: function(results) {
    rawData = results.data.filter(r => r.indicator && r.country);
    buildFilters();
  }
});

function uniqueValues(field) {
  return [...new Set(rawData.map(d => d[field]))].sort();
}

function buildFilters() {

  buildCheckboxes("indicatorBox", uniqueValues("indicator"), "indicator");
  buildCheckboxes("countryBox", uniqueValues("country"), "country");

  const yearCols = Object.keys(rawData[0]).filter(k => /^\d{4}$/.test(k));
  buildCheckboxes("yearBox", yearCols, "year");

  buildChartDropdowns();
}

function buildCheckboxes(containerId, values, type) {
  const box = document.getElementById(containerId);
  box.innerHTML = "";

  values.forEach(v => {
    box.innerHTML += `
      <label>
        <input type="checkbox" value="${v}" class="${type}">
        ${v}
      </label>
    `;
  });
}

function selectAll(type) {
  document.querySelectorAll("." + type).forEach(cb => cb.checked = true);
}

function getSelected(type) {
  return [...document.querySelectorAll("." + type + ":checked")].map(cb => cb.value);
}

function applyFilters() {
  const indicators = getSelected("indicator");
  const countries = getSelected("country");
  const years = getSelected("year");

  const filtered = rawData.filter(d =>
    indicators.includes(d.indicator) &&
    countries.includes(d.country)
  );

  buildTable(filtered, years);
}

function buildTable(data, years) {

  const table = document.getElementById("dataTable");
  table.innerHTML = "";

  let header = "<tr><th>Indicator</th><th>Country</th><th>Notes</th><th>Source</th>";
  years.forEach(y => header += `<th>${y}</th>`);
  header += "</tr>";

  table.innerHTML += header;

  data.forEach(row => {
    let tr = `<tr>
      <td>${row.indicator}</td>
      <td>${row.country}</td>
      <td>${row.notes || ""}</td>
      <td>${row.source || ""}</td>
    `;

    years.forEach(y => {
      let val = row[y];
      if (val === "" || val === undefined) val = "";
      if (val === "0") val = "";  // fixes 2025 zero issue
      tr += `<td>${val}</td>`;
    });

    tr += "</tr>";
    table.innerHTML += tr;
  });
}

function buildChartDropdowns() {
  const indSelect = document.getElementById("chartIndicator");
  const cSelect = document.getElementById("chartCountry");

  indSelect.innerHTML = uniqueValues("indicator")
    .map(v => `<option value="${v}">${v}</option>`).join("");

  cSelect.innerHTML = uniqueValues("country")
    .map(v => `<option value="${v}">${v}</option>`).join("");

  indSelect.onchange = drawChart;
  cSelect.onchange = drawChart;
}

function drawChart() {

  const indicator = document.getElementById("chartIndicator").value;
  const country = document.getElementById("chartCountry").value;

  const row = rawData.find(d => d.indicator === indicator && d.country === country);
  if (!row) return;

  const years = Object.keys(row).filter(k => /^\d{4}$/.test(k)).sort();

  const values = years.map(y => row[y] === "0" ? null : row[y]);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("myChart"), {
    type: "line",
    data: {
      labels: years,
      datasets: [{
        label: indicator,
        data: values
      }]
    }
  });
}

function showTable() {
  document.getElementById("tableView").style.display = "block";
  document.getElementById("chartView").style.display = "none";
}

function showChart() {
  document.getElementById("tableView").style.display = "none";
  document.getElementById("chartView").style.display = "block";
  drawChart();
}
