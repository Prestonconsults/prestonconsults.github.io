let chartInstance = null;
let allData = [];
let filteredData = [];
let currentPage = 1;
let rowsPerPage = 25;
let yearColumns = [];
let otherColumns = [];

// CSV file in your GitHub repo
const sheetURL = 'data.csv';

// DOM
const indicatorPanel = document.getElementById('indicatorPanel');
const countryPanel = document.getElementById('countryPanel');
const yearPanel = document.getElementById('yearPanel');
const showBtn = document.getElementById('showBtn');
const tableContainer = document.getElementById('tableContainer');
const dataTable = document.getElementById('dataTable');
const tbody = dataTable.querySelector('tbody');
const thead = dataTable.querySelector('thead tr');
const exportBtn = document.getElementById('exportBtn');
const placeholder = document.getElementById('placeholderMessage');
const tableToggle = document.getElementById('tableToggle');
const chartToggle = document.getElementById('chartToggle');
const chartContainer = document.getElementById('chartContainer');
const ctx = document.getElementById('chartCanvas').getContext('2d');
const chartIndicatorSelect = document.getElementById('chartIndicator');
const chartCountrySelect = document.getElementById('chartCountry');
const rowsPerPageSelect = document.getElementById('rowsPerPage');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// --- FETCH DATA ---
fetch(sheetURL).then(res => res.text()).then(csvText => {
  const rows = csvText.trim().split('\n');
  const headers = rows.shift().split(',').map(h=>h.trim());
  yearColumns = headers.filter(h => /^\d{4}$/.test(h)).sort((a,b)=>a-b);
  otherColumns = headers.filter(h => !/^\d{4}$/.test(h));
  allData = rows.map(r=>{
    const cols = r.split(',');
    const obj = {};
    otherColumns.forEach((h,i)=> obj[h]=cols[i]||'');
    yearColumns.forEach((y,i)=> obj[y] = cols[otherColumns.length+i]!==undefined && cols[otherColumns.length+i]!=='0'? Number(cols[otherColumns.length+i]): null);
    return obj;
  });
  populateFilters();
  populateChartDropdowns();
});

// --- POPULATE FILTERS ---
function populateFilters(){
  createCheckboxes(indicatorPanel, [...new Set(allData.map(d=>d[otherColumns[0]]))].sort());
  createCheckboxes(countryPanel, [...new Set(allData.map(d=>d[otherColumns[2]]))].sort());
  createCheckboxes(yearPanel, yearColumns);
}

// Create checkboxes with labels
function createCheckboxes(container, items){
  container.innerHTML = '';
  items.forEach(item=>{
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${item}"> ${item}`;
    container.appendChild(label);
  });
}

// --- ACCORDION LOGIC ---
document.querySelectorAll('.accordion-header').forEach(header=>{
  header.addEventListener('click', ()=>{
    const target = document.getElementById(header.dataset.target);
    // close others
    document.querySelectorAll('.sidebar-section').forEach(s=>{ if(s!==target) s.classList.remove('active'); });
    document.querySelectorAll('.accordion-header .arrow').forEach(a=>a.style.transform='rotate(0deg)');
    target.classList.toggle('active');
    header.querySelector('.arrow').style.transform = target.classList.contains('active')?'rotate(180deg)':'rotate(0deg)';
  });
});

// --- CLICK OUTSIDE SIDEBAR CLOSE ---
document.addEventListener('click', e=>{
  if(!document.getElementById('sidebar').contains(e.target)){
    document.querySelectorAll('.sidebar-section').forEach(s=>s.classList.remove('active'));
    document.querySelectorAll('.accordion-header .arrow').forEach(a=>a.style.transform='rotate(0deg)');
  }
});

// --- GET SELECTED ---
function getSelected(container){ return Array.from(container.querySelectorAll('input[type=checkbox]:checked')).map(cb=>cb.value); }

// --- SHOW RESULTS ---
showBtn.addEventListener('click', ()=>{
  const selectedIndicators = getSelected(indicatorPanel);
  const selectedCountries = getSelected(countryPanel);
  const selectedYears = getSelected(yearPanel);

  filteredData = allData.filter(d=>(!selectedIndicators.length || selectedIndicators.includes(d[otherColumns[0]])) &&
                                   (!selectedCountries.length || selectedCountries.includes(d[otherColumns[2]])));

  if(selectedYears.length){
    filteredData = filteredData.map(d=>{
      const newObj = {...d};
      yearColumns.forEach(y=>{ if(!selectedYears.includes(y)) newObj[y]=null; });
      return newObj;
    });
  }

  currentPage = 1;
  renderTable();
  renderChart();
});

