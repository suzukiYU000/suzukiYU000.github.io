(() => {
  'use strict';
  const root=document.documentElement, intro=document.getElementById('name-intro');
  const canvas=document.getElementById('intro-particle-canvas');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const timers=new Set();
  let finished=false, stopParticles=()=>{}, exitAnimation=null, revealPromise=null;
  const wait=ms=>new Promise(resolve=>{const timer=setTimeout(()=>{timers.delete(timer);resolve();},ms);timers.add(timer);});
  function finish() {
    if(finished)return;
    finished=true;
    clearTimeout(window.previewIntroDeadline);
    timers.forEach(clearTimeout);timers.clear();
    stopParticles();stopParticles=()=>{};
    exitAnimation?.cancel();
    const restoreFocus=intro.contains(document.activeElement);
    intro.hidden=true;root.classList.remove('intro-pending');
    if(canvas){canvas.width=1;canvas.height=1;}
    document.removeEventListener('keydown',onKey);
    document.removeEventListener('focusin',onFocus);
    document.removeEventListener('visibilitychange',onVisibility);
    reduced.removeEventListener('change',onReduced);
    removeEventListener('resize',finish);
    if(restoreFocus)document.querySelector('.wordmark').focus({preventScroll:true});
    document.dispatchEvent(new Event('preview:intro:end'));
  }
  function onKey(event){if(event.key==='Escape')finish();}
  function onFocus(event){if(!intro.contains(event.target))finish();}
  function onVisibility(){if(document.hidden)finish();}
  function onReduced(){if(reduced.matches)finish();}
  function reveal(duration=1050) {
    if(finished)return Promise.resolve();
    if(revealPromise)return revealPromise;
    intro.classList.add('intro-leaving');
    // The page starts entering while the title is still dissolving. One overlap,
    // not an overlay fade followed by a second, unrelated page entrance.
    document.dispatchEvent(new CustomEvent('preview:intro:reveal',{detail:{duration}}));
    exitAnimation=intro.animate([{opacity:1},{opacity:0}],{
      duration,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'
    });
    revealPromise=exitAnimation.finished.catch(()=>{});
    return revealPromise;
  }
  async function run() {
    const portrait=document.querySelector('.portrait');
    const font=Promise.resolve(document.fonts?.load('700 1em Oswald')).catch(()=>{});
    const resources=Promise.race([Promise.allSettled([font,portrait?.decode?.()]),wait(2000)]);
    // The original particle target mask uses Oswald. Wait briefly for the local font.
    await Promise.race([font,wait(900)]);
    if(finished)return;
    try {
      if(typeof window.startEditorialIntroParticles!=='function')throw new Error('Renderer unavailable');
      const particles=new Promise(resolve=>{
        stopParticles=window.startEditorialIntroParticles(canvas,5300,2600,2700,45,intro,resolve,
          remaining=>reveal(remaining));
      });
      if(!intro.dataset.introRenderer)throw new Error('Canvas unavailable');
      await Promise.all([particles,resources]);
    } catch {
      stopParticles();stopParticles=()=>{};
      intro.classList.add('intro-unavailable');
      await Promise.all([wait(1000),resources]);
    }
    await (revealPromise||reveal(420));
    finish();
  }
  if(!root.classList.contains('intro-pending')||reduced.matches||document.hidden){finish();return;}
  intro.querySelector('.intro-skip').addEventListener('click',finish,{once:true});
  document.addEventListener('keydown',onKey);
  document.addEventListener('focusin',onFocus);
  document.addEventListener('visibilitychange',onVisibility);
  reduced.addEventListener('change',onReduced);
  addEventListener('pagehide',finish,{once:true});
  addEventListener('resize',finish,{once:true});
  // This also handles a renderer that never calls its completion callback.
  clearTimeout(window.previewIntroDeadline);
  window.previewIntroDeadline=setTimeout(finish,7800);
  run().catch(finish);
})();
