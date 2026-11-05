/* Derived insights use the same KNIME rows and filter values as the charts. */
(() => {
 const fmt=new Intl.NumberFormat('en-AU'), n=v=>fmt.format(Math.round(v));
 const pct=v=>Math.abs(v).toFixed(1), direction=v=>v>=0?'increased':'decreased';
 const max=(rows,key)=>rows.reduce((a,b)=>!a||key(b)>key(a)?b:a,null);
 const change=(a,b)=>a?`${direction(b-a)} by ${pct((b-a)/a*100)}%`:'has no comparable baseline';
 let records=[],queued=false;const seen=new WeakSet();
 function put(id,text){
  const host=document.getElementById(id);if(!host||!text)return;
  const card=host.closest('.chart-card');let caption=card.querySelector('.story-insight');
  if(!caption){caption=document.createElement('p');caption.className='story-insight';card.querySelector('.card-header').after(caption);}
  if(caption.textContent!==text)caption.textContent=text; const modal=document.querySelector(".expanded-chart-dialog[open]");if(modal?.querySelector("h2")?.textContent===card.querySelector("h2")?.textContent){const expanded=modal.querySelector(".expanded-story");if(expanded&&expanded.textContent!==text)expanded.textContent=text;}
 }
 function render(){
  queued=false;if(!records.length)return;
  const year=+document.querySelector('#year').value,road=document.querySelector('#road-user')?.value||'all';
  const rows=type=>records.filter(r=>r.Data_type===type),at=type=>rows(type).filter(r=>+r.Year===year);
  const trend=rows('national_trend').sort((a,b)=>a.Year-b.Year),first=trend[0],last=trend.at(-1),peak=max(trend,r=>+r.Hospitalisations);
  if(first&&last)put('trend',`2011–2021: hospitalisations ${change(+first.Hospitalisations,+last.Hospitalisations)}. Peak: ${peak.Year} (${n(peak.Hospitalisations)}).`);
  const shares=at('road_user_shares'),largest=max(shares,r=>+r.Hospitalisations),selected=shares.find(r=>r.Road_user===road);
  const item=selected||largest;
  if(item)put('donut',`${year}: ${item.Road_user} ${selected?'accounts for':'has the largest share at'} ${(+item.Percentage).toFixed(1)}% (${n(item.Hospitalisations)} hospitalisations).`);
  const baseline=rows('road_user_shares').filter(r=>+r.Year===2011);
  const differences=shares.map(r=>({...r,base:baseline.find(b=>b.Road_user===r.Road_user)})).filter(r=>r.base);
  const mover=selected?differences.find(r=>r.Road_user===road):max(differences,r=>Math.abs(+r.Percentage-r.base.Percentage));
  if(mover)put('stack',year===2011?'2011 is the baseline. Select a later year to compare road-user shares.':`${mover.Road_user}: ${(+mover.base.Percentage).toFixed(1)}% in 2011 → ${(+mover.Percentage).toFixed(1)}% in ${year} (${Math.abs(mover.Percentage-mover.base.Percentage).toFixed(1)} percentage points ${mover.Percentage>=mover.base.Percentage?'higher':'lower'}).`);
  const up=max(differences,r=>r.Hospitalisations-r.base.Hospitalisations),down=max(differences,r=>r.base.Hospitalisations-r.Hospitalisations);
  if(up)put('road-bed-chart',year===2011?'Both dots show the 2011 baseline. Select a later year to see changes.':`Since 2011: ${up.Road_user} ${change(+up.base.Hospitalisations,+up.Hospitalisations)}${down&&down.Hospitalisations<down.base.Hospitalisations?`; ${down.Road_user} ${change(+down.base.Hospitalisations,+down.Hospitalisations)}`:''}.`);
  const sex=document.querySelector('#sex [aria-pressed="true"]')?.textContent.trim()||'All';
  const ages=new Map();at('age_sex').filter(r=>sex==='All'||r.Sex===sex).forEach(r=>ages.set(r['Age group'],(ages.get(r['Age group'])||0)+ +r.Hospitalisations));
  const age=max([...ages],r=>r[1]);if(age)put('age-chart',`${year} · ${sex==='All'?'both sexes':sex}: age ${age[0]} has the largest count (${n(age[1])}). Age groups span different numbers of years.`);
  const ageKeys=['0-7','8-16','17-25','26-39','40-64','65-74','75++'];
  const focus=[...document.querySelectorAll('#people-heatmap [aria-pressed="true"]')].map(el=>el.getAttribute('aria-label'));
  const cells=at('road_user_age').flatMap(r=>ageKeys.filter(a=>r[a]!==''&&(!focus.some(f=>f.startsWith('Focus age '))||focus.includes('Focus age '+a.replace('++','+')))&&(!focus.some(f=>!f.startsWith('Focus age '))||focus.includes('Focus '+r.Road_user))).map(a=>({road:r.Road_user,age:a.replace('++','+'),value:+r[a]})));
  const cell=max(cells,r=>r.value);if(cell)put('people-heatmap',`${year}: ${cell.road}, age ${cell.age}, has the highest count ${focus.length?'within the selection':'in this heatmap'} (${n(cell.value)}). Both sexes.`);
  const states=at('state_map'),state=document.querySelector('#state')?.value;
  const st=states.find(r=>r.State===state)||max(states,r=>+r.Hospitalisations);
  if(st)put('state-map',`${year}: ${st.state_name||st.State} ${state&&state!=='all'?'recorded':'has the largest count at'} ${n(st.Hospitalisations)} hospitalisations. Counts do not measure individual risk.`);
  const burden=max(at('state_bubble'),r=>+r.Bed_days);if(burden)put('bubble',`${year}: ${burden.State} has the most bed days (${n(burden.Bed_days)}). Bubble area shows total bed days, not injury risk.`);
  if(!document.querySelector('#remoteness-donut')?.dataset.storyRange)remoteness(2011,2021);
  document.querySelectorAll('main .plot>svg,main .age-plot>svg,main .map-plot>svg').forEach(svg=>{if(!seen.has(svg)){seen.add(svg);svg.classList.add('story-reveal');}});
 }
 function remoteness(start,end){
  const rs=records.filter(r=>r.Data_type==='first_nations_trends');
  const changes=['Major Cities','Regional','Remote'].map(name=>{const a=rs.find(r=>r.Remoteness===name&&+r.Year===start),b=rs.find(r=>r.Remoteness===name&&+r.Year===end);return a&&b?`${name}: ${n(a.Hospitalisations)} → ${n(b.Hospitalisations)}`:null;}).filter(Boolean);
  put('remoteness-donut',changes.length?`${start}–${end} · ${changes.join('; ')}. National counts.`:'Select a range containing at least one recorded year.');
 }
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(render);}};
 window.dashboardData.then(data=>{records=data;schedule();}).catch(console.error);
 document.addEventListener('change',schedule);document.addEventListener('input',schedule);document.addEventListener('national-year-change',schedule);
 document.addEventListener('remoteness-range',e=>{const host=document.querySelector('#remoteness-donut');if(host)host.dataset.storyRange='true';remoteness(e.detail.start,e.detail.end);});
 new MutationObserver(changes=>{if(changes.some(c=>!c.target.closest?.('.story-insight')))schedule();}).observe(document.querySelector('main'),{childList:true,subtree:true});
})();
