let chartInstance = null;
const sheetURL = 'data.csv';

function toggleSection(id){
  document.querySelectorAll('.panel').forEach(p=>p.style.display='none');
  const el = document.getElementById(id);
  el.style.display = 'block';
}

document.getElementById('tableToggle').onclick = ()=>{
  document.getElementById('welcomeTable').style.display='block';
  document.getElementById('welcomeChart').style.display='none';
  document.getElementById('tableContainer').style.display='none';
  document.getElementById('chartContainer').style.display='none';
};

document.getElementById('chartToggle').onclick = ()=>{
  document.getElementById('welcomeTable').style.display='none';
  document.getElementById('welcomeChart').style.display='block';
  document.getElementById('tableContainer').style.display='none';
  document.getElementById('chartContainer').style.display='none';
};

fetch(sheetURL)
.then(res=>res.text())
.then(text=>{

  const rows = text.trim().split('\n');
  const headers = rows.shift().split(',');
  const years = headers.filter(h=>/^\d{4}$/.test(h));
  const baseCols = headers.filter(h=>!/^\d{4}$/.test(h));

  const data = rows.map(r=>{
    const cols = r.split(',');
    let obj={};
    headers.forEach((h,i)=>{
      obj[h]=cols[i]||'';
    });
    return obj;
  });

  const indicatorSet = [...new Set(data.map(d=>d[baseCols[0]]))];
  const countrySet = [...new Set(data.map(d=>d[baseCols[2]]))];

  const indicatorDiv = document.getElementById('indicatorFilters');
  const countryDiv = document.getElementById('countryFilters');
  const yearDiv = document.getElementById('yearFilters');

  indicatorSet.forEach(i=>indicatorDiv.innerHTML+=`<label><input type="checkbox" value="${i}">${i}</label>`);
  countrySet.forEach(c=>countryDiv.innerHTML+=`<label><input type="checkbox" value="${c}">${c}</label>`);
  years.forEach(y=>yearDiv.innerHTML+=`<label><input type="checkbox" value="${y}">${y}</label>`);

  function getChecked(id){
    return [...document.querySelectorAll(`#${id} input:checked`)].map(cb=>cb.value);
  }

  document.getElementById('showBtn').onclick=()=>{

    const selectedI = getChecked('indicatorFilters');
    const selectedC = getChecked('countryFilters');
    const selectedY = getChecked('yearFilters');

    const filtered = data.filter(d=>
      (!selectedI.length || selectedI.includes(d[baseCols[0]])) &&
      (!selectedC.length || selectedC.includes(d[baseCols[2]]))
    );

    renderTable(filtered, selectedY.length?selectedY:years);
    renderChartDropdown(filtered, years);
  };

  function renderTable(rows, yearsToShow){

    const table = document.querySelector('#dataTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    thead.innerHTML='';
    tbody.innerHTML='';

    let headerRow='<tr>';
    baseCols.forEach(c=>headerRow+=`<th>${c}</th>`);
    yearsToShow.forEach(y=>headerRow+=`<th>${y}</th>`);
    headerRow+='</tr>';
    thead.innerHTML=headerRow;

    rows.forEach(r=>{
      let tr='<tr>';
      baseCols.forEach(c=>tr+=`<td>${r[c]||''}</td>`);
      yearsToShow.forEach(y=>{
        let val=r[y];
        tr+=`<td>${(val && val!=='0')?val:''}</td>`;
      });
      tr+='</tr>';
      tbody.innerHTML+=tr;
    });

    document.getElementById('welcomeTable').style.display='none';
    document.getElementById('tableContainer').style.display='block';
  }

  function renderChartDropdown(rows, years){

    const indSel=document.getElementById('chartIndicator');
    const cSel=document.getElementById('chartCountry');

    indSel.innerHTML='';
    cSel.innerHTML='';

    [...new Set(rows.map(r=>r[baseCols[0]]))].forEach(i=>indSel.innerHTML+=`<option>${i}</option>`);
    [...new Set(rows.map(r=>r[baseCols[2]]))].forEach(c=>cSel.innerHTML+=`<option>${c}</option>`);

    indSel.onchange=drawChart;
    cSel.onchange=drawChart;

    document.getElementById('welcomeChart').style.display='none';
    document.getElementById('chartContainer').style.display='block';

    drawChart();

    function drawChart(){

      const indicator=indSel.value;
      const country=cSel.value;

      const record=rows.find(r=>r[baseCols[0]]===indicator && r[baseCols[2]]===country);
      if(!record)return;

      const values=years.map(y=>{
        const v=record[y];
        return (v && v!=='0')?Number(v):null;
      });

      if(chartInstance) chartInstance.destroy();

      chartInstance=new Chart(document.getElementById('chartCanvas'),{
        type:'line',
        data:{
          labels:years,
          datasets:[{
            label:`${indicator} - ${country}`,
            data:values,
            borderWidth:2,
            tension:0.3
          }]
        },
        options:{responsive:true,maintainAspectRatio:false}
      });
    }
  }

});
