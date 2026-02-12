let chartInstance = null;
let fullData = [];
let filteredData = [];
let baseCols = [];
let yearCols = [];
let activeView = "table";

const sheetURL = "data.csv";

/* =========================
   FETCH + PARSE CSV
========================= */

fetch(sheetURL)
  .then(res => res.text())
  .then(text => {

    const rows = text.trim().split("\n");
    const headers = rows.shift().split(",");

    const sourceIndex = headers.findIndex(h =>
      h.toLowerCase().trim() === "source"
    );

    baseCols = headers.slice(0, sourceIndex + 1);
    yearCols = headers
      .slice(sourceIndex + 1)
      .filter(h => !isNaN(h))
      .sort((a,b) => Number(a) - Number(b));

    fullData = rows.map(r => {
      const cols = r.split(",");
      let obj = {};
      headers.forEach((h,i) => {
        obj[h] = cols[i] ? cols[i].trim() : "";
      });
      return obj;
    });

    populateFilters();
  });

/* =========================
   FILTERS
========================= */

function populateFilters() {

  const indicatorSet = [...new Set(fullData.map(d => d[baseCols[0]]))];
  const countrySet = [...new Set(fullData.map(d => d[baseCols[2]]))];

  indicatorSet.forEach(i => {
    document.getElementById("indicatorFilters")
      .innerHTML += `<label><input type="checkbox" value="${i}">${i}</label>`;
  });

  countrySet.forEach(c => {
    document.getElementById("countryFilters")
      .innerHTML += `<label><input type="checkbox" value="${c}">${c}</label>`;
  });

  yearCols.forEach(y => {
    document.getElementById("yearFilters")
      .innerHTML += `<label><input type="checkbox" value="${y}">${y}</label>`;
  });
}

/* =========================
   SHOW RESULTS
========================= */

document.getElementById("showBtn").onclick = () => {

  const selectedI = getChecked("indicatorFilters");
  const selectedC = getChecked("countryFilters");
  const selectedY = getChecked("yearFilters");

  filteredData = fullData.filter(d =>
    (!selectedI.length || selectedI.includes(d[baseCols[0]])) &&
    (!selectedC.length || selectedC.includes(d[baseCols[2]]))
  );

  const yearsToUse = selectedY.length
    ? selectedY.sort((a,b)=>a-b)
    : yearCols;

  renderTable(yearsToUse);
  renderChart(yearsToUse);

  activeView = "table";
  showView();
};

function getChecked(id) {
  return [...document.querySelectorAll(`#${id} input:checked`)]
    .map(cb => cb.value);
}

/* =========================
   TABLE
========================= */

function renderTable(years) {

  const table = document.getElementById("dataTable");
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  let headerRow = "<tr>";

  baseCols.forEach((col,i) => {
    if (i === 0) {
      headerRow += `<th class="sticky-col">${col}</th>`;
    } else {
      headerRow += `<th>${col}</th>`;
    }
  });

  years.forEach(y => headerRow += `<th>${y}</th>`);
  headerRow += "</tr>";
  thead.innerHTML = headerRow;

  filteredData.forEach(r => {

    let tr = "<tr>";

    baseCols.forEach((col,i) => {
      if (i === 0) {
        tr += `<td class="sticky-col">${r[col]}</td>`;
      } else {
        tr += `<td>${r[col]}</td>`;
      }
    });

    years.forEach(y => {
      tr += `<td>${r[y] || ""}</td>`;
    });

    tr += "</tr>";
    tbody.innerHTML += tr;
  });
}

/* =========================
   CHART
========================= */

function renderChart(years) {

  if (!filteredData.length) return;

  const indicator = filteredData[0][baseCols[0]];
  const country = filteredData[0][baseCols[2]];

  const record = filteredData.find(r =>
    r[baseCols[0]] === indicator &&
    r[baseCols[2]] === country
  );

  if (!record) return;

  const values = years.map(y => record[y] || null);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(
    document.getElementById("chartCanvas"),
    {
      type: "line",
      data: {
        labels: years,
        datasets: [{
          label: `${indicator} - ${country}`,
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

/* =========================
   VIEW TOGGLE
========================= */

document.getElementById("tableToggle").onclick = () => {
  activeView = "table";
  showView();
};

document.getElementById("chartToggle").onclick = () => {
  activeView = "chart";
  showView();
};

function showView() {
  document.getElementById("tableContainer").style.display =
    activeView === "table" ? "block" : "none";

  document.getElementById("chartContainer").style.display =
    activeView === "chart" ? "block" : "none";
}

/* =========================
   ACCORDION POLISH
========================= */

document.addEventListener("click", function(e){

  const sidebar = document.getElementById("sidebar");

  if (!sidebar.contains(e.target)) {
    closeAllPanels();
  }
});

document.querySelectorAll(".accordion-header").forEach(header => {

  header.addEventListener("click", function(){

    const panel = document.getElementById(this.dataset.target);
    const arrow = this.querySelector(".arrow");

    const isOpen = panel.classList.contains("open");

    closeAllPanels();

    if (!isOpen) {
      panel.classList.add("open");
      this.classList.add("active");
      arrow.classList.add("rotate");
    }
  });
});

function closeAllPanels(){
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("open"));
  document.querySelectorAll(".accordion-header")
    .forEach(h => {
      h.classList.remove("active");
      h.querySelector(".arrow").classList.remove("rotate");
    });
}
