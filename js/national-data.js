/* Real KNIME data integration for Charts 1, 2, 3, 5 and 6. */
(async () => {
  const d3 = window.d3, $ = s => document.querySelector(s);
  const people = document.body.dataset.page === 'age-sex';
  const year = $('#year'), slider = $('#year-range'), road = $('#road-user');
  let sex = 'All', records, heatRoad=null, heatAge=null;
  const count = d3?.format(','), pct = d3?.format('.2f');
  const ages = ['0-7','8-16','17-25','26-39','40-64','65-74','75+'];
  const numeric = ['Year','Hospitalisations','Year_total','Percentage','Age order',...ages,'75++'];
  const types = ['national_trend','road_user_shares','age_sex','road_user_age'];
  try {
    if (!d3) throw new Error('D3 could not load. Check your internet connection.');
    records = (await window.dashboardData).filter(row=>types.includes(row.Data_type)).map(source => {
      const row={...source};
      numeric.forEach(k => { if (k in row) row[k] = row[k].trim() === '' ? null : Number(row[k]); });
      // The source export calls its oldest age band "75++". Display it as 75+.
      if ('75++' in row) row['75+'] = row['75++'];
      if (!types.includes(row.Data_type) || !Number.isFinite(row.Year)) throw new Error('Invalid CSV record.');
      return row;
    });
    if (records.length !== 429) throw new Error('Expected the complete 429-row national export.');
    const trend = records.filter(r => r.Data_type === 'national_trend');
    const shares = records.filter(r => r.Data_type === 'road_user_shares');
    for (const r of trend) {
      const group = shares.filter(s => s.Year === r.Year);
      if (group.length !== 12 || d3.sum(group,s=>s.Hospitalisations)!==r.Hospitalisations || Math.abs(d3.sum(group,s=>s.Percentage)-100)>0.001) throw new Error('Annual road-user totals do not reconcile.');
    }
    const names = [...new Set(shares.map(r=>r.Road_user))];
    const color = d3.scaleOrdinal(["Car driver", "Car passenger", "Car unknown position", "Bus occupant", "Heavy transport driver", "Heavy transport passenger", "Heavy transport unknown position", "Motorcyclist", "Pedal cyclist", "Pedestrian", "Pick-up truck or van occupant", "Other or unknown"], ['#4f8fcf','#8bbbe8','#c3dcf4','#f1dc6b','#3fae8a','#7fcdb1','#bfe6d6','#f2a65a','#e08fb8','#9f8fd0','#e07a5f','#aab2bf']);
    for(let y=2011;y<=2021;y++) year.add(new Option(y,y,false,y===2021));
    if(road){road.replaceChildren(new Option('All road users','all'),...names.map(n=>new Option(n,n)));}
    $('#filter-note').textContent = people ? 'Year updates both charts. Sex applies only to age-and-sex bars. The heatmap includes both sexes.' : 'Year updates the donut, state bubbles and timeline. Road user highlights donut and stacked bars. Sex breakdowns are available on People.';
    if(!people) $('#sex')?.querySelectorAll('button').forEach(b=>b.disabled=true);
    const dialog = $('#details');
    $('#close-dialog').onclick=()=>dialog.close();
    document.querySelectorAll('[data-info]').forEach(b=>b.onclick=()=>{ $('#detail-title').textContent=b.closest('section').querySelector('h2').textContent; $('#detail-text').textContent=b.dataset.info==='bubble'?'BITRE / AIHW state workbook. X: hospitalisations; Y: bed days divided by hospitalisations; bubble area: total bed days. Counts describe hospital burden, not risk.':'Source: BITRE / AIHW, KNIME national_dashboard.csv, 2011–2021. Counts are hospitalisations, not population-adjusted risk. Road-user percentages include all 12 categories. Select View data below a chart for exact values.'; dialog.showModal(); });
    function base(id,height=240){const host=$('#'+id);host.replaceChildren();const card=host.closest('section');const w=Math.max(320,host.clientWidth),h=Math.max(100,host.clientHeight);const svg=d3.select(host).append('svg').attr('viewBox',`0 0 ${w} ${h}`).attr('role','group').attr('aria-label',host.closest('section').querySelector('h2').textContent);svg.style('position','absolute').style('inset','0').style('width','100%').style('height','100%');svg.append('title').text(svg.attr('aria-label'));return {svg,w,h,host};}
    function tip(mark,text){mark.attr('tabindex',0).attr('aria-label',text).append('title').text(text);}
    function table(host,headers,rows){let button=host.parentElement.querySelector('.real-table-button:not(.donut-detail-button):not(.fn-detail-button)');if(!button){button=document.createElement('button');button.type='button';button.className='real-table-button';button.textContent='View data';host.after(button);}button.onclick=()=>{dialog.querySelectorAll('.dialog-table').forEach(e=>e.remove());$('#detail-title').textContent=host.closest('section').querySelector('h2').textContent;$('#detail-text').textContent='BITRE / AIHW · KNIME export. Blank fields mean unavailable or not applicable; they are not zero.';const t=document.createElement('table');t.className='dialog-table';const head=t.createTHead().insertRow();headers.forEach(v=>{const th=document.createElement('th');th.scope='col';th.textContent=v;head.append(th);});const body=t.createTBody();rows.forEach(row=>{const tr=body.insertRow();row.forEach(v=>{tr.insertCell().textContent=v;});});dialog.append(t);dialog.showModal();};}
    const shortRoad=n=>({'Car unknown position':'Car unknown','Heavy transport driver':'Heavy driver','Heavy transport passenger':'Heavy passenger','Heavy transport unknown position':'Heavy unknown','Pick-up truck or van occupant':'Pick-up / van','Other or unknown':'Other / unknown'}[n]||n);
    function drawShareDonut(host,rows,yr,large){
      const layout=document.createElement('div');layout.className='share-donut-layout'+(large?' large':'');host.append(layout);
      const chart=d3.select(layout).append('svg').attr('viewBox','0 0 240 240').attr('role','img').attr('aria-label','Road-user shares, '+yr);
      const arc=d3.arc().innerRadius(63).outerRadius(106),total=d3.sum(rows,r=>r.Hospitalisations);
      const slices=chart.append('g').attr('transform','translate(120,120)').selectAll('path').data(d3.pie().value(r=>r.Hospitalisations).sort(null)(rows)).join('path').attr('d',arc).attr('fill',r=>road.value==='all'||road.value===r.data.Road_user?color(r.data.Road_user):'#e7edf5').attr('stroke','white').attr('stroke-width',.7);
      slices.each(function(r){d3.select(this).append('title').text(r.data.Road_user+': '+count(r.data.Hospitalisations)+' ('+pct(r.data.Percentage)+'%)');});
      chart.append('text').attr('x',120).attr('y',115).attr('text-anchor','middle').attr('font-weight',700).text(count(total));chart.append('text').attr('x',120).attr('y',136).attr('text-anchor','middle').text('hospitalisations');
      const legend=document.createElement('div');legend.className='share-side-legend';layout.append(legend);
      rows.forEach(r=>{const item=document.createElement(large?'div':'button');item.className='share-legend-item';item.title=r.Road_user;const swatch=document.createElement('i');swatch.style.background=color(r.Road_user);const name=document.createElement('span');name.textContent=large?r.Road_user:shortRoad(r.Road_user);const value=document.createElement('strong');value.textContent=(large?count(r.Hospitalisations)+' · ':'')+pct(r.Percentage)+'%';item.append(swatch,name,value);if(!large){item.type='button';item.setAttribute('aria-pressed',String(road.value===r.Road_user));item.style.opacity=road.value==='all'||road.value===r.Road_user?'1':'.4';item.onclick=()=>{road.value=road.value===r.Road_user?'all':r.Road_user;render();};}legend.append(item);});
      if(large){
        const info=document.createElement('p');info.className='donut-hover-info';info.style.cssText='padding:10px;background:#eef5fd;border-radius:8px;font-size:14px';info.textContent='Hover a slice or label for details. Click to keep it highlighted.';host.append(info);
        let pinned=null;
        const focus=name=>{slices.attr('fill',d=>color(d.data.Road_user)).attr('opacity',d=>!name||d.data.Road_user===name?1:.22).attr('stroke',d=>d.data.Road_user===name?'#33415c':'white').attr('stroke-width',d=>d.data.Road_user===name?2.5:.7);const r=rows.find(r=>r.Road_user===name);info.textContent=r?`${yr} · ${r.Road_user}: ${count(r.Hospitalisations)} hospitalisations (${pct(r.Percentage)}%).`:'Hover a slice or label for details. Click to keep it highlighted.';};
        const toggle=name=>{pinned=pinned===name?null:name;focus(pinned);};
        slices.attr('tabindex',0).attr('role','button').attr('aria-label',d=>`${d.data.Road_user}: ${count(d.data.Hospitalisations)} hospitalisations, ${pct(d.data.Percentage)} percent`).style('cursor','pointer').on('mouseenter',(e,d)=>{if(!pinned)focus(d.data.Road_user);}).on('mouseleave',()=>focus(pinned)).on('click',(e,d)=>toggle(d.data.Road_user)).on('keydown',(e,d)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(d.data.Road_user);}});
        [...legend.children].forEach((item,i)=>{const name=rows[i].Road_user;item.tabIndex=0;item.setAttribute('role','button');item.style.cursor='pointer';item.onmouseenter=()=>{if(!pinned)focus(name);};item.onmouseleave=()=>focus(pinned);item.onclick=()=>toggle(name);item.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(name);}};});
      }else{slices.style('cursor','pointer').on('click',(e,d)=>{road.value=road.value===d.data.Road_user?'all':d.data.Road_user;render();});}

    }
    function axes(svg,x,y,w,h,left=55,bottom=32){svg.append('g').attr('transform',`translate(${left},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(d3.format('~s')));svg.append('g').attr('transform',`translate(0,${h-bottom})`).call(d3.axisBottom(x).tickFormat(d3.format('d')));}
    function render(){const yr=+year.value;slider.value=yr;document.querySelectorAll('[data-year]').forEach(e=>e.textContent=yr);
      $('#status').textContent=`BITRE / AIHW · KNIME export · ${yr} · ${people?sex+' sexes; heatmap: both sexes':'all sexes; all 12 road-user categories'}. Location includes First Nations remoteness.`;
      if(!people){
        let {svg,w,h,host}=base('trend');const x=d3.scaleLinear().domain([2011,2021]).range([55,w-25]),y=d3.scaleLinear().domain([30000,42000]).range([h-32,15]);svg.append('g').attr('transform','translate(55,0)').call(d3.axisLeft(y).tickValues([30000,35000,40000]).tickFormat(v=>v/1000+'k').tickSize(-(w-80)).tickPadding(8)).call(g=>g.select('.domain').remove()).call(g=>g.selectAll('line').attr('stroke','#e6ecf5'));svg.append('g').attr('transform',`translate(0,${h-32})`).call(d3.axisBottom(x).tickValues(trend.map(r=>r.Year)).tickFormat(d3.format('d')).tickSize(0).tickPadding(10)).call(g=>g.select('.domain').remove()).call(g=>g.selectAll('text').attr('font-weight',v=>v===yr?700:400));svg.append('path').datum(trend).attr('d',d3.area().x(r=>x(r.Year)).y0(y(30000)).y1(r=>y(r.Hospitalisations))).attr('fill','#5b9bd5').attr('fill-opacity',.13);svg.append('path').datum(trend).attr('d',d3.line().x(r=>x(r.Year)).y(r=>y(r.Hospitalisations))).attr('fill','none').attr('stroke','#5b9bd5').attr('stroke-width',3).attr('stroke-linejoin','round');trend.forEach(r=>{const dot=svg.append('circle').attr('cx',x(r.Year)).attr('cy',y(r.Hospitalisations)).attr('r',r.Year===yr?10:5.5).attr('fill',r.Year===yr?'#f4b860':'#5b9bd5').attr('stroke','white').attr('stroke-width',2).attr('role','button').style('cursor','pointer').on('click',()=>{year.value=r.Year;render();}).on('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();year.value=r.Year;render();}});tip(dot,`${r.Year}: ${count(r.Hospitalisations)} hospitalisations. Select year.`);});table(host,['Year','Hospitalisations'],trend.map(r=>[r.Year,count(r.Hospitalisations)]));
        ({svg,w,h,host}=base('donut',350));const selected=shares.filter(r=>r.Year===yr);host.replaceChildren();drawShareDonut(host,selected,yr,false);table(host,['Year','Road user','Hospitalisations','Share (%)'],selected.map(r=>[yr,r.Road_user,count(r.Hospitalisations),pct(r.Percentage)]));
        let detailButton=host.parentElement.querySelector('.donut-detail-button');if(!detailButton){detailButton=document.createElement('button');detailButton.type='button';detailButton.hidden=true;detailButton.className='real-table-button donut-detail-button';detailButton.textContent='View in detail ↗';host.after(detailButton);}detailButton.onclick=()=>{dialog.querySelectorAll('.dialog-table').forEach(e=>e.remove());$('#detail-title').textContent='Road-user shares · '+yr;$('#detail-text').textContent='All 12 categories · BITRE / AIHW · real KNIME export. Percentages use the full annual total.';const panel=document.createElement('div');panel.className='dialog-table donut-detail';dialog.append(panel);drawShareDonut(panel,selected,yr,true);dialog.showModal();};
        ({svg,w,h,host}=base('stack',280));const years=trend.map(r=>r.Year),xb=d3.scaleBand().domain(years).range([55,w-15]).padding(.25),yp=d3.scaleLinear().domain([0,100]).range([h-35,15]);svg.append('g').attr('transform','translate(55,0)').call(d3.axisLeft(yp).ticks(5).tickFormat(v=>v+'%'));svg.append('g').attr('transform',`translate(0,${h-35})`).call(d3.axisBottom(xb));years.forEach(yy=>{let sum=0;shares.filter(r=>r.Year===yy).forEach(r=>{const start=sum;sum+=r.Percentage;const bar=svg.append('rect').attr('x',xb(yy)).attr('y',yp(sum)).attr('height',yp(start)-yp(sum)).attr('width',xb.bandwidth()).attr('fill',road.value==='all'||road.value===r.Road_user?color(r.Road_user):'#e7edf5').style('cursor','pointer').on('click',()=>{road.value=road.value===r.Road_user?'all':r.Road_user;year.value=yy;render();});tip(bar,`${yy}, ${r.Road_user}: ${pct(r.Percentage)}%, ${count(r.Hospitalisations)} hospitalisations`);});if(yy===yr)svg.append('rect').attr('x',xb(yy)-3).attr('y',12).attr('width',xb.bandwidth()+6).attr('height',h-44).attr('fill','none').attr('stroke','#344966').attr('stroke-width',2).attr('pointer-events','none');});table(host,['Year','Road user','Share (%)'],shares.map(r=>[r.Year,r.Road_user,pct(r.Percentage)]));
        for(const id of ['stack']){const button=document.createElement('button');button.className='real-legend';button.type='button';button.textContent='Road-user colour key (12)';button.onclick=()=>{dialog.querySelectorAll('.dialog-table').forEach(e=>e.remove());$('#detail-title').textContent='Road-user colour key';$('#detail-text').replaceChildren();names.forEach(n=>{const item=document.createElement('button'),swatch=document.createElement('span');swatch.style.cssText='display:inline-block;width:14px;height:14px;margin-right:10px;background:'+color(n);item.type='button';item.style.cssText='display:block;margin:6px 0;padding:6px;border:0;background:transparent;cursor:pointer';item.onclick=()=>{road.value=road.value===n?'all':n;dialog.close();render();};item.append(swatch,document.createTextNode(n));$('#detail-text').append(item);});dialog.showModal();};$('#'+id).after(button);}
        const metrics=document.querySelectorAll('.metrics article');const n=trend.find(r=>r.Year===yr);metrics[0].querySelector('strong').textContent=count(n.Hospitalisations);metrics[1].querySelector('strong').textContent=pct((n.Hospitalisations/trend[0].Hospitalisations-1)*100)+'%';metrics[2].querySelector('strong').textContent=d3.greatest(trend,r=>r.Hospitalisations).Year;metrics.forEach((m,i)=>{if(i<3)m.querySelector('.metric-note').textContent=i===1?`2011 to ${yr}`:'National hospitalisations · all sexes';});
      } else {
        let {svg,w,h,host}=base('age-chart',280);
        const rows=records.filter(r=>r.Data_type==='age_sex'&&r.Year===yr);
        const margin=Math.max(55,w*.13), plotBottom=h-28;
        const x=d3.scaleBand().domain(ages).range([margin,w-margin*.55]).padding(.3);
        const maximum=d3.max(rows,r=>r.Hospitalisations)||1;
        const step=Math.max(1000,Math.ceil(maximum/3/1000)*1000), ceiling=step*3;
        const y=d3.scaleLinear().domain([0,ceiling]).range([plotBottom,12]);
        svg.append('g').attr('transform',`translate(${margin},0)`).call(d3.axisLeft(y).tickValues([0,step,step*2,ceiling]).tickFormat(v=>v/1000+'k').tickSize(-(w-margin*1.55)).tickPadding(8)).call(g=>g.selectAll('line').attr('stroke','#e6ecf5')).call(g=>g.select('.domain').remove());
        svg.append('g').attr('transform',`translate(0,${plotBottom})`).call(d3.axisBottom(x).tickSize(0).tickPadding(10)).call(g=>g.select('.domain').remove());
        const bw=Math.min(22,x.bandwidth()/2);
        rows.filter(r=>sex==='All'||r.Sex===sex).forEach(r=>{
          const middle=x(r['Age group'])+x.bandwidth()/2;
          const bar=svg.append('rect').attr('x',sex==='All'?middle+(r.Sex==='Female'?0:-bw):middle-bw/2).attr('y',y(r.Hospitalisations)).attr('width',bw).attr('height',y(0)-y(r.Hospitalisations)).attr('rx',4).attr('fill',r.Sex==='Male'?'#5b9bd5':'#f4b860');
          tip(bar,`${r['Age group']}, ${r.Sex}: ${count(r.Hospitalisations)}`);
        });
        table(host,['Age group','Sex','Hospitalisations'],rows.filter(r=>sex==='All'||r.Sex===sex).map(r=>[r['Age group'],r.Sex,count(r.Hospitalisations)]));
        ({svg,w,h,host}=base('people-heatmap',480));
        const heat=records.filter(r=>r.Data_type==='road_user_age'&&r.Year===yr);
        const rowOrder=['Car driver','Car passenger','Car unknown position','Bus occupant','Heavy transport driver','Heavy transport passenger','Heavy transport unknown position','Motorcyclist','Pedal cyclist','Pedestrian','Pick-up truck or van occupant','Other or unknown'];
        const left=Math.min(245,w*.24), bottom=24;
        const xx=d3.scaleBand().domain(ages).range([left,w-4]).paddingInner(.012);
        const yy=d3.scaleBand().domain(rowOrder).range([26,h-bottom]).paddingInner(.09);
        const max=d3.max(heat,r=>d3.max(ages,a=>r[a]))||1;
        const scale=d3.scaleSqrt().domain([0,max]).range(['#eef4fc','#78a5d6']);
        const choose=(mark,fn)=>mark.attr('tabindex',0).attr('role','button').style('cursor','pointer').on('click',fn).on('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();}});
        ages.forEach(a=>{
          const label=svg.append('text').attr('x',xx(a)+xx.bandwidth()/2).attr('y',16).attr('text-anchor','middle').style('font-weight',heatAge===a?'700':'400').text(a);
          choose(label,()=>{heatAge=heatAge===a?null:a;render();});
          label.attr('aria-label',`Focus age ${a}`).attr('aria-pressed',String(heatAge===a));
        });
        rowOrder.forEach(name=>{
          const r=heat.find(r=>r.Road_user===name);if(!r)return;
          const cy=yy(name)+yy.bandwidth()/2;
          const label=svg.append('text').attr('x',left-12).attr('y',cy).attr('dominant-baseline','middle').attr('text-anchor','end').style('font-weight',heatRoad===name?'700':'400').text(name==='Heavy transport unknown position'?'Heavy transport unknown':name);
          choose(label,()=>{heatRoad=heatRoad===name?null:name;render();});
          label.attr('aria-label',`Focus ${name}`).attr('aria-pressed',String(heatRoad===name));
          const labelWidth=label.node().getComputedTextLength();
          svg.append('rect').attr('x',left-23-labelWidth).attr('y',cy-5).attr('width',10).attr('height',10).attr('rx',3).attr('fill',color(name));
          ages.forEach(a=>{
            const focused=(!heatRoad||heatRoad===name)&&(!heatAge||heatAge===a);
            const group=svg.append('g').attr('opacity',focused?1:.22);
            const cell=group.append('rect').attr('x',xx(a)).attr('y',yy(name)).attr('width',xx.bandwidth()).attr('height',yy.bandwidth()).attr('rx',5).attr('fill',r[a]===null?'#eee':scale(r[a]));
            tip(cell,`${name}, age ${a}: ${r[a]===null?'Unavailable':count(r[a])} hospitalisations`);
            group.append('text').attr('x',xx(a)+xx.bandwidth()/2).attr('y',cy).attr('dominant-baseline','middle').attr('text-anchor','middle').style('fill','#203B50','important').attr('pointer-events','none').text(r[a]===null?'—':count(r[a]));
          });
        });
        const gradient=svg.append('defs').append('linearGradient').attr('id','heat-blue-key');
        gradient.append('stop').attr('offset','0%').attr('stop-color','#eef4fc');gradient.append('stop').attr('offset','100%').attr('stop-color','#78a5d6');
        svg.append('text').attr('x',0).attr('y',h-5).text('Fewer');
        svg.append('rect').attr('x',43).attr('y',h-14).attr('width',150).attr('height',9).attr('rx',5).attr('fill','url(#heat-blue-key)');
        svg.append('text').attr('x',201).attr('y',h-5).text('More');
        table(host,['Road user',...ages],rowOrder.map(n=>heat.find(r=>r.Road_user===n)).filter(Boolean).map(r=>[r.Road_user,...ages.map(a=>r[a]===null?'Unavailable':count(r[a]))]));

      }
    }
    let playback;
    function stopPlayback(){clearInterval(playback);playback=null;if(playButton){playButton.textContent='▶ Play years';playButton.setAttribute('aria-pressed','false');}}
    const playButton=document.createElement('button');
    if(playButton){playButton.type='button';playButton.className='reset';playButton.id='play-years';playButton.textContent='▶ Play years';playButton.setAttribute('aria-pressed','false');playButton.style.cssText='margin:8px 0 12px;width:100%';slider.parentElement.insertBefore(playButton,people?$('#sex').closest('fieldset'):road.previousElementSibling);playButton.onclick=()=>{if(playback){stopPlayback();return;}if(+year.value===2021)year.value='2011';render();playButton.textContent='❚❚ Pause years';playButton.setAttribute('aria-pressed','true');playback=setInterval(()=>{if(+year.value>=2021){stopPlayback();return;}year.value=String(+year.value+1);render();},1200);};window.addEventListener('pagehide',stopPlayback);}
    year.onchange=()=>{stopPlayback();render();};slider.oninput=()=>{stopPlayback();year.value=slider.value;render();};if(road)road.onchange=render;
    $('#sex')?.querySelectorAll('button').forEach(b=>b.onclick=()=>{sex=b.textContent;$('#sex')?.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();});
    $('#reset').onclick=()=>{stopPlayback();year.value='2021';if(road)road.value='all';sex='All';heatRoad=null;heatAge=null;$('#sex')?.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent==='All')));render();};
    const originalRender=render;render=()=>{document.querySelectorAll('.real-legend').forEach(e=>e.remove());originalRender();document.dispatchEvent(new Event('national-year-change'));};
    render();let frame;new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(render);}).observe($('main'));
  } catch(error){$('#status').textContent='Real data could not load: '+error.message;document.querySelectorAll(people?'#age-chart,#people-heatmap':'#trend,#donut,#stack').forEach(el=>el.textContent='Open with VS Code Live Server and check data/processed/national_dashboard.csv. '+error.message);console.error(error);}
})();
