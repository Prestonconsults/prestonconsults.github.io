const csvFile = "data.csv";
let rawData = [];
let yearColumns = [];

Papa.parse(csvFile, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    rawData = results.data;

    const headers = results.meta.fields;
    yearColumns = headers.filter(h => /^\d{4}$/.test(h));

    populateFilters();
    populateChartDropdowns();
  }
});

function populateFilters() {
  const indicators = [...new Set(rawData.map(d => d.Indicator))];
  const countries = [...new Set(rawData.map(d => d.Country))];

  const indicatorDiv = document.getElementById("indicatorFilters");
  const countryDiv = document.getElementById("countryFilters");
  const yearDiv = document.getElementById("yearFilters");

  indicators.forEach(v => {
    indicatorDiv.innerHTML += `<label><input type="checkbox" value="${v}"> ${v}</label>`;
  });

  countries.forEach(v => {
    countryDiv.innerHTML += `<label><input type="checkbox" value="${v}"> ${v}</label>`;
  });

  yearColumns.forEach(v => {
    yearDiv.innerHTML += `<label><input type="checkbox" value="${v}"> ${v}</label>`;
  });
}

/* Toggle filter panels */
document.querySelectorAll(".filter-toggle").forEach(btn=>{
  btn.addEventListener("click", function(){
    document.querySelectorAll(".filter-content").forEach(c=>c.style.display="none");
    this.nextElementSibling.style.display="block";
  });
});

/* Apply selection */
document.getElementById("applyBtn").addEventListener("click", function(){
  const selectedIndicators = getChecked("indicatorFilters");
  const selectedCountries = getChecked("countryFilters");
  const selectedYears = getChecked("yearFilters");

  const filtered = rawData.filter(d =>
    (!selectedIndicators.length || selectedIndicators.includes(d.Indicator)) &&
    (!selectedCountries.length || selectedCountries.includes(d.Country))
  );

  renderTable(filtered, selectedYears);
});

function getChecked(id){
  return Array.from(document.querySelectorAll(`#${id} input:checked`)).map(cb=>cb.value);
}

function renderTable(data, years){
  const thead = document.querySelector("#dataTable thead");
  const tbody = document.querySelector("#dataTable tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  let headerRow = "<tr><th>Indicator</th><th>Country</th>";
  years.forEach(y=> headerRow += `<th>${y}</th>`);
  headerRow += "</tr>";

  thead.innerHTML = headerRow;

  data.forEach(row=>{
    let tr = `<tr><td>${row.Indicator}</td><td>${row.Country}</td>`;
    years.forEach(y=>{
      tr += `<td>${row[y] ? row[y] : ""}</td>`;
    });
    tr += "</tr>";
    tbody.innerHTML += tr;
  });
}

/* Chart View Toggle */
document.getElementById("tableViewBtn").onclick = () => {
  document.getElementById("tableSection").style.display="block";
  document.getElementById("chartSection").style.display="none";
};

document.getElementById("chartViewBtn").onclick = () => {
  document.getElementById("tableSection").style.display="none";
  document.getElementById("chartSection").style.display="block";
};

/* Chart Dropdowns */
function populateChartDropdowns(){
  const indicatorSelect = document.getElementById("chartIndicator");
  const countrySelect = document.getElementById("chartCountry");

  [...new Set(rawData.map(d=>d.Indicator))].forEach(v=>{
    indicatorSelect.innerHTML += `<option>${v}</option>`;
  });

  [...new Set(rawData.map(d=>d.Country))].forEach(v=>{
    countrySelect.innerHTML += `<option>${v}</option>`;
  });
}

document.getElementById("chartIndicator").onchange = drawChart;
document.getElementById("chartCountry").onchange = drawChart;

let chart;

function drawChart(){
  const indicator = document.getElementById("chartIndicator").value;
  const country = document.getElementById("chartCountry").value;

  const record = rawData.find(d => d.Indicator===indicator && d.Country===country);
  if(!record) return;

  const values = yearColumns.map(y => record[y] ? record[y] : null);

  if(chart) chart.destroy();

  chart = new Chart(document.getElementById("chartCanvas"),{
    type:'line',
    data:{
      labels: yearColumns,
      datasets:[{
        label: indicator + " - " + country,
        data: values,
        borderWidth:2,
        tension:0.3
      }]
    }
  });
}