// --- RENDER TABLE ---
function renderTable(){
  placeholder.style.display = filteredData.length? 'none':'block';
  tableContainer.style.display = tableToggle.classList.contains('active') ? 'block':'none';
  chartContainer.style.display = chartToggle.classList.contains('active') ? 'block':'none';

  if(!filteredData.length){
    document.getElementById('placeholderText').textContent = 'Welcome to the Data Explorer. Please select filters and click "Show Results" to begin.';
    return;
  }

  // HEADER
  thead.innerHTML = '';
  ['Indicator','Category','Country','Notes','Source', ...yearColumns].forEach(h=>{
    const th = document.createElement('th'); th.textContent = h; thead.appendChild(th);
  });

  renderTablePage();
}

// --- TABLE PAGINATION ---
function renderTablePage(){
  tbody.innerHTML = '';
  const start = (currentPage-1)*rowsPerPage;
  const end = start+Number(rowsPerPage);
  const pageData = filteredData.slice(start,end);
  pageData.forEach(d=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${d[otherColumns[0]]}</td>
                    <td>${d[otherColumns[1]]}</td>
                    <td>${d[otherColumns[2]]}</td>
                    <td>${d[otherColumns[3]] || '...'}</td>
                    <td>${d[otherColumns[4]] || '...'}</td>`;
    yearColumns.forEach(y=>{
      const td = document.createElement('td');
      td.textContent = d[y]!==null?d[y]:'...';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(filteredData.length/rowsPerPage)}`;
}

// Pagination controls
rowsPerPageSelect.addEventListener('change', ()=>{ rowsPerPage=Number(rowsPerPageSelect.value); currentPage=1; renderTablePage(); });
prevPageBtn.addEventListener('click', ()=>{ if(currentPage>1){currentPage--; renderTablePage();} });
nextPageBtn.addEventListener('click', ()=>{ if(currentPage<Math.ceil(filteredData.length/rowsPerPage)){currentPage++; renderTablePage();} });

// --- EXPORT CSV ---
exportBtn.addEventListener('click', ()=>{
  let csv='data:text/csv;charset=utf-8,';
  const headers = ['Indicator','Category','Country','Notes','Source', ...yearColumns];
  csv+= headers.join(',')+'\n';
  filteredData.forEach(d=>{
    const row = [...headers].map(h=>d[h]!==undefined && d[h]!==null && d[h]!=='0'? d[h]: '...').join(',');
    csv+= row+'\n';
  });
  const link=document.createElement('a');
  link.href=encodeURI(csv);
  link.download='preston_data.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// --- TABLE / CHART TOGGLE ---
tableToggle.addEventListener('click', ()=>{ tableToggle.classList.add('active'); chartToggle.classList.remove('active'); renderTable(); });
chartToggle.addEventListener('click', ()=>{ chartToggle.classList.add('active'); tableToggle.classList.remove('active'); renderTable(); });

// --- CHART ---
function populateChartDropdowns(){
  chartIndicatorSelect.innerHTML='';
  chartCountrySelect.innerHTML='';
  const indicators = [...new Set(allData.map(d=>d[otherColumns[0]]))];
  const countries = [...new Set(allData.map(d=>d[otherColumns[2]]))];
  indicators.forEach(i=>{ const opt=document.createElement('option'); opt.value=i; opt.textContent=i; chartIndicatorSelect.appendChild(opt); });
  countries.forEach(c=>{ const opt=document.createElement('option'); opt.value=c; opt.textContent=c; chartCountrySelect.appendChild(opt); });
}

function renderChart(){
  if(!filteredData.length || !chartToggle.classList.contains('active')) return;
  const indicator = chartIndicatorSelect.value;
  const country = chartCountrySelect.value;
  const plotData = filteredData.filter(d=>d[otherColumns[0]]===indicator && d[otherColumns[2]]===country)[0];
  if(!plotData) return;
  const labels = yearColumns;
  const values = yearColumns.map(y=>plotData[y]!==null?plotData[y]:0);
  if(chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx,{
    type:'line',
    data:{labels, datasets:[{label:`${indicator} - ${country}`, data:values, borderColor:'blue', fill:false}]},
    options:{responsive:true, plugins:{legend:{display:true}}, scales:{y:{beginAtZero:false}}}
  });
}

chartIndicatorSelect.addEventListener('change', renderChart);
chartCountrySelect.addEventListener('change', renderChart);
