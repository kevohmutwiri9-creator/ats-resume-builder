// Simple front-end subscribe and lead magnet trigger
(function(){
  function init(){
    // if there's a query param subscribe=1 show a quick thank you
    const url = new URL(window.location.href);
    if(url.searchParams.get('show_subscribe')==='1'){
      // no-op for now; placeholder for future
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
