(function(){
  'use strict';

  const titleScreen=document.querySelector('#titleScreen');
  const mainMenu=document.querySelector('#titleMainMenu');
  const menuShell=document.querySelector('.title-menu-shell');
  const optionsPanel=document.querySelector('#titleOptionsPanel');
  if(!titleScreen||!mainMenu||!menuShell||!optionsPanel||titleScreen.dataset.menuPolish==='1')return;
  titleScreen.dataset.menuPolish='1';

  const status=document.querySelector('#titleStatus');
  const titleVersion=()=>document.querySelector('[data-title-version]')?.textContent?.trim()||'v—';
  const setStatus=text=>{if(status)status.textContent=text};
  const systemReducedMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function showPanel(id=null){
    mainMenu.hidden=!!id;
    titleScreen.querySelectorAll('.title-subpanel').forEach(panel=>{panel.hidden=panel.id!==id});
    const target=id?document.querySelector(`#${id} button, #${id} select, #${id} input`):(document.querySelector('#titleContinue')?.disabled?document.querySelector('#titleNew'):document.querySelector('#titleContinue'));
    target?.focus?.();
  }

  function polishOptions(){
    optionsPanel.classList.add('title-options-polished');
    const heading=optionsPanel.querySelector('#titleOptionsHeading');
    if(heading)heading.textContent='Game & Presentation';

    const menuCopy=document.querySelector('#titleOptions small');
    if(menuCopy)menuCopy.textContent='Presentation, pace and accessibility';

    const head=optionsPanel.querySelector('.title-panel-head');
    const motion=document.querySelector('#titleMotion');
    const speed=document.querySelector('#titleWatchSpeed');
    const save=document.querySelector('#titleSaveOptions');
    const motionRow=motion?.closest('label');
    const speedRow=speed?.closest('label');
    if(!head||!motion||!speed||!save||!motionRow||!speedRow)return;

    motionRow.classList.add('title-setting-row','title-setting-toggle');
    const motionTitle=motionRow.querySelector('strong');
    const motionHelp=motionRow.querySelector('small');
    if(motionTitle)motionTitle.textContent='Interface motion';
    if(motionHelp)motionHelp.textContent='Menu transitions and Watch Mode broadcast animation.';

    speedRow.classList.add('title-setting-row','title-setting-select');
    const speedSelect=speed;
    speedRow.replaceChildren();
    const speedCopy=document.createElement('span');
    speedCopy.className='title-setting-copy';
    speedCopy.innerHTML='<strong>Watch Mode pace</strong><small>Sets the default delay between plays when you watch a game.</small>';
    speedRow.append(speedCopy,speedSelect);

    const intro=document.createElement('p');
    intro.className='title-options-intro';
    intro.textContent='Presentation preferences are stored on this device and apply across your dynasty saves. They do not change simulation results.';

    const settings=document.createElement('section');
    settings.className='title-settings-card';
    settings.setAttribute('aria-labelledby','titlePresentationSettings');
    const settingsHead=document.createElement('div');
    settingsHead.className='title-settings-card-head';
    settingsHead.innerHTML='<div><span>PRESENTATION</span><strong id="titlePresentationSettings">How Dynasty Lab moves and plays back games</strong></div>';
    settings.append(settingsHead,motionRow,speedRow);

    const systemNote=document.createElement('div');
    systemNote.className='title-settings-meta';
    systemNote.innerHTML=`
      <div><span>DEVICE DEFAULT</span><strong>${systemReducedMotion()?'Reduced motion':'Standard motion'}</strong><small>On first launch, Dynasty Lab follows your device motion preference.</small></div>
      <div><span>SCOPE</span><strong>This browser</strong><small>These presentation choices are local preferences, not dynasty save data.</small></div>`;

    const actions=document.createElement('div');
    actions.className='title-settings-actions';
    const reset=document.createElement('button');
    reset.id='titleResetOptions';
    reset.type='button';
    reset.className='title-settings-reset';
    reset.textContent='Restore Defaults';
    reset.addEventListener('click',()=>{
      motion.checked=!systemReducedMotion();
      speed.value='850';
      setStatus('Recommended defaults restored in this panel. Save Options to keep them.');
      motion.focus();
    });
    save.textContent='Save & Return';
    actions.append(reset,save);

    head.insertAdjacentElement('afterend',intro);
    intro.insertAdjacentElement('afterend',settings);
    settings.insertAdjacentElement('afterend',systemNote);
    systemNote.insertAdjacentElement('afterend',actions);
  }

  function addAbout(){
    if(document.querySelector('#titleAbout'))return;
    const aboutButton=document.createElement('button');
    aboutButton.id='titleAbout';
    aboutButton.className='title-action title-action--quiet';
    aboutButton.type='button';
    aboutButton.innerHTML='<span><strong>About Dynasty Lab</strong><small>Version, game info and save model</small></span><i aria-hidden="true">›</i>';
    mainMenu.appendChild(aboutButton);

    const panel=document.createElement('section');
    panel.id='titleAboutPanel';
    panel.className='title-subpanel title-about-panel';
    panel.setAttribute('aria-labelledby','titleAboutHeading');
    panel.hidden=true;
    const desktopStorage=window.DynastyStorage?.kind==='desktop';
    const storageSummary=desktopStorage?'Desktop saves + complete exports':'Browser slots + complete exports';
    const storageCopy=desktopStorage?'Named desktop save slots handle everyday play. Exported JSON provides a complete backup you can keep separately and import later.':'Named browser save slots handle everyday play. Exported JSON provides a complete backup you can keep separately and import later.';
    panel.innerHTML=`
      <div class="title-panel-head"><div><span>ABOUT</span><h2 id="titleAboutHeading">Dynasty Lab</h2></div><button type="button" data-title-about-back aria-label="Back to main menu">Back</button></div>
      <div class="title-about-hero">
        <div class="title-about-mark" aria-hidden="true">DL</div>
        <div><div class="title-about-kicker">FICTIONAL COLLEGE FOOTBALL DYNASTY SIMULATOR</div><h3>Build the program. Own the era.</h3><p>Run a program across seasons, recruiting classes, coaching changes, player development and Game Day — then live with the history you create.</p></div>
      </div>
      <div class="title-about-facts" aria-label="Build information">
        <div><span>VERSION</span><strong data-about-version>${titleVersion()}</strong></div>
        <div><span>UNIVERSE</span><strong>Fictional</strong></div>
        <div><span>SAVES</span><strong>${desktopStorage?'Desktop + JSON':'Browser + JSON'}</strong></div>
      </div>
      <div class="title-about-grid">
        <section class="title-about-card"><span>DYNASTY MODE</span><h3>One program, one career</h3><p>Control a single program and move only through career opportunities earned inside the dynasty.</p></section>
        <section class="title-about-card"><span>COMMISSIONER MODE</span><h3>Run the whole universe</h3><p>Switch programs and edit institutional details when you want broader sandbox control.</p></section>
        <section class="title-about-card title-about-card--wide"><span>YOUR SAVE DATA</span><h3>${storageSummary}</h3><p>${storageCopy}</p></section>
      </div>`;
    menuShell.appendChild(panel);

    aboutButton.addEventListener('click',()=>{
      const version=panel.querySelector('[data-about-version]');
      if(version)version.textContent=titleVersion();
      showPanel('titleAboutPanel');
      setStatus(`Dynasty Lab ${titleVersion()} · game and build information.`);
    });
    panel.querySelector('[data-title-about-back]')?.addEventListener('click',()=>showPanel());
  }

  polishOptions();
  addAbout();
})();
