/* ============================================================
   H&B BARBER — interactions
   ============================================================ */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- hero video: hide if no decodable frames (codec unsupported) so photo backdrop shows ---- */
  var heroVid = document.querySelector('.hero-media video');
  if(heroVid){
    var checkVid = function(){
      if(heroVid.videoWidth === 0 || heroVid.videoHeight === 0){ heroVid.style.opacity = '0'; }
      else { heroVid.style.opacity = '1'; }
    };
    heroVid.addEventListener('loadeddata', checkVid);
    heroVid.addEventListener('playing', checkVid);
    heroVid.addEventListener('timeupdate', checkVid);
    var pp = heroVid.play && heroVid.play(); if(pp && pp.catch){ pp.catch(function(){}); }
    setTimeout(checkVid, 1400);
  }

  /* ---- nav scroll state ---- */
  var nav = document.querySelector('.nav');
  function onScroll(){
    if(nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---- mobile nav ---- */
  var burger = document.querySelector('.burger');
  var links = document.querySelector('.nav-links');
  if(burger && links){
    var scrim = document.createElement('div');
    scrim.className = 'nav-scrim';
    document.body.appendChild(scrim);
    burger.setAttribute('aria-expanded','false');

    function openMenu(){
      burger.classList.add('open'); links.classList.add('open'); scrim.classList.add('open');
      document.body.classList.add('nav-open');
      burger.setAttribute('aria-expanded','true');
      burger.setAttribute('aria-label','Menü schließen');
    }
    function closeMenu(){
      burger.classList.remove('open'); links.classList.remove('open'); scrim.classList.remove('open');
      document.body.classList.remove('nav-open');
      burger.setAttribute('aria-expanded','false');
      burger.setAttribute('aria-label','Menü öffnen');
    }
    function toggleMenu(){ links.classList.contains('open') ? closeMenu() : openMenu(); }

    burger.addEventListener('click', toggleMenu);
    scrim.addEventListener('click', closeMenu);
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' || e.keyCode === 27) closeMenu();
    });
    window.addEventListener('resize', function(){
      if(window.innerWidth > 980 && links.classList.contains('open')) closeMenu();
    });
  }

  /* ---- scroll reveal ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---- 3D tilt on service cards (pointer) ---- */
  if(!reduce && window.matchMedia('(hover:hover)').matches){
    document.querySelectorAll('[data-tilt]').forEach(function(card){
      var raf=null;
      function move(ev){
        var r = card.getBoundingClientRect();
        var px = (ev.clientX - r.left)/r.width;
        var py = (ev.clientY - r.top)/r.height;
        card.style.setProperty('--mx', (px*100)+'%');
        card.style.setProperty('--my', (py*100)+'%');
        var rx = (0.5 - py) * 10;
        var ry = (px - 0.5) * 12;
        if(raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function(){
          card.style.transform = 'perspective(900px) rotateX('+rx.toFixed(2)+'deg) rotateY('+ry.toFixed(2)+'deg) translateY(-6px)';
        });
      }
      function leave(){
        if(raf) cancelAnimationFrame(raf);
        card.style.transform = '';
      }
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', leave);
    });
  }

  /* ---- parallax (hero video + tagged elements) ---- */
  var parEls = [].slice.call(document.querySelectorAll('[data-par]'));
  if(!reduce && parEls.length){
    var ticking=false;
    function par(){
      var vh = window.innerHeight;
      parEls.forEach(function(el){
        var speed = parseFloat(el.getAttribute('data-par')) || 0.15;
        var r = el.getBoundingClientRect();
        var center = r.top + r.height/2 - vh/2;
        el.style.transform = 'translate3d(0,'+(center * speed * -1).toFixed(1)+'px,0)';
      });
      ticking=false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ ticking=true; requestAnimationFrame(par); }
    }, {passive:true});
    par();
  }

  /* ---- highlight today's opening hours ---- */
  var dayIdx = new Date().getDay(); // 0 Sun ... 6 Sat
  var todayLi = document.querySelector('.hours-list li[data-day="'+dayIdx+'"]');
  if(todayLi) todayLi.classList.add('today');

  /* ============================================================
     DSGVO — cookie consent + consent-gated Google map
     ============================================================ */
  var STORE='hb_consent_v1';
  function getConsent(){ try{ return JSON.parse(localStorage.getItem(STORE)); }catch(e){ return null; } }
  function setConsent(val){ try{ localStorage.setItem(STORE, JSON.stringify(val)); }catch(e){} }

  var banner = document.querySelector('.cookie');
  function showBanner(){ if(banner) requestAnimationFrame(function(){ banner.classList.add('show'); }); }
  function hideBanner(){ if(banner) banner.classList.remove('show'); }

  var consent = getConsent();
  if(banner){
    if(!consent || typeof consent.maps === 'undefined'){
      setTimeout(showBanner, 900);
    }
    var acceptBtn = banner.querySelector('[data-accept]');
    var declineBtn = banner.querySelector('[data-decline]');
    if(acceptBtn) acceptBtn.addEventListener('click', function(){ setConsent({maps:true, ts:Date.now()}); hideBanner(); applyMap(true); });
    if(declineBtn) declineBtn.addEventListener('click', function(){ setConsent({maps:false, ts:Date.now()}); hideBanner(); });
  }

  /* map: only inject iframe after explicit consent */
  function applyMap(load){
    var card = document.querySelector('.map-card');
    if(!card) return;
    var consentBox = card.querySelector('.map-consent');
    if(load){
      if(card.querySelector('iframe')) return;
      var ifr = document.createElement('iframe');
      ifr.setAttribute('loading','lazy');
      ifr.setAttribute('referrerpolicy','no-referrer-when-downgrade');
      ifr.setAttribute('title','Karte H&B Barber, Remigiusstraße 12, Borken');
      ifr.src='https://www.google.com/maps?q=Remigiusstra%C3%9Fe%2012,%2046325%20Borken&output=embed';
      card.insertBefore(ifr, card.firstChild);
      if(consentBox) consentBox.style.display='none';
    }
  }
  if(consent && consent.maps){ applyMap(true); }

  // explicit "load map" button inside the consent box
  document.querySelectorAll('[data-loadmap]').forEach(function(b){
    b.addEventListener('click', function(){ setConsent({maps:true, ts:Date.now()}); hideBanner(); applyMap(true); });
  });
  // re-open cookie settings
  document.querySelectorAll('[data-cookie-settings]').forEach(function(b){
    b.addEventListener('click', function(e){ e.preventDefault(); showBanner(); });
  });

  /* ---- year ---- */
  document.querySelectorAll('[data-year]').forEach(function(el){ el.textContent = new Date().getFullYear(); });
})();
