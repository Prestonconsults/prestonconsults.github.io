let chartInstance = null;
let currentData = [];
let currentYears = [];
let activeView = "table"; // default view

const sheetURL = "data.csv";

/* =========================
   TOGGLE VIEW PROPERLY
========================= */

document.getElementById("tableToggle").onclick = () => {
  activeView = "table";
  showCorrectView();
};

document.getElementById("chartToggle").onclick = () => {
  activeView = "chart";
  showCorrectView();
};

function showCorrectView() {
  const tableContainer = document.getElementById("tableContainer");
  const chartContainer = document.getElementById("chartContainer");
  const welcomeTable = document.getElementById("welcomeTable");
  const welcomeChart = document.getElementById("welcomeChart");

  if (!currentData.length) {
    // nothing selected yet
    welcomeTable.style.display = activeView === "table" ? "block" : "none";
    welcomeChart.style.display = activeView === "chart" ? "block" : "none";
    tableContainer.style.display = "none";
    chartContainer.style.display = "none";
    return;
  }

  welcomeTable.style.display = "none";
  welcomeChart.style.display = "none";

  if (activeView === "table") {
    tableContainer.style.display = "block";
    chartContainer.style.display = "none";
  } else {
    tableContainer.style.display = "none";
    chartContainer.style.display = "block";
  }
}

/* =========================
   FETCH DATA
========================= */

fetch(sheetURL)
  .then(res => res.text())
  .then(text => {

    const rows = text.trim().split("\n");
    const headers = rows.shift().split(",");

    // Identify year columns correctly and sort ascending
    const yearCols = headers
      .filter(h => /^\d{4}$/.test(h))
      .sort((a, b) => Number(a) - Number(b));

    const baseCols = headers.filter(h => !/^\d{4}$/.test(h));

    const data = rows.map(r => {
      const cols = r.split(",");
      let obj = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] ? cols[i].trim() : "";
      });
      return obj;
    });

    /* =========================
       POPULATE FILTERS
    ========================= */

    const indicatorSet = [...new Set(data.map(d => d[baseCols[0]]))];
    const countrySet = [...new Set(data.map(d => d[baseCols[2]]))];

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

    function getChecked(containerId) {
      return [...document.querySelectorAll(`#${containerId} input:checked`)]
        .map(cb => cb.value);
    }

    /* =========================
       SHOW RESULTS
    ========================= */

    document.getElementById("showBtn").onclick = () => {

      const selectedI = getChecked("indicatorFilters");
      const selectedC = getChecked("countryFilters");
      const selectedY = getChecked("yearFilters");

      const filtered = data.filter(d =>
        (!selectedI.length || selectedI.includes(d[baseCols[0]])) &&
        (!selectedC.length || selectedC.includes(d[baseCols[2]]))
      );

      currentData = filtered;
      currentYears = selectedY.length ? selectedY.sort((a,b)=>a-b) : yearCols;

      renderTable();
      renderChartControls();

      showCorrectView();
    };

    /* =========================
       TABLE RENDER
    ========================= */

    function renderTable() {

      const table = document.getElementById("dataTable");
      const thead = table.querySelector("thead");
      const tbody = table.querySelector("tbody");

      thead.innerHTML = "";
      tbody.innerHTML = "";

      let headerRow = "<tr>";

      baseCols.forEach(col => {
        headerRow += `<th class="sticky-col">${col}</th>`;
      });

      currentYears.forEach(y => {
        headerRow += `<th>${y}</th>`;
      });

      headerRow += "</tr>";
      thead.innerHTML = headerRow;

      currentData.forEach(r => {
        let tr = "<tr>";

        baseCols.forEach(col => {
          tr += `<td class="sticky-col">${r[col] || ""}</td>`;
        });

        currentYears.forEach(y => {
          let val = r[y];

          // Only blank if truly empty — NOT zero
          if (val === "" || val === undefined) {
            tr += `<td></td>`;
          } else {
            tr += `<td>${val}</td>`;
          }
        });

        tr += "</tr>";
        tbody.innerHTML += tr;
      });
    }

    /* =========================
       CHART RENDER
    ========================= */

    function renderChartControls() {

      const indSel = document.getElementById("chartIndicator");
      const cSel = document.getElementById("chartCountry");

      indSel.innerHTML = "";
      cSel.innerHTML = "";

      const indicators = [...new Set(currentData.map(d => d[baseCols[0]]))];
      const countries = [...new Set(currentData.map(d => d[baseCols[2]]))];

      indicators.forEach(i => {
        indSel.innerHTML += `<option value="${i}">${i}</option>`;
      });

      countries.forEach(c => {
        cSel.innerHTML += `<option value="${c}">${c}</option>`;
      });

      indSel.onchange = drawChart;
      cSel.onchange = drawChart;

      if (activeView === "chart") {
        drawChart();
      }
    }

    function drawChart() {

      const indicator = document.getElementById("chartIndicator").value;
      const country = document.getElementById("chartCountry").value;

      const record = currentData.find(r =>
        r[baseCols[0]] === indicator &&
        r[baseCols[2]] === country
      );

      if (!record) return;

      const values = currentYears.map(y => {
        const v = record[y];
        return v === "" || v === undefined ? null : Number(v);
      });

      if (chartInstance) chartInstance.destroy();

      chartInstance = new Chart(
        document.getElementById("chartCanvas"),
        {
          type: "line",
          data: {
            labels: currentYears,
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

  });
