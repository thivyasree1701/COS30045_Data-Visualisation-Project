/* Shared detail-on-demand for the design preview; never invents real counts. */
(() => {
 const tip=document.createElement('div');tip.id='chart-tooltip';tip.className='chart-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);
 let active=null,pinned=false;
 const groups=['Car occupant','Motorcyclist','Pedal cyclist','Pedestrian'];
 function hide(){if(active)active.classList.remove('detail-active');active=null;pinned=false;tip.hidden=true;}
 function show(mark,event){if(pinned&&mark!==active)return;if(active)active.classList.remove('detail-active');active=mark;mark.classList.add('detail-active');tip.replaceChildren();const heading=document.createElement('strong');heading.textContent=mark.dataset.detail;const note=document.createElement('span');note.textContent=`Year: ${(mark.dataset.detail.match(/\b20\d{2}\b/)?.[0] || document.querySelector('#year').value)} · ${mark.closest('#state-map,#bubble,#remoteness-donut') && document.querySelector('script[src="js/state-data.js"]') || mark.closest('#trend,#donut,#stack,#age-chart,#people-heatmap') && document.querySelector('script[src="js/national-data.js"]') ? 'BITRE / AIHW · KNIME export.' : 'Illustrative preview. Real counts are not connected.'}`;const help=document.createElement('small');help.textContent='Click or Enter to pin details · Escape to close';tip.append(heading,note,help);tip.hidden=false;const rect=mark.getBoundingClientRect();const x=event?.clientX??rect.x+rect.width/2,y=event?.clientY??rect.y;tip.style.left=Math.max(8,Math.min(x+14,innerWidth-tip.offsetWidth-12))+'px';tip.style.top=Math.max(8,Math.min(y+14,innerHeight-tip.offsetHeight-12))+'px';}
 function decorate(){
  document.querySelectorAll('main svg title').forEach(title=>{const mark=title.parentElement;if(mark.tagName.toLowerCase()==='svg')return;mark.dataset.detail=title.textContent;title.remove();});
  document.querySelectorAll('#trend .point').forEach(mark=>{mark.dataset.detail=mark.getAttribute('aria-label')+' · Select this year to update comparison labels';});
  document.querySelectorAll(document.querySelector('script[src="js/state-data.js"]')?'#unused-preview-bubble':'#bubble circle').forEach((mark,i)=>{mark.dataset.detail=groups[i]+' · Hospitalisations and bed days pending; bubble size undecided';});
  document.querySelectorAll(document.querySelector('script[src="js/state-data.js"]')?'#unused-preview-remoteness':'#remoteness-donut path').forEach((mark,i)=>{mark.dataset.detail=['Major cities','Inner regional','Outer regional','Remote','Very remote'][i]+' · Proposed category; share unverified';});
  document.querySelectorAll('main [data-detail]').forEach(mark=>{if(mark.dataset.interactive)return;mark.dataset.interactive='true';mark.setAttribute('tabindex','0');mark.setAttribute('aria-describedby','chart-tooltip');if(!mark.hasAttribute('aria-label'))mark.setAttribute('aria-label',mark.dataset.detail);mark.addEventListener('pointerenter',e=>show(mark,e));mark.addEventListener('pointermove',e=>{if(!pinned)show(mark,e);});mark.addEventListener('pointerleave',()=>{if(!pinned)hide();});mark.addEventListener('focus',()=>show(mark));mark.addEventListener('blur',()=>{if(!pinned)hide();});const pin=e=>{if(!mark.isConnected)return;hide();show(mark,e);pinned=true;};mark.addEventListener('click',pin);mark.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!mark.matches('.point,.state-region')){e.preventDefault();pin();}});});
  // Expose focusable children to assistive technology rather than flattening the SVG.
  document.querySelectorAll('main svg').forEach(svg=>{if(svg.querySelector('[data-detail]'))svg.setAttribute('role','group');});
  if(active&&!active.isConnected)hide();
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
 document.addEventListener('click',e=>{if(!e.target.closest('[data-detail],#chart-tooltip'))hide();});
 document.querySelector('#reset')?.addEventListener('click',hide);
 new MutationObserver(decorate).observe(document.querySelector('main'),{childList:true,subtree:true});decorate();
})();
