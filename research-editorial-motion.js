(() => {
  'use strict';
  const root = document.documentElement;
  const hero = document.querySelector('.profile-section');
  const names = [...document.querySelectorAll('.name-part')];
  const portrait = document.querySelector('.profile-portrait');
  const register = document.querySelector('.page-register');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const animations = new Set();
  const ease = 'cubic-bezier(.22,1,.36,1)';
  let frame = 0, last = 0, reading = 0, aim = 0, position = 0;
  let heroVisible = true, disposed = false, introJoined = false;

  // The typography and registration marks move as paired elements.
  // Text is always in the document; animation never gates reading or loading.
  function animate(element, keyframes, options) {
    if (!element || reduced.matches || document.hidden || disposed) return;
    const animation = element.animate(keyframes, {duration:900, easing:ease, ...options});
    animations.add(animation);
    const release = () => {
      animations.delete(animation);
      if(animation.playState==='finished')animation.cancel();
    };
    animation.addEventListener('finish', release, {once:true});
    animation.addEventListener('cancel', release, {once:true});
    return animation;
  }
  function stop() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }
  function render(time) {
    frame = 0;
    if (reduced.matches || document.hidden || disposed) return;
    const delta = last ? Math.min(50, time-last) : 16;
    last = time;
    position += (aim-position) * (1-Math.exp(-delta/170));
    hero.style.setProperty('--response-x', (position*9).toFixed(2)+'px');
    hero.style.setProperty('--response-y', (position*15).toFixed(2)+'px');
    register.style.transform = 'translateY('+(reading * Math.min(innerHeight*.4,340)).toFixed(1)+'px)';
    register.children[0].style.transform = 'translateX('+(position*7).toFixed(2)+'px)';
    register.children[1].style.transform = 'translateY('+(-position*10).toFixed(2)+'px)';
    if (Math.abs(aim-position)>.002) frame=requestAnimationFrame(render);
    else last=0;
  }
  function wake() {
    if (!frame && !reduced.matches && !document.hidden && !disposed) frame=requestAnimationFrame(render);
  }
  function scroll() {
    const range = root.scrollHeight-innerHeight;
    reading = range>0 ? Math.min(1,Math.max(0,scrollY/range)) : 0;
    register.classList.toggle('is-visible', scrollY>90);
    wake();
  }
  hero.addEventListener('pointermove', event => {
    if (!fine.matches || event.pointerType==='touch' || !heroVisible || root.classList.contains('intro-pending')) return;
    const bounds=hero.getBoundingClientRect();
    aim=Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1));
    wake();
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{aim=0;wake();},{passive:true});
  addEventListener('scroll',scroll,{passive:true});
  addEventListener('resize',scroll,{passive:true});
  document.addEventListener('preview:language',scroll);
  if ('ResizeObserver' in window) new ResizeObserver(scroll).observe(document.querySelector('main'));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries=>{
      heroVisible=entries[0].isIntersecting;
      if (!heroVisible) {aim=0;wake();}
    }).observe(hero);
    const observer=new IntersectionObserver(entries=>{
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const media=entry.target.classList.contains('media-window');
        const direction=entry.target.closest('#research-body') ? -1 : 1;
        animate(entry.target,media
          ? [{clipPath:'inset(0 7% 0 7%)',transform:'translateY(22px)'},{clipPath:'inset(0 0 0 0)',transform:'translateY(0)'}]
          : [{transform:'translateX('+(direction*22)+'px)',opacity:.6},{transform:'translateX(0)',opacity:1}],
          {duration:media?1000:800});
      }
    },{threshold:.12,rootMargin:'0px 0px -30px 0px'});
    document.querySelectorAll('.chapter-numeral,.media-window,.section-heading').forEach(element=>observer.observe(element));
  }
  reduced.addEventListener('change',()=>{
    stop(); aim=0; position=0;
    hero.style.removeProperty('--response-x');hero.style.removeProperty('--response-y');
    if (!reduced.matches) scroll();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else scroll();});
  addEventListener('pagehide',()=>{disposed=true;stop();});
  addEventListener('pageshow',()=>{disposed=false;scroll();});
  function enterPage() {
    if (!(scrollY<120 && !location.hash.replace('#about',''))) return;
    const compact=matchMedia('(max-width:600px)').matches;
    const distance=compact?22:64;
    names.forEach((name,index)=>animate(name,[
      {transform:'translate3d('+((index?1:-1)*(compact?-distance:distance))+'px,'+(index?-14:14)+'px,0)',opacity:.2},
      {transform:'translate3d(0,0,0)',opacity:1}
    ],{duration:1250,delay:index*110}));
    animate(portrait,[{clipPath:'inset(0 0 12% 0)',transform:'translateY(24px)'},{clipPath:'inset(0 0 0 0)',transform:'translateY(0)'}],{duration:1300});
  }
  if(root.classList.contains('intro-pending')) {
    document.addEventListener('preview:intro:reveal',event=>{
      if(introJoined)return;
      introJoined=true;
      const duration=event.detail.duration;
      const atTop=scrollY<120 && !location.hash.replace('#about','');
      // Fill both sides of the overlap, including delays, so no finished page
      // flashes into view before moving back to its starting position.
      [document.querySelector('.site-header'),document.querySelector('main'),document.querySelector('.site-footer')].forEach((element,index)=>{
        const offset=atTop && index===1 ? 16 : 0;
        animate(element,[{opacity:0,transform:'translateY('+offset+'px)'},{opacity:1,transform:'translateY(0)'}],
          {duration,easing:'cubic-bezier(.3,0,.2,1)',fill:'both'});
      });
      if(atTop)animate(portrait,
        [{clipPath:'inset(0 0 5% 0)'},{clipPath:'inset(0 0 0 0)'}],
        {duration,fill:'both'});
      root.classList.add('intro-revealing');
    },{once:true});
    document.addEventListener('preview:intro:end',()=>{
      // Keep the final pose. Skip, failure and reduced motion also settle here.
      root.classList.remove('intro-revealing');
      stop();
    },{once:true});
  } else enterPage();
  scroll();
})();
