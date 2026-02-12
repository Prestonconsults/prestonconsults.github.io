let chartInstance = null;
let fullData = [];
let filteredData = [];
let baseCols = [];
let yearCols = [];
let currentYears = [];

let currentPage = 1;
let rowsPerPage = 25;
let activeView = "table";

const sheetURL = "data.csv";

/* =========================
   FETCH DATA
========================= */

fetch(sheetURL)
  .then(res => res.text())
  .then(text => {

    const rows = text.trim().split("\n");
    const headers = rows.shift().split(",");

    yearCols = headers
      .filter(h => /^\d{4}$/.test(h))
      .sort((a, b) => Number(a) - Number(b));

    baseCols = headers.filter(h => !/^\d{4}$/.test(h));

    fullData = rows.map(r => {
      const cols = r.split(",");
      let obj = {};
      headers.forEach((h, i) => {
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

  const indicatorDiv = document.getElementById("indicatorFilters");
  const countryDiv = document.getElementById("countryFilters");
  const yearDiv = document.getElementById("yearFilters");

  indicatorSet.forEach(i => {
    indicatorDiv.innerHTML += `<label><input type="checkbox" value="${i}">${i}</label>`;
  });

  countrySet.forEach(c => {
    countryDiv.innerHTML += `<label><input type="checkbox" value="${c}">${c}</label>`;
  });

  yearCols.forEach(y => {
    yearDiv.innerHTML += `<label><input type="checkbox" value="${y}">${y}</label>`;
  });
}

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

  filteredData = fullData.filter(d =>
    (!selectedI.length || selectedI.includes(d[baseCols[0]])) &&
    (!selectedC.length || selectedC.includes(d[baseCols[2]]))
  );

  currentYears = selectedY.length
    ? selectedY.sort((a, b) => a - b)
    : yearCols;

  currentPage = 1;

  renderTable();
  renderChartControls();
  showCorrectView();
};

/* =========================
   TABLE RENDER WITH PAGINATION
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

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = filteredData.slice(start, end);

  pageData.forEach(r => {
    let tr = "<tr>";

    baseCols.forEach(col => {
      tr += `<td class="sticky-col">${r[col] || ""}</td>`;
    });

    currentYears.forEach(y => {
      let val = r[y];
      tr += `<td>${val ? val : ""}</td>`;
    });

    tr += "</tr>";
    tbody.innerHTML += tr;
  });

  updatePagination();
}

/* =========================
   PAGINATION
========================= */

function updatePagination() {
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  document.getElementById("pageInfo").innerText =
    `Page ${currentPage} of ${totalPages}`;
}

document.getElementById("prevPage").onclick = () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
};

document.getElementById("nextPage").onclick = () => {
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
};

document.getElementById("rowsPerPage").onchange = (e) => {
  rowsPerPage = Number(e.target.value);
  currentPage = 1;
  renderTable();
};

/* =========================
   EXPORT DATA
========================= */

document.getElementById("exportBtn").onclick = () => {

  let csv = baseCols.join(",") + "," + currentYears.join(",") + "\n";

  filteredData.forEach(r => {
    let row = [];
    baseCols.forEach(c => row.push(r[c]));
    currentYears.forEach(y => row.push(r[y] || ""));
    csv += row.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "exported_data.csv";
  a.click();
};

/* =========================
   TOGGLE VIEW
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

  if (!filteredData.length) return;

  if (activeView === "table") {
    tableContainer.style.display = "block";
    chartContainer.style.display = "none";
  } else {
    tableContainer.style.display = "none";
    chartContainer.style.display = "block";
  }
}

/* =========================
   ACCORDION FILTER BEHAVIOR
========================= */

document.querySelectorAll(".accordion-header").forEach(header => {
  header.addEventListener("click", function () {

    const targetId = this.dataset.target;
    const targetPanel = document.getElementById(targetId);

    const isOpen = targetPanel.classList.contains("open");

    // Close all panels first
    document.querySelectorAll(".panel").forEach(panel => {
      panel.classList.remove("open");
    });

    // If it was not open, open it
    if (!isOpen) {
      targetPanel.classList.add("open");
    }
  });
});
