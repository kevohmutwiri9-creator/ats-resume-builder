/* Client-side premium gating for demo purposes.
   Sets a `ats_premium` key in localStorage when trial/purchase is started.
*/
(function(){
  function isPremium(){
    return localStorage.getItem('ats_premium')==='true';
  }

  function showUpgradeModal(){
    if(!document.getElementById('upgrade-modal')) return;
    document.getElementById('upgrade-modal').classList.add('visible');
  }

  function hideUpgradeModal(){
    const m = document.getElementById('upgrade-modal'); if(m) m.classList.remove('visible');
  }

  function startTrial(){
    localStorage.setItem('ats_premium','true');
    hideUpgradeModal();
    alert('Trial started — premium features unlocked locally.');
  }

  document.addEventListener('click', function(e){
    const t = e.target;
    if(t && t.matches && t.matches('.premium-lock')){
      if(!isPremium()){
        e.preventDefault();
        showUpgradeModal();
      }
    }
  });

  document.addEventListener('DOMContentLoaded', function(){
    const start = document.getElementById('start-trial');
    const close = document.getElementById('upgrade-close');
    if(start) start.addEventListener('click', startTrial);
    if(close) close.addEventListener('click', hideUpgradeModal);
  });

  window.atsPremium = { isPremium };
})();
