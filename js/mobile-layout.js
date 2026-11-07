/* Keep the existing filter controls and their listeners when opening the mobile drawer. */
(() => {
 const sidebar=document.querySelector('.sidebar'),main=document.querySelector('main');
 const placeholder=document.createComment('Desktop sidebar location');sidebar.before(placeholder);
 const drawer=document.createElement('dialog');drawer.className='mobile-filter-drawer';drawer.id='mobile-filters';drawer.setAttribute('aria-label','Dashboard filters');
 const close=document.createElement('button');close.type='button';close.className='mobile-filter-close';close.textContent='Done ×';close.setAttribute('aria-label','Close filters');drawer.append(close);document.body.append(drawer);
 const bar=document.createElement('div');bar.className='mobile-toolbar';
 const button=document.createElement('button');button.type='button';button.className='mobile-filter-toggle';button.textContent='☰ Filters';button.setAttribute('aria-controls',drawer.id);button.setAttribute('aria-expanded','false');
 const brand=document.createElement('span');brand.textContent='Group 4 · Road Injury Explorer';bar.append(brand,button);main.before(bar);
 const mobile=matchMedia('(max-width: 767px)');
 function sync(){if(mobile.matches){drawer.append(sidebar);}else{if(drawer.open)drawer.close();placeholder.after(sidebar);}}
 button.onclick=()=>{drawer.showModal();button.setAttribute('aria-expanded','true');document.body.classList.add('filters-open');close.focus();};
 close.onclick=()=>drawer.close();drawer.addEventListener('click',e=>{if(e.target===drawer){const r=drawer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)drawer.close();}});
 drawer.addEventListener('close',()=>{button.setAttribute('aria-expanded','false');document.body.classList.remove('filters-open');if(mobile.matches)button.focus();});
 mobile.addEventListener('change',sync);sync();
})();
