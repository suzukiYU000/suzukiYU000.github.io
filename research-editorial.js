(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const fallback = {menu:'メニュー',close:'閉じる',paperCount:'{count}件の論文・研究発表を表示',copying:'コピーしています…',copied:'コピーしました',copyFallback:'アドレスを選択してコピーしてください'};
  const t = (key, values = {}) => window.previewI18n?.t(key,values) ?? Object.entries(values).reduce((text,[name,value])=>text.replaceAll('{'+name+'}',String(value)),fallback[key]);
  const darkScheme = matchMedia('(prefers-color-scheme: dark)');
  const storage = {get(key) {try {return localStorage.getItem('research-preview-'+key);} catch {return null;}}, set(key, value) {try {localStorage.setItem('research-preview-'+key,value);} catch { /* Local files may disallow storage. */ }}};
  const savedTheme = storage.get('theme');
  $('theme').value = ['light','dark','system'].includes(savedTheme) ? savedTheme : 'light';
  function applyTheme() {
    const dark = $('theme').value === 'dark' || ($('theme').value === 'system' && darkScheme.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#1c1e1c' : '#f3f1eb';
    storage.set('theme',$('theme').value);
  }
  applyTheme(); $('theme').addEventListener('change',applyTheme); darkScheme.addEventListener('change',applyTheme);
  const menuToggle = document.querySelector('.menu-toggle'), mobileNav = $('mobile-nav');
  function closeMenu() {mobileNav.hidden=true;menuToggle.setAttribute('aria-expanded','false');menuToggle.textContent=t('menu');}
  menuToggle.addEventListener('click',() => {const open=mobileNav.hidden;mobileNav.hidden=!open;menuToggle.setAttribute('aria-expanded',String(open));menuToggle.textContent=t(open?'close':'menu');});
  mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  const appearance = document.querySelector('.appearance');
  appearance.addEventListener('toggle',()=>{if(appearance.open)document.querySelector('.language-menu').open=false;});
  menuToggle.addEventListener('click',()=>{appearance.open=false;document.querySelector('.language-menu').open=false;});
  document.addEventListener('pointerdown',e=>{if(!appearance.contains(e.target))appearance.open=false;if(!document.querySelector('.site-header').contains(e.target))closeMenu();},{passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!mobileNav.hidden){closeMenu();menuToggle.focus();}if(appearance.open){appearance.open=false;appearance.querySelector('summary').focus();}}});
  matchMedia('(min-width: 801px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
  const sections = [...document.querySelectorAll('main>section[id],footer[id]')];
  let scrollPending=false;
  function updateProgress() {
    scrollPending=false;
    const range=document.documentElement.scrollHeight-innerHeight;
    document.querySelector('.reading-progress').style.transform='scaleX('+(range>0?scrollY/range:0)+')';
    let active='about';for(const section of sections)if(section.getBoundingClientRect().top<=160)active=section.id;
    document.querySelectorAll('.desktop-nav a,.mobile-nav a').forEach(a=>{if(a.hash==='#'+active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  }
  addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateProgress);}},{passive:true});updateProgress();
  const filterButtons=[...document.querySelectorAll('[data-filter]')], papers=[...document.querySelectorAll('.paper')];
  function filterPapers(filter) {
    filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
    papers.forEach(p=>p.hidden=filter!=='all'&&p.dataset.topic!==filter);
    $('paper-count').textContent=t('paperCount',{count:papers.filter(p=>!p.hidden).length}); updateProgress();
  }
  filterButtons.forEach(b=>b.addEventListener('click',()=>filterPapers(b.dataset.filter)));
  function revealHash() {if(papers.some(p=>'#'+p.id===location.hash))filterPapers('all');}
  document.querySelectorAll('a[href^="#paper-"]').forEach(a=>a.addEventListener('click',()=>filterPapers('all')));
  addEventListener('hashchange',revealHash);revealHash();
  if(location.hash.startsWith('#paper-'))requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView());
  $('year').textContent=new Date().getFullYear();
  $('copy-email').addEventListener('click',async()=>{
    $('copy-status').textContent=t('copying');
    let timeout;
    try {await Promise.race([navigator.clipboard.writeText('yuma.suzuki.work@gmail.com'),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Clipboard unavailable')),2500);})]);$('copy-status').textContent=t('copied');}
    catch {$('copy-status').textContent=t('copyFallback');const range=document.createRange();range.selectNodeContents(document.querySelector('.email-link'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}
    finally {clearTimeout(timeout);}
  });
  document.querySelectorAll('video').forEach(video=>video.addEventListener('play',()=>{document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();});}));
  function updateLanguageState() {
    menuToggle.textContent=t(mobileNav.hidden?'menu':'close');
    $('paper-count').textContent=t('paperCount',{count:papers.filter(p=>!p.hidden).length});
    $('copy-status').textContent='';
    updateProgress();
  }
  document.addEventListener('preview:language',updateLanguageState);
  updateLanguageState();
  addEventListener('resize',updateProgress,{passive:true});

})();
