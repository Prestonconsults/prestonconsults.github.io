let rawData = [];
let yearColumns = [];
let chartInstance = null;

const sheetURL = "data.csv";

function toggleSection(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === "block" ? "none" : "block";
}

function showTable() {
  document.getElementById("tableView").style.display = "block";
  document.getElementById("chartView").style.display = "none";
}

function showChart() {
  document.getElementById("tableView").style.display = "none";
  document.getElementById("chartView").style.display = "block";
}

Papa.parse(sheetURL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {

    rawData = results.data;
    yearColumns = results.meta.fields.filter(f => /^\d{4}$/.test(f));

    populateFilters();
    populateChartDropdowns();
  }
});

function populateFilters() {

  const indicators = [...new Set(rawData.map(d => d.Indicator))];
  const countries = [...new Set(rawData.map(d => d.Country))];

  indicators.forEach(i =>
    document.getElementById("indicatorSection")
      .innerHTML += `<label><input type="checkbox" value="${i}"> ${i}</label>`
  );

  countries.forEach(c =>
    document.getElementById("countrySection")
      .innerHTML += `<label><input type="checkbox" value="${c}"> ${c}</label>`
  );

  yearColumns.forEach(y =>
    document.getElementById("yearSection")
      .innerHTML += `<label><input type="checkbox" value="${y}"> ${y}</label>`
  );
}

document.getElementById("applyFilters").addEventListener("click", () => {

  const selectedIndicators = getChecked("indicatorSection");
  const selectedCountries = getChecked("countrySection");
  const selectedYears = getChecked("yearSection");

  const filtered = rawData.filter(d =>
    (!selectedIndicators.length || selectedIndicators.includes(d.Indicator)) &&
    (!selectedCountries.length || selectedCountries.includes(d.Country))
  );

  renderTable(filtered, selectedYears);
});

function getChecked(sectionId) {
  return Array.from(document.querySelectorAll(`#${sectionId} input:checked`))
    .map(cb => cb.value);
}

function renderTable(data, selectedYears) {

  const thead = document.querySelector("#dataTable thead");
  const tbody = document.querySelector("#dataTable tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  const yearsToShow = selectedYears.length ? selectedYears : yearColumns;

  let headerRow = `<tr>
    <th>Indicator</th>
    <th>Category</th>
    <th>Country</th>
    <th>Notes</th>
    <th>Source</th>`;

  yearsToShow.forEach(y => headerRow += `<th>${y}</th>`);
  headerRow += "</tr>";

  thead.innerHTML = headerRow;

  data.forEach(row => {

    let tr = `<tr>
      <td>${row.Indicator}</td>
      <td>${row.Category}</td>
      <td>${row.Country}</td>
      <td>${row.Notes || ""}</td>
      <td>${row.Source || ""}</td>`;

    yearsToShow.forEach(y => {
      let val = row[y];
      tr += `<td>${val && val !== "0" ? val : ""}</td>`;
    });

    tr += "</tr>";
    tbody.innerHTML += tr;
  });
}

function populateChartDropdowns() {

  const indicatorSelect = document.getElementById("chartIndicator");
  const countrySelect = document.getElementById("chartCountry");

  [...new Set(rawData.map(d => d.Indicator))]
    .forEach(i => indicatorSelect.innerHTML += `<option>${i}</option>`);

  [...new Set(rawData.map(d => d.Country))]
    .forEach(c => countrySelect.innerHTML += `<option>${c}</option>`);

  indicatorSelect.addEventListener("change", drawChart);
  countrySelect.addEventListener("change", drawChart);
}

function drawChart() {

  const indicator = document.getElementById("chartIndicator").value;
  const country = document.getElementById("chartCountry").value;

  const record = rawData.find(d =>
    d.Indicator === indicator && d.Country === country
  );

  if (!record) return;

  const values = yearColumns.map(y => record[y] ? record[y] : null);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(
    document.getElementById("chartCanvas"),
    {
      type: "line",
      data: {
        labels: yearColumns,
        datasets: [{
          label: indicator + " - " + country,
          data: values,
          borderWidth: 2,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    }
  );
}
