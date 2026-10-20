(function(){
  function $(sel){return document.querySelector(sel);}

  var y=document.getElementById('year');
  if(y){y.textContent=String(new Date().getFullYear());}

  function pathFor(asset){
    var p=String(location.pathname||'');
    if(p.indexOf('/guides/')!==-1){return '../'+asset;}
    return './'+asset;
  }

  function ensureFavicon(){
    var existing=document.querySelector('link[rel="icon"],link[rel="shortcut icon"]');
    if(existing) return;
    var link=document.createElement('link');
    link.rel='icon';
    link.href=pathFor('favicon.svg');
    document.head.appendChild(link);
  }

  function ensureAdsenseMeta(){
    if(document.querySelector('meta[name="google-adsense-account"]')) return;
    var cfg=window.ADSENSE_CONFIG;
    if(!cfg || !cfg.publisherId) return;
    var meta=document.createElement('meta');
    meta.name='google-adsense-account';
    meta.content=cfg.publisherId;
    document.head.appendChild(meta);
  }

  function getConsent(){
    try{
      var value=localStorage.getItem('cookieConsent');
      if(!value) return null;
      var consent=JSON.parse(value);
      if(!consent.categories) return null;
      return { ads: Boolean(consent.categories.marketing) };
    }catch{return null;}
  }

  function loadScript(src, onload){
    var s=document.createElement('script');
    s.src=src;
    s.async=true;
    s.crossOrigin='anonymous';
    s.onload=function(){ if(onload) onload(); };
    s.onerror=function(){ if(onload) onload(new Error('failed')); };
    document.head.appendChild(s);
  }

  function tryLoadAdsense(){
    var consent=getConsent();
    if(!consent || !consent.ads) return;

    function start(){
      var cfg=window.ADSENSE_CONFIG;
      if(!cfg || !cfg.enabled || !cfg.publisherId) return;
      if(window.__ADSENSE_LOADED__ || window.__ADSENSE_LOADING__) return;
      window.__ADSENSE_LOADING__=true;
      ensureAdsenseMeta();
      var src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(cfg.publisherId);
      loadScript(src, function(error){
        window.__ADSENSE_LOADING__=false;
        if(error){
          console.error('Failed to load Google AdSense.');
          return;
        }
        window.__ADSENSE_LOADED__=true;
        window.adsbygoogle = window.adsbygoogle || [];
        if(cfg.autoAds){
          window.adsbygoogle.push({ google_ad_client: cfg.publisherId, enable_page_level_ads: true });
        }
      });
    }

    if(window.ADSENSE_CONFIG){
      start();
    }else if(!window.__ADSENSE_CONFIG_LOADING__){
      window.__ADSENSE_CONFIG_LOADING__=true;
      loadScript(pathFor('adsense-config.js'), function(error){
        window.__ADSENSE_CONFIG_LOADING__=false;
        if(error){
          console.error('Failed to load AdSense configuration.');
          return;
        }
        start();
      });
    }
  }

  ensureFavicon();
  window.addEventListener('cookieConsentGiven', tryLoadAdsense);
  window.addEventListener('cookieConsentUpdated', function(event){
    if(event.detail && event.detail.categories && event.detail.categories.marketing){
      tryLoadAdsense();
    }
  });
  tryLoadAdsense();
})();
