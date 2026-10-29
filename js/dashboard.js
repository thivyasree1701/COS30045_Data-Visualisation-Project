/* AI assistance: Codex implemented this design-only D3 preview.
 * These normalized values describe example geometry, NOT injury records.
 * Do not export them, quote them as findings, or replace team CSV modules with them.
 * Final integration must use verified KNIME exports and preserve all road-user categories.
 */
(() => {
  const year = document.querySelector('#year');
  const slider = document.querySelector('#year-range');
  const road = document.querySelector('#road-user');
  const status = document.querySelector('#status');
  let sex = 'All';
  for (let y = 2011; y <= 2021; y++) year.add(new Option(y, y, false, y === 2021));
  const names = ['Car occupant', 'Motorcyclist', 'Pedal cyclist', 'Pedestrian'];
  const colors = ['#9BC7E5', '#F2C3A2', '#A8D6C5', '#CDB8DE'];
  const years = Array.from({length:11}, (_, i) => 2011 + i);
  const exampleTrend = [40,41,45,47,53,59,60,61,62,57,61];
  const dialog = document.querySelector('#details');
  const notes = {
    about: ['About this design preview', 'This is a visual prototype, not a completed analysis. KPI figures remain blank until validated data is available. The four charts use illustrative geometry. Year and sex controls change the selection state only; road-user selection highlights a category. Existing team chart modules and the road-users.html scaffold are preserved for integration.'],
    trend: ['National injuries over time', 'Final chart: sum hospitalisations by year from 2011 to 2021. Show real counts on the vertical axis and every year on the horizontal axis. Clicking or keyboard-selecting a point chooses the comparison year. The preview line is illustrative and has no count scale.'],
    donut: ['Road-user shares', 'Final chart: show each road-user group’s share within the selected year and supported sex selection. This preview shows four example groups with no reported percentages. Retain all actual source categories or document any grouping. Include counts and percentages in the final data table.'],
    stack: ['Road-user shares over time', 'Final chart: divide each group’s annual count by that year’s total. Each bar must total 100%. Use the same group colours as the donut and bubble chart, with labels and a table so colour is not the only way to read the chart. Preview proportions are illustrative.'],
    bubble: ['Hospitalisations & bed days', 'Final chart: hospitalisations on the horizontal axis and compatible bed days on the vertical axis. One bubble per road-user group. A meaningful third measure for bubble area has not been chosen; positions and sizes here are illustrative. Do not interpret bubble size as risk or severity.']
  };
  function showDetails(key) { const [title, text] = notes[key]; document.querySelector('#detail-title').textContent = title; document.querySelector('#detail-text').textContent = text; dialog.showModal(); }

  document.querySelector('#close-dialog').onclick = () => dialog.close();
  document.querySelectorAll('[data-info]').forEach(b => b.onclick = () => showDetails(b.dataset.info));
  function update() {
    slider.value = year.value;
    document.querySelectorAll('[data-year]').forEach(el => el.textContent = year.value);
    status.textContent = `Preview selection: ${year.value} · ${road.value === 'all' ? 'All road users' : road.value} · ${sex === 'All' ? 'All sexes' : sex}. Shapes remain illustrative.`;
    if (window.d3) render();
  }
  year.onchange = update;
  slider.oninput = () => { year.value = slider.value; update(); };
  road.onchange = update;
  document.querySelectorAll('#sex button').forEach(b => b.onclick = () => { sex = b.textContent; document.querySelectorAll('#sex button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); update(); });
  document.querySelector('#reset').onclick = () => { year.value = '2021'; road.value = 'all'; sex = 'All'; document.querySelectorAll('#sex button').forEach(b => b.setAttribute('aria-pressed', String(b.textContent === 'All'))); update(); };
  if (!window.d3) { document.querySelectorAll('.plot').forEach(el => { el.innerHTML = '<p class="chart-error">Chart preview could not load. Connect to the internet and reload to load D3.</p>'; }); return; }
  const d3 = window.d3;
  function base(id, label) {
    const host = document.querySelector('#' + id); const w = Math.max(host.clientWidth, 250); const h = Math.max(host.clientHeight - 6, 130);
    d3.select(host).selectAll('*').remove();
    const svg = d3.select(host).append('svg').attr('viewBox', `0 0 ${w} ${h}`).attr('role', 'img').attr('aria-label', label + '. Design preview; illustrative values only.');
    svg.append('title').text(label + ' — illustrative preview'); return {svg,w,h};
  }
  function opacity(name) { return road.value === 'all' || road.value === name ? 1 : .22; }
  function legend(svg, w, h) {
    const g = svg.append('g').attr('transform', `translate(5,${h - 9})`);
    names.forEach((n,i) => { const x = i * (w / 4); g.append('rect').attr('x',x).attr('y',-8).attr('width',8).attr('height',8).attr('fill',colors[i]).attr('stroke','#526675'); g.append('text').attr('x',x+12).style('font-size','10px').text(n); });
  }
  function render() {
    {const {svg,w,h} = base('trend','National injury trend'); const x=d3.scaleLinear().domain([2011,2021]).range([26,w-18]); const y=d3.scaleLinear().domain([0,80]).range([h-30,12]);
      svg.append('g').attr('class','grid').attr('transform','translate(26,0)').call(d3.axisLeft(y).ticks(4).tickSize(-(w-44)).tickFormat('')); svg.append('g').attr('class','axis').attr('transform',`translate(0,${h-30})`).call(d3.axisBottom(x).tickValues(years).tickFormat(d3.format('d')).tickSize(0).tickPadding(10)).selectAll('text').style('font-size', w < 420 ? '10px' : '12px');
      svg.append('path').datum(exampleTrend).attr('d', d3.area().x((v,i)=>x(years[i])).y0(h-30).y1(v=>y(v))).attr('fill','#C8DFDB').attr('opacity',.5);
      svg.append('path').datum(exampleTrend).attr('d', d3.line().x((v,i)=>x(years[i])).y(v=>y(v))).attr('fill','none').attr('stroke','#3368A0').attr('stroke-width',2.5);
      svg.append('line').attr('x1',x(+year.value)).attr('x2',x(+year.value)).attr('y1',12).attr('y2',h-30).attr('stroke','#3368A0').attr('stroke-dasharray','3 4').attr('opacity',.4);
      const dots = svg.selectAll('.point').data(exampleTrend).join('g').attr('class','point').attr('transform',(v,i)=>`translate(${x(years[i])},${y(v)})`).attr('role','button').attr('tabindex',0).attr('aria-label',(v,i)=>`Select ${years[i]}; illustrative point`).style('cursor','pointer');
      dots.append('circle').attr('r',12).attr('fill','transparent');dots.append('circle').attr('r',(v,i)=>years[i]===+year.value?5:3).attr('fill',(v,i)=>years[i]===+year.value?'#3368A0':'white').attr('stroke','#3368A0').attr('stroke-width',2);
      dots.each(function(v,i){const chooseYear=()=>{year.value=years[i];update(); document.querySelector('#year').focus();};d3.select(this).on('click',chooseYear).on('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseYear();}});});
    }
    {const {svg,w,h}=base('donut','Road-user share'); const r=Math.min(h*.44,w*.23); const cx=w*.26,cy=h*.48;const arc=d3.arc().innerRadius(r*.70).outerRadius(r);const pie=d3.pie().sort(null)([45,28,17,10]);
      svg.append('g').attr('transform',`translate(${cx},${cy})`).selectAll('path').data(pie).join('path').attr('d',arc).attr('fill',(d,i)=>colors[i]).attr('stroke','#526675').attr('stroke-width',.8).attr('opacity',(d,i)=>opacity(names[i])).append('title').text((d,i)=>names[i]+' — illustrative share');
      svg.append('text').attr('x',cx).attr('y',cy-2).attr('text-anchor','middle').style('font-size','23px').style('font-weight','600').style('fill','#203B50').text(year.value);svg.append('text').attr('x',cx).attr('y',cy+17).attr('text-anchor','middle').style('font-size','10px').text('PREVIEW');
      names.forEach((n,i)=>{const yy=cy-45+i*30;svg.append('rect').attr('x',w*.55).attr('y',yy-9).attr('width',10).attr('height',10).attr('rx',2).attr('fill',colors[i]).attr('stroke','#526675');svg.append('text').attr('x',w*.55+18).attr('y',yy).style('font-size','12px').text(n);});
    }
    {const {svg,w,h}=base('stack','Road-user shares over time');const x=d3.scaleBand().domain(years).range([40,w-10]).padding(.30);const y=d3.scaleLinear().domain([0,100]).range([h-52,10]);svg.append('g').attr('class','grid').attr('transform','translate(40,0)').call(d3.axisLeft(y).ticks(4).tickSize(-(w-50)).tickFormat(d=>d+'%')).selectAll('text').style('font-size','10px');svg.append('g').attr('class','axis').attr('transform',`translate(0,${h-52})`).call(d3.axisBottom(x).tickSize(0).tickPadding(9)).selectAll('text').style('font-size','10px');
      years.forEach((yr,i)=>{const shares=[45-i*.6,25+i*.7,18-i*.2,12+i*.1];let start=0;shares.forEach((v,j)=>{svg.append('rect').attr('x',x(yr)).attr('y',y(start+v)).attr('height',y(start)-y(start+v)).attr('width',x.bandwidth()).attr('fill',colors[j]).attr('stroke','#526675').attr('stroke-width',.4).attr('opacity',opacity(names[j])).append('title').text(`${yr}: ${names[j]} — illustrative share`);start+=v;});});legend(svg,w,h);
    }
    {const {svg,w,h}=base('bubble','Hospitalisations and hospital bed days');const x=d3.scaleLinear().domain([0,100]).range([50,w-30]);const y=d3.scaleLinear().domain([0,100]).range([h-36,18]);[25,50,75].forEach(v=>svg.append('line').attr('x1',50).attr('x2',w-30).attr('y1',y(v)).attr('y2',y(v)).attr('stroke','#E8EEEF'));
      svg.append('path').attr('d',`M50,12 V${h-36} H${w-18}`).attr('fill','none').attr('stroke','#A9B9C4');svg.append('text').attr('x',w*.55).attr('y',h-10).attr('text-anchor','middle').style('font-size','10px').text('Hospitalisations →');svg.append('text').attr('transform',`translate(14,${h*.5}) rotate(-90)`).attr('text-anchor','middle').style('font-size','10px').text('Bed days →');
      [[80,57,19],[48,78,16],[35,38,13],[15,23,10]].forEach((p,i)=>{svg.append('circle').attr('cx',x(p[0])).attr('cy',y(p[1])).attr('r',Math.min(p[2],h*.12)).attr('fill',colors[i]).attr('stroke','#526675').attr('stroke-width',1).attr('opacity',opacity(names[i]));svg.append('text').attr('x',x(p[0])).attr('y',y(p[1])+Math.min(p[2],h*.12)+13).attr('text-anchor','middle').style('font-size','10px').text(names[i]);});
    }
  }
  let pending;
  new ResizeObserver(()=>{cancelAnimationFrame(pending);pending=requestAnimationFrame(render);}).observe(document.querySelector('.charts'));
  render();
})();
