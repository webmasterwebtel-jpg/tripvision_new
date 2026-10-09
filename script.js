const icon=(id,cls='tv-icon')=>'<svg class="'+cls+'" aria-hidden="true"><use href="#'+id+'"></use></svg>';
const $=(s,r=document)=>(r||document).querySelector(s),$$=(s,r=document)=>[...(r||document).querySelectorAll(s)];
localStorage.removeItem('tripvisionApiUrl');
const API_BASE=window.TV_API_BASE||'/api';
window.GEO_API=API_BASE;
localStorage.removeItem('tripvisionToken');localStorage.removeItem('tripvisionUser');
let token='',currentUser=null;
let state={flights:[],packs:[],vehicles:[]};
let search={pickup:'',startDate:'',startTime:'11:00',endDate:'',endTime:'11:00',age:30,category:'all'},serviceFilters={flight:{fromCity:'',toCity:'',departDate:'',returnDate:'',travelers:1},pack:{fromCity:'',toCity:'',startDate:'',endDate:'',travelers:2}},selectedVehicleId=null;
const money=n=>`${Number(n||0).toFixed(0)} €`;
const authHeaders=()=>({'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})});
function clearSession(){token='';currentUser=null;localStorage.removeItem('tripvisionToken');localStorage.removeItem('tripvisionUser')}
async function api(path,opts={}){const res=await fetch(`${API_BASE}${path}`,{...opts,headers:{...authHeaders(),...(opts.headers||{})}});if(res.status===401&&token&&!path.startsWith('/auth/login')){clearSession();updateAccount();if(['client','partner','admin'].includes(location.hash.slice(1)))page('login')}if(!res.ok){let e={};try{e=await res.json()}catch{}const er=new Error(e.error||`Erreur API ${res.status}`);er.detail=e.message;throw er}return res.status===204?null:res.json()}
function escapeHtml(value){return String(value??'').replace(/[&<>\"']/g,function(ch){const code=ch.charCodeAt(0);return code===38?'&amp;':code===60?'&lt;':code===62?'&gt;':code===34?'&quot;':'&#039;'})}
function toast(message,type='success',title=''){const stack=$('#toastStack');if(!stack){console.log(message);return}const el=document.createElement('div');el.className='app-toast '+type;el.innerHTML='<span class="app-toast-icon">'+icon(type==='error'?'i-x':'i-check')+'</span><div><strong>'+escapeHtml(title||(type==='error'?'Une erreur est survenue':'Action enregistrée'))+'</strong><p>'+escapeHtml(message)+'</p></div><button type="button" aria-label="Fermer">'+icon('i-x')+'</button>';el.querySelector('button').onclick=()=>el.remove();stack.appendChild(el);setTimeout(()=>el.classList.add('show'),10);setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),250)},4500)}
function boolForm(fd,name){return fd.get(name)==='true'||fd.has(name)}
function warnApi(){if($('#apiWarning'))return;const d=document.createElement('div');d.id='apiWarning';d.className='notice';d.style.cssText='position:fixed;left:20px;right:20px;bottom:20px;z-index:999;background:#fff3d5;border:1px solid #e1be64';d.innerHTML='API indisponible. Vérifie le service <strong>tripvision-api</strong> sur Render.';document.body.appendChild(d);setTimeout(()=>d.remove(),8000)}
function badge(s){return s==='approved'||s==='active'||s==='confirmed'?'<span class="badge ok">Validé</span>':s==='inactive'?'<span class="badge off">Masqué</span>':'<span class="badge waiting">En attente</span>'}
function bindLinks(scope=document){$$('[data-page-link]',scope).forEach(a=>a.onclick=e=>{e.preventDefault();page(a.dataset.pageLink);location.hash=a.dataset.pageLink})}
function page(id){
  document.documentElement.removeAttribute('data-boot');
  if(id&&id.indexOf('/')>0){const kind=id.split('/')[0];window.TVPages?.route(id);id=kind==='pack'?'packdetail':kind==='destination'?'destination':'home'}
  if(token&&['client','partner'].includes(currentUser?.role)&&['login','partner','client'].includes(id)){location.replace('/espace/');return}
  if(id==='client'||id==='admin'||id==='admin-login')id='login';
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));
  document.querySelectorAll('[data-page-link]').forEach(a=>a.classList.toggle('active',a.dataset.pageLink===id));
  $('#mainNav')?.classList.remove('open');$('#burger')?.setAttribute('aria-expanded','false');scrollTo(0,0);
}
function updateAccount(){[$('.account'),$('#mobileAccount')].filter(Boolean).forEach(box=>{box.innerHTML='<a class="btn small client-menu-btn" href="#login" data-page-link="login">Mon Espace Client</a>';bindLinks(box)})}
let pendingTab=null;
function setSession(data){if(['it','admin','manager'].includes(data.user?.role)){pendingTab?.close();pendingTab=null;location.href='/backoffice/';return}
  // La session n'est jamais gardée sur le site public : elle est remise à l'onglet de l'espace, puis oubliée ici.
  window.TV_HANDOFF={token:data.token,user:data.user};setTimeout(()=>{window.TV_HANDOFF=null},15000);
  if(pendingTab&&!pendingTab.closed){pendingTab.location.href='/espace/';pendingTab=null;page('home');location.hash='home'}else{try{sessionStorage.setItem('tripvisionToken',data.token);sessionStorage.setItem('tripvisionUser',JSON.stringify(data.user))}catch{}location.href='/espace/'}}
function busy(btn,text){if(!btn)return()=>{};const html=btn.innerHTML;btn.disabled=true;btn.classList.add('is-loading');btn.innerHTML=`<span class="btn-spinner" aria-hidden="true"></span><span>${text}</span>`;return()=>{btn.disabled=false;btn.classList.remove('is-loading');btn.innerHTML=html}}
function logout(){token='';currentUser=null;updateAccount();page('home');location.hash='home'}
async function loadPublic(){try{const [flights,packs,vehicles]=await Promise.all([api('/public/offers?type=flight'),api('/public/offers?type=pack'),api(window.carsPath?window.carsPath():'/public/vehicles')]);state.flights=flights;state.packs=packs;state.vehicles=vehicles}catch(e){console.error(e);warnApi()}window.__tvLoaded=true;renderPublic()}
function renderPublic(){renderHome();renderFlights();renderPacks();renderCars();window.TVPages?.refresh()}
function renderHome(){const approved=state.vehicles.length;const destinations=new Set([...state.flights.map(f=>f.to_city),...state.vehicles.map(v=>v.city),...state.packs.map(p=>p.to_city)].filter(Boolean)).size;if($('#homeStats'))$('#homeStats').innerHTML=`<div class="stat"><strong>${approved}</strong><span>Voitures publiées</span></div><div class="stat"><strong>${destinations}</strong><span>Destinations</span></div><div class="stat"><strong>${state.flights.length+state.packs.length}</strong><span>Offres voyage</span></div>`}
const cleanPlace=v=>String(v||'').replace(/\s*\([A-Za-z]{3}\)\s*$/,'').trim();
const nrm=v=>String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const day10=d=>d?String(d).slice(0,10):'';
const fmtDayFr=d=>d?new Date(day10(d)+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}):'';
const durText=m=>m?`${Math.floor(m/60)} h ${String(m%60).padStart(2,'0')}`:'';
const airportCode=(a,city)=>{const m=String(a||'').match(/^\s*([A-Za-z]{3})\b/);return m?m[1].toUpperCase():(city||'')};
const stopsText=n=>n?`${n} escale${n>1?'s':''}`:'Direct';
const offerImages=o=>o.images?.length?o.images:[o.image];
function cardOffer(o){const title=o.title||`${o.from_city||''} → ${o.to_city||''}`;return `<article class="offer" data-offer-id="${o.id}">${TVGallery.html(offerImages(o),title)}<div class="offer-body"><span class="badge">${escapeHtml(o.badge||'Offre')}</span><h3>${escapeHtml(title)}</h3><p class="meta">${escapeHtml(o.partner_name||'TripVision')} · ${escapeHtml(o.country||'')}</p>${o.start_date?`<p class="meta">📅 ${fmtDayFr(o.start_date)}${o.end_date?' → '+fmtDayFr(o.end_date):''}</p>`:''}${o.hotel_name?`<p class="meta offer-hotel">🏨 ${escapeHtml(o.hotel_name)}${o.hotel_stars?' · '+'★'.repeat(Number(o.hotel_stars)):''}${o.hotel_nights?' · '+o.hotel_nights+' nuit'+(Number(o.hotel_nights)>1?'s':''):''}${o.hotel_board?' · '+escapeHtml(o.hotel_board):''}</p>`:''}<p class="meta">${escapeHtml(o.description||'')}</p><div class="price"><div><strong>${money(o.price)}</strong>${o.old_price?` <span class="meta"><s>${money(o.old_price)}</s></span>`:''}<p class="meta">par voyageur</p></div><button class="btn small" type="button" data-offer-book="${o.id}">Réserver →</button></div></div></article>`}
function legHtml(label,date,from,to,dep,arr,off,dur,stops,no){if(!dep&&!arr)return `<div class="leg"><div class="leg-label"><b>${label}</b> · ${fmtDayFr(date)}${no?` · ${escapeHtml(no)}`:''}</div><div class="leg-line leg-notime"><div class="leg-t"><strong>${escapeHtml(from)}</strong></div><div class="leg-track"><span class="leg-dur">Horaires sur le site de la compagnie</span><i><em>✈</em></i><span class="leg-stops">${stopsText(stops)}</span></div><div class="leg-t"><strong>${escapeHtml(to)}</strong></div></div></div>`;return `<div class="leg"><div class="leg-label"><b>${label}</b> · ${fmtDayFr(date)}${no?` · ${escapeHtml(no)}`:''}</div><div class="leg-line"><div class="leg-t"><strong>${escapeHtml(dep||'--:--')}</strong><span>${escapeHtml(from)}</span></div><div class="leg-track"><span class="leg-dur">${durText(dur)||'&nbsp;'}</span><i><em>✈</em></i><span class="leg-stops ${stops?'has':''}">${stopsText(stops)}</span></div><div class="leg-t"><strong>${escapeHtml(arr||'--:--')}${off?`<sup>+${off}</sup>`:''}</strong><span>${escapeHtml(to)}</span></div></div></div>`}
function flightCard(o){const f=o.flight;if(!f)return cardOffer(o);const title=o.title||`${o.from_city||''} → ${o.to_city||''}`,trav=serviceFilters.flight.travelers||1,round=f.tripType==='roundtrip';const fromC=airportCode(f.fromAirport,o.from_city),toC=airportCode(f.toAirport,o.to_city);return `<article class="flight-card" data-offer-id="${o.id}"><div class="flight-photo">${TVGallery.html(offerImages(o),title)}<span class="badge">${escapeHtml(o.badge||'Offre')}</span></div><div class="flight-main"><header class="flight-head"><strong class="airline">${escapeHtml(f.airline)}</strong><span>${escapeHtml(o.from_city||'')} → ${escapeHtml(o.to_city||'')}${o.country?' · '+escapeHtml(o.country):''}</span></header>${legHtml('Aller',o.start_date,fromC,toC,f.departTime,f.arriveTime,f.arriveDayOffset,f.durationMin,f.stops,f.flightNumber)}${round?legHtml('Retour',o.end_date,toC,fromC,f.returnDepartTime,f.returnArriveTime,f.returnDayOffset,f.durationMin,f.stops,f.returnFlightNumber):''}<footer class="flight-perks"><span>${round?'Aller-retour':'Aller simple'}</span><span>${escapeHtml(f.cabin||'Économique')}</span>${f.baggage?`<span>${escapeHtml(f.baggage)}</span>`:''}</footer>${o.description?`<p class="meta">${escapeHtml(o.description)}</p>`:''}</div><aside class="flight-buy"><small>${round?'Aller-retour':'Aller simple'} · par voyageur</small>${o.old_price?`<s class="meta">${money(o.old_price)}</s>`:''}<strong>${money(o.price)}</strong>${round&&f.oneWayPrice?`<span class="meta oneway-price">Aller simple : <b>${money(f.oneWayPrice)}</b></span>`:''}${trav>1?`<span class="meta">Total ${trav} voyageurs : <b>${money(o.price*trav)}</b></span>`:''}${f.bookingUrl&&/^https?:\/\//i.test(f.bookingUrl)?`<a class="btn" href="${escapeHtml(f.bookingUrl)}" target="_blank" rel="noopener noreferrer">Réserver sur ${escapeHtml(f.airline||'le site de la compagnie')} ↗</a><span class="meta airline-note">Réservation sur le site de la compagnie</span>`:`<button class="btn" type="button" disabled>Lien de réservation bientôt disponible</button>`}</aside></article>`}
function renderFlights(){
  const q=nrm($('#flightSearch')?.value),sort=$('.pills[data-filter-group="flights"] .active')?.dataset.sort||'price',direct=$('#flightDirect')?.checked,filt=serviceFilters.flight;
  const rows=state.flights.filter(f=>{
    const hay=nrm([f.title,f.from_city,f.to_city,f.country,f.flight?.airline,f.flight?.flightNumber].join(' '));
    const fromOk=!filt.fromCity||nrm(f.from_city).includes(nrm(filt.fromCity));
    const toOk=!filt.toCity||nrm(f.to_city).includes(nrm(filt.toCity));
    const departOk=!filt.departDate||!f.start_date||day10(f.start_date)>=filt.departDate;
    const returnOk=!filt.returnDate||!f.end_date||day10(f.end_date)<=filt.returnDate;
    return (!q||hay.includes(q))&&fromOk&&toOk&&departOk&&returnOk&&(!direct||!f.flight?.stops);
  });
  rows.sort((a,b)=>sort==='fast'?(a.flight?.durationMin||99999)-(b.flight?.durationMin||99999):sort==='early'?(day10(a.start_date)+(a.flight?.departTime||'')).localeCompare(day10(b.start_date)+(b.flight?.departTime||'')):Number(a.price)-Number(b.price));
  if($('#flightGrid'))$('#flightGrid').innerHTML=rows.map(flightCard).join('');
  if($('#flightEmpty'))$('#flightEmpty').style.display=rows.length?'none':'grid';
  if($('#flightResultCount'))$('#flightResultCount').textContent=`${rows.length} vol${rows.length>1?'s':''}`;
  bindLinks($('#flightGrid')||document);
}
let packTab='all';
const packBoardAll=p=>/compris|all.?inclusive/i.test(p.hotel_board||'');
function packCard(o){
  const nights=Number(o.hotel_nights)||0,old=o.old_price&&Number(o.old_price)>Number(o.price),pct=old?Math.round((1-Number(o.price)/Number(o.old_price))*100):0;
  const title=o.title||`${o.from_city||''} → ${o.to_city||''}`;
  const stars=o.hotel_stars?'★'.repeat(Number(o.hotel_stars)):'';
  return `<article class="pack-card" data-offer-id="${o.id}"><div class="pack-media">${TVGallery.html(offerImages(o),title)}<span class="pack-tag">${escapeHtml(o.badge||'Vol + hôtel')}</span>${old&&pct>0?`<span class="pack-promo">−${pct}%</span>`:''}</div>
  <div class="pack-body"><div class="pack-dest"><b>${escapeHtml(o.to_city||title)}</b><small>${escapeHtml(o.country||'')}</small></div>
  ${o.hotel_name?`<h3>${escapeHtml(o.hotel_name)} <span class="pack-stars">${stars}</span></h3>`:`<h3>${escapeHtml(title)}</h3>`}
  <ul class="pack-facts">${o.from_city?`<li><i>✈</i>Vols de ${escapeHtml(o.from_city)}</li>`:''}${o.start_date?`<li><i>📅</i>Départ le ${fmtDayFr(o.start_date)}${o.end_date?' · retour le '+fmtDayFr(o.end_date):''}</li>`:''}${nights?`<li><i>🌙</i>${nights+1} jours / ${nights} nuit${nights>1?'s':''}</li>`:''}${o.hotel_board?`<li><i>🍽</i>${escapeHtml(o.hotel_board)}</li>`:''}</ul>
  ${o.description?`<p class="pack-desc">${escapeHtml(o.description)}</p>`:''}</div>
  <div class="pack-buy"><div><small>par personne, dès</small>${old?`<s>${money(o.old_price)}</s>`:''}<strong>${money(o.price)}</strong></div><a class="btn" href="#pack/${o.id}" data-page-link="pack/${o.id}">Voir l’offre →</a></div></article>`;
}
function renderPackTabs(all){
  const box=$('#packTabs');if(!box)return;
  const countries=[...new Set(all.map(p=>p.country).filter(Boolean))].sort();
  const tabs=[['all','Toutes les offres',all.length],['promo','Bons plans',all.filter(p=>p.old_price&&Number(p.old_price)>Number(p.price)).length],['incl','Tout compris',all.filter(packBoardAll).length],['short','Week-ends (≤ 3 nuits)',all.filter(p=>Number(p.hotel_nights)>0&&Number(p.hotel_nights)<=3).length],...countries.map(c=>['c:'+c,c,all.filter(p=>p.country===c).length])].filter(([k,,n])=>k==='all'||n>0);
  box.innerHTML=tabs.map(([k,l,n])=>`<button type="button" class="pack-tab ${packTab===k?'on':''}" data-pack-tab="${escapeHtml(k)}">${escapeHtml(l)} <small>${n}</small></button>`).join('');
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-pack-tab]');if(!t)return;packTab=t.dataset.packTab;renderPacks()});
function renderPacks(){
  const filt=serviceFilters.pack;
  const rows=state.packs.filter(p=>{
    if(packTab==='promo'&&!(p.old_price&&Number(p.old_price)>Number(p.price)))return false;
    if(packTab==='incl'&&!packBoardAll(p))return false;
    if(packTab==='short'&&!(Number(p.hotel_nights)>0&&Number(p.hotel_nights)<=3))return false;
    if(packTab.startsWith('c:')&&p.country!==packTab.slice(2))return false;
    const fromOk=!filt.fromCity||nrm(p.from_city).includes(nrm(filt.fromCity));
    const toOk=!filt.toCity||nrm(p.to_city).includes(nrm(filt.toCity));
    const startOk=!filt.startDate||!p.start_date||day10(p.start_date)>=filt.startDate;
    const endOk=!filt.endDate||!p.end_date||day10(p.end_date)<=filt.endDate;
    return fromOk&&toOk&&startOk&&endOk;
  });
  renderPackTabs(state.packs);
  if($('#packGrid'))$('#packGrid').innerHTML=rows.map(packCard).join('');
  if($('#packEmpty'))$('#packEmpty').style.display=rows.length?'none':'grid';
  if($('#packResultCount'))$('#packResultCount').textContent=rows.length+' offre'+(rows.length>1?'s':'');
  if($('#packSearchSummary'))$('#packSearchSummary').textContent=rows.length?'Packs correspondant à votre recherche':'Aucun pack publié';
  bindLinks($('#packGrid')||document);
}
function bindClientControls(){
  const showAuthView=view=>{
    const map={signin:'#authSignin',signup:'#authSignup',forgot:'#authForgot'};
    Object.values(map).forEach(sel=>$(sel)?.classList.remove('active'));
    $(map[view]||map.signin)?.classList.add('active');
  };
  // « Mot de passe oublié ? » du formulaire partenaire : même formulaire de réinitialisation par e-mail.
  $('#partnerForgot')?.addEventListener('click',()=>{const em=$('#partnerLoginForm')?.email?.value?.trim();page('login');location.hash='login';showAuthView('forgot');const f=$('#forgotPasswordForm');if(f?.email&&em)f.email.value=em});
  $$('[data-auth-view]').forEach(btn=>btn.addEventListener('click',()=>showAuthView(btn.dataset.authView)));
  $$('.password-toggle').forEach(btn=>btn.addEventListener('click',()=>{const input=btn.parentElement?.querySelector('input');if(!input)return;const reveal=input.type==='password';input.type=reveal?'text':'password';btn.textContent=reveal?'Masquer':'Afficher';btn.setAttribute('aria-label',reveal?'Masquer le mot de passe':'Afficher le mot de passe')}));
  $('#forgotPasswordForm')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.target,box=$('#forgotPasswordStatus'),btn=form.querySelector('button[type="submit"]'),label=btn.textContent;btn.disabled=true;btn.textContent='Envoi…';try{await api('/auth/forgot-password',{method:'POST',body:JSON.stringify({email:form.email.value.trim()})});if(box){box.hidden=false;box.className='auth-status info';box.textContent='Si ce compte existe, un e-mail contenant un lien de réinitialisation vient d’être envoyé. Pensez à vérifier vos courriers indésirables.'}form.reset()}catch(err){if(box){box.hidden=false;box.className='auth-status error';box.textContent='Impossible d’envoyer la demande pour le moment. Réessayez dans quelques instants.'}}btn.disabled=false;btn.textContent=label});
}
async function loginFrom(form){const email=form.querySelector('input[type="email"]')?.value?.trim();const password=form.querySelector('input[type="password"]')?.value;if(!email||!password)return toast('Renseignez votre e-mail et votre mot de passe.','error','Connexion');const stop=busy(form.querySelector('button[type="submit"]'),'Connexion…');pendingTab=window.open('about:blank','_blank');if(pendingTab)try{pendingTab.document.title='Connexion…';pendingTab.document.body.innerHTML='<p style="font-family:sans-serif;padding:32px;color:#555">Ouverture de votre espace…</p>'}catch{}try{setSession(await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})}))}catch(e){console.error(e);pendingTab?.close();pendingTab=null;toast(e.message==='EMAIL_NOT_VERIFIED'?'Votre compte n’est pas encore activé : cliquez sur le lien reçu par e-mail.':'Identifiants incorrects ou accès indisponible.','error','Connexion impossible')}finally{stop()}}

function bindPublicContactForm(){
  const form=$('#publicContactForm');if(!form||form.dataset.bound==='1')return;form.dataset.bound='1';
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const submit=form.querySelector('button[type="submit"]');
    const original=submit.innerHTML;
    const data=Object.fromEntries(new FormData(form));
    submit.disabled=true;submit.textContent='Envoi…';
    try{
      const res=await api('/public/contact',{method:'POST',body:JSON.stringify(data)});
      form.reset();
      toast(res?.sent?'Votre message a bien été envoyé.':'Votre message a bien été reçu.','success','Message envoyé');
    }catch(err){
      console.error(err);
      toast('Impossible d’envoyer le message pour le moment. Réessayez dans quelques instants.','error','Envoi impossible');
    }finally{
      submit.disabled=false;submit.innerHTML=original;
    }
  });
}

function setDefaultServiceDates(){
  const today=new Date(),tomorrow=new Date(today),weekend=new Date(today);tomorrow.setDate(today.getDate()+1);weekend.setDate(today.getDate()+3);
  const iso=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+day};
  [['#flightSimulator','departDate',today],['#flightSimulator','returnDate',tomorrow],['#carSearchForm','startDate',today],['#carSearchForm','endDate',tomorrow],['#packSimulator','startDate',today],['#packSimulator','endDate',weekend]].forEach(([sel,name,date])=>{const form=$(sel);if(form&&form.elements[name]&&!form.elements[name].value)form.elements[name].value=iso(date)});
}
function bindServiceSimulators(){
  setDefaultServiceDates();
  const flight=$('#flightSimulator');
  if(flight){
    $('#flightSwap')?.addEventListener('click',()=>{const a=flight.elements.fromCity,b=flight.elements.toCity;const tmp=a.value;a.value=b.value;b.value=tmp;});
    flight.querySelectorAll('input[name="tripType"]').forEach(r=>r.addEventListener('change',()=>{const oneway=flight.elements.tripType.value==='oneway',field=flight.querySelector('.flight-return-field');if(field)field.hidden=oneway;if(oneway)flight.elements.returnDate.value=''}));
    flight.addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(flight));if(d.returnDate&&d.departDate&&d.returnDate<d.departDate)return toast('La date de retour doit être postérieure à la date de départ.','error','Vérifiez vos dates');serviceFilters.flight={fromCity:cleanPlace(d.fromCity),toCity:cleanPlace(d.toCity),departDate:d.departDate||'',returnDate:d.returnDate||'',travelers:Number(d.travelers||1)};renderFlights();document.querySelector('#flights .service-results')?.scrollIntoView({behavior:'smooth',block:'start'})});
  }
  const pack=$('#packSimulator');
  if(pack){
    pack.addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(pack));if(d.endDate&&d.startDate&&d.endDate<d.startDate)return toast('La date de retour doit être postérieure à la date de départ.','error','Vérifiez vos dates');serviceFilters.pack={fromCity:cleanPlace(d.fromCity),toCity:cleanPlace(d.toCity),startDate:d.startDate||'',endDate:d.endDate||'',travelers:Number(d.travelers||2)};renderPacks();document.querySelector('#packs .service-results')?.scrollIntoView({behavior:'smooth',block:'start'})});
  }
}
function bindHomeSimulator(){
  const form=$('#homeCarSimulator');if(!form)return;
  const diff=form.elements.differentReturn,ret=form.querySelector('.simulator-return');
  const today=new Date();const iso=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+day};
  const tomorrow=new Date(today);tomorrow.setDate(today.getDate()+1);
  if(!form.elements.startDate.value)form.elements.startDate.value=iso(today);
  if(!form.elements.endDate.value)form.elements.endDate.value=iso(tomorrow);
  const syncReturn=()=>{if(ret)ret.hidden=!diff.checked;if(!diff.checked)form.elements.dropoff.value=''};
  diff?.addEventListener('change',syncReturn);syncReturn();
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form));
    if(data.endDate<data.startDate)return toast('La date de retour doit être postérieure à la date de départ.','error','Vérifiez vos dates');
    search={...search,pickup:data.pickup||'',startDate:data.startDate||'',startTime:data.startTime||'11:00',endDate:data.endDate||'',endTime:data.endTime||'11:00',age:Number(data.age||30),category:'all'};
    const carForm=$('#carSearchForm');
    if(carForm){
      for(const [name,value] of Object.entries(search)){const field=carForm.elements[name];if(field&&value!==undefined)field.value=value}
    }
    page('cars');location.hash='cars';window.carsSearched?.();
    try{
      state.vehicles=await api(window.carsPath());
    }catch(err){console.error(err);warnApi()}
    renderCars();
  });
}
function bindEvents(){bindLinks(document);onhashchange=()=>page(location.hash.slice(1)||'home');$('#burger')?.addEventListener('click',e=>{const nav=$('#mainNav');if(!nav)return;const open=nav.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open))});$$('[data-jump]').forEach(f=>f.onsubmit=e=>{e.preventDefault();page(f.dataset.jump);location.hash=f.dataset.jump});$('#flightSearch')?.addEventListener('input',renderFlights);$$('.pills[data-filter-group="flights"] .pill').forEach(b=>b.onclick=()=>{$$('.pills[data-filter-group="flights"] .pill').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderFlights()});$('#carSearchForm')?.addEventListener('submit',async e=>{e.preventDefault();search={...search,...Object.fromEntries(new FormData(e.target))};window.carsSearched?.();try{state.vehicles=await api(window.carsPath())}catch(err){console.error(err);warnApi()}renderCars();document.getElementById('carResultsAnchor')?.scrollIntoView({behavior:'smooth',block:'start'})});const loginForm=$('#loginForm');if(loginForm){loginForm.onsubmit=e=>{e.preventDefault();loginFrom(loginForm)}}
const partnerLoginForm=$('#partnerLoginForm');if(partnerLoginForm){partnerLoginForm.onsubmit=e=>{e.preventDefault();loginFrom(partnerLoginForm)}}
$('#clientRegisterForm')?.addEventListener('submit',async e=>{e.preventDefault();const stop=busy(e.target.querySelector('button[type="submit"]'),'Création du compte…');try{const data=await api('/auth/register-client',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});e.target.reset();const em=data.email;$$('.auth-view').forEach(v=>v.classList.remove('active'));$('#authSignin')?.classList.add('active');const emailInput=$('#loginForm input[type="email"]');if(emailInput)emailInput.value=em;toast('Un e-mail d’activation vient de vous être envoyé. Cliquez sur le lien reçu, puis connectez-vous.','success','Compte créé')}catch(err){console.error(err);toast(err.message==='EMAIL_EXISTS'?'Un compte existe déjà avec cet e-mail.':err.message==='WEAK_PASSWORD'?'Le mot de passe ne respecte pas les règles de sécurité.':'Impossible de créer le compte client.','error','Création du compte')}finally{stop()}})
$('#openPartnerApplication')?.addEventListener('click',()=>{const w=$('#partnerApplicationWrap');if(w){w.hidden=false;w.scrollIntoView({behavior:'smooth',block:'start'})}});
$('#closePartnerApplication')?.addEventListener('click',()=>{const w=$('#partnerApplicationWrap');if(w)w.hidden=true});
$('#partnerApplicationForm')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.target,submit=form.querySelector('button[type="submit"]');submit.disabled=true;try{await api('/public/partner-applications',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form)))});form.reset();toast('Votre demande a bien été transmise. TripVision reviendra vers vous après étude du dossier.','success','Demande envoyée');const w=$('#partnerApplicationWrap');if(w)w.hidden=true}catch(err){console.error(err);toast(err.message==='APPLICATION_EXISTS'?'Une demande existe déjà pour cet e-mail.':'Vérifiez les informations saisies puis réessayez.','error','Demande non envoyée')}finally{submit.disabled=false}});
}
async function init(){page(location.hash.slice(1)||'home');window.TVPassword?.enhance();prefillLoginEmail();if(token){try{await api('/auth/me')}catch{clearSession()}}updateAccount();bindEvents();bindServiceSimulators();bindHomeSimulator();bindClientControls();window.carsPaymentReturn?.();window.carsPrepareRestore?.();await loadPublic();window.carsRestore?.();bindPublicContactForm();page(location.hash.slice(1)||'home');openDeepLink()}
init();

function prefillLoginEmail(){try{const em=sessionStorage.getItem('tv_login_email');if(!em)return;sessionStorage.removeItem('tv_login_email');['#loginForm','#partnerLoginForm'].forEach(sel=>{const f=$(sel);if(f?.email)f.email.value=em});toast('Votre mot de passe est enregistré. Connectez-vous pour accéder à votre espace.','success','Compte activé')}catch{}}
async function openDeepLink(){
  const q=new URLSearchParams(location.search),offer=q.get('offer'),vehicle=q.get('annonce');
  if(!offer&&!vehicle)return;
  history.replaceState(null,'',location.pathname+location.hash);
  if(offer){
    const o=[...state.flights,...state.packs].find(x=>String(x.id)===offer);
    if(!o){page('flights');location.hash='flights';return toast('Cette offre n’est plus disponible ou n’est pas encore publiée.','error','Offre indisponible')}
    const kind=state.packs.some(x=>String(x.id)===offer)?'packs':'flights';
    page(kind);location.hash=kind;
    setTimeout(()=>{const card=document.querySelector(`[data-offer-id="${CSS.escape(offer)}"]`);card?.classList.add('deep-link-target');card?.scrollIntoView({behavior:'smooth',block:'center'});openOffer(offer)},200);
    return;
  }
  try{
    const v=await api(`/public/vehicles/${encodeURIComponent(vehicle)}`);
    await window.carsOpenVehicle(v);
  }catch{
    page('cars');location.hash='cars';
    toast('Cette annonce n’est pas visible en ce moment (louée, masquée ou programmée).','error','Annonce indisponible');
  }
}
document.addEventListener('click',e=>{const link=e.target.closest('[data-offer-title]');if(!link)return;const title=link.dataset.offerTitle;setTimeout(()=>{const form=document.querySelector('#publicContactForm');if(!form)return;if(form.subject&&!form.subject.value)form.subject.value=`Offre : ${title}`;if(form.message&&!form.message.value)form.message.value=`Bonjour, je suis intéressé(e) par l'offre « ${title} ». Pouvez-vous m'en dire plus ?`},80)});

/* ---------- Réservation d'un vol ou d'un pack ---------- */
let selectedOffer=null;
function chosenTrip(){return $('#offerRequestForm input[name="tripType"]:checked')?.value}
function offerUnit(o){const f=o.flight;return f&&f.tripType==='roundtrip'&&chosenTrip()==='oneway'&&f.oneWayPrice?Number(f.oneWayPrice):Number(o.price)}
function offerSummaryHtml(o){const f=o.flight,round=f?.tripType==='roundtrip'&&chosenTrip()!=='oneway';const rows=[[`${escapeHtml(o.from_city||'—')} → ${escapeHtml(o.to_city||'')}`,o.country?escapeHtml(o.country):'']];if(f){rows.push([`${escapeHtml(f.airline)}${f.flightNumber?' · '+escapeHtml(f.flightNumber):''}`,escapeHtml(f.cabin||'')]);rows.push([`<b>Aller</b> ${fmtDayFr(o.start_date)} · ${escapeHtml(f.departTime)} → ${escapeHtml(f.arriveTime)}${f.arriveDayOffset?` (+${f.arriveDayOffset} j)`:''}`,stopsText(f.stops)]);if(round)rows.push([`<b>Retour</b> ${fmtDayFr(o.end_date)} · ${escapeHtml(f.returnDepartTime)} → ${escapeHtml(f.returnArriveTime)}${f.returnDayOffset?` (+${f.returnDayOffset} j)`:''}`,''])}else{if(o.start_date)rows.push([`📅 ${fmtDayFr(o.start_date)}${o.end_date?' → '+fmtDayFr(o.end_date):''}`,'']);if(o.hotel_name)rows.push([`🏨 ${escapeHtml(o.hotel_name)}${o.hotel_stars?' · '+'★'.repeat(Number(o.hotel_stars)):''}`,`${o.hotel_nights||''} nuit${Number(o.hotel_nights)>1?'s':''}${o.hotel_board?' · '+escapeHtml(o.hotel_board):''}`])}return rows.map(([a,b])=>`<div><span>${a}</span><em>${b}</em></div>`).join('')}
function updateOfferTotal(){const o=selectedOffer,form=$('#offerRequestForm');if(!o||!form)return;const n=Number(form.elements.travelers.value||1),u=offerUnit(o);$('#offerSummary').innerHTML=offerSummaryHtml(o);$('#offerRequestTotal').innerHTML=`<span>${n} voyageur${n>1?'s':''} × ${money(u)}${o.flight?(chosenTrip()==='oneway'||o.flight.tripType==='oneway'?' · aller simple':' · aller-retour'):''}</span><strong>${money(u*n)}</strong>`}
function openOffer(id){const o=[...state.flights,...state.packs].find(x=>String(x.id)===String(id));if(!o)return;selectedOffer=o;$('#offerModalTitle').textContent=o.flight?'Réserver ce vol':'Réserver ce pack';$('#offerName').textContent=o.title||`${o.from_city||''} → ${o.to_city||''}`;const form=$('#offerRequestForm');const choice=$('#offerTripChoice'),canChoose=Boolean(o.flight&&o.flight.tripType==='roundtrip'&&o.flight.oneWayPrice);if(choice){choice.hidden=!canChoose;choice.querySelectorAll('input').forEach(r=>{r.disabled=!canChoose;r.checked=r.value==='roundtrip'});if(canChoose){$('#priceRT').textContent=money(o.price);$('#priceOW').textContent=money(o.flight.oneWayPrice)}}$('#offerSummary').innerHTML=offerSummaryHtml(o);form.elements.travelers.value=String(Math.min(9,Math.max(1,Number(o.flight?serviceFilters.flight.travelers:serviceFilters.pack.travelers)||1)));updateOfferTotal();const pack=!o.flight,known=(()=>{try{return JSON.parse(localStorage.getItem('tvContact')||'null')}catch{return null}})();$('#offerContact').hidden=pack;$('#offerOptin').hidden=pack;$('#offerAccountNote').hidden=!pack;form.elements.email.required=!pack;form.elements.marketing.checked=false;if(!pack&&known){form.elements.email.value=known.email||'';form.elements.name.value=known.name||'';form.elements.phone.value=known.phone||'';form.elements.marketing.checked=Boolean(known.marketing)}
$('#offerModal').classList.add('open');if(!pack)form.elements.email.focus()}
function closeOffer(){$('#offerModal')?.classList.remove('open')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-offer-book]');if(b){e.preventDefault();openOffer(b.dataset.offerBook)}});
$('#closeOfferModal')?.addEventListener('click',closeOffer);
$('#offerModal')?.addEventListener('click',e=>{if(e.target.id==='offerModal')closeOffer()});
$('#offerRequestForm')?.elements.travelers?.addEventListener('change',updateOfferTotal);$('#offerTripChoice')?.addEventListener('change',updateOfferTotal);
$('#flightDirect')?.addEventListener('change',renderFlights);
$('#offerRequestForm')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.target,btn=form.querySelector('button[type="submit"]'),label=btn.textContent;btn.disabled=true;btn.textContent='Envoi en cours…';try{const pack=!selectedOffer.flight,fd=Object.fromEntries(new FormData(form));fd.marketing=form.elements.marketing.checked;let headers={};if(pack){const s=await TVAuth.require({reason:'Pour réserver un pack, connectez-vous ou créez votre compte TripVision.'});headers=TVAuth.headers();fd.email=s.user.email;fd.name=s.user.name}
const r=await api('/public/offer-requests',{method:'POST',headers,body:JSON.stringify({offerId:selectedOffer.id,...fd})});
if(!pack){try{localStorage.setItem('tvContact',JSON.stringify({email:fd.email,name:fd.name||'',phone:fd.phone||'',marketing:fd.marketing}))}catch{}}
form.reset();closeOffer();toast(r.returning?'Ravi de vous revoir ! Nous revenons vers vous très vite pour confirmer.':'Nous revenons vers vous très vite par e-mail pour confirmer votre réservation.','success','Demande envoyée')}catch(err){if(err.message==='CANCELLED'){btn.disabled=false;btn.textContent=label;return}console.error(err);toast(err.message==='TOO_MANY_ATTEMPTS'?'Trop de demandes, réessayez plus tard.':err.message==='ACCOUNT_REQUIRED'?'Un compte est nécessaire pour réserver un pack.':'Impossible d’envoyer la demande. Vérifiez vos informations.','error','Erreur')}btn.disabled=false;btn.textContent=label});


/* ---------- Destinations en photos et crédits ---------- */
document.addEventListener('click', e => {
  const f = e.target.closest('[data-dest-flight]'), k = e.target.closest('[data-dest-pack]');
  if (f || k) {
    const form = $(f ? '#flightSimulator' : '#packSimulator');
    if (!form) return;
    form.elements.toCity.value = (f || k).dataset[f ? 'destFlight' : 'destPack'];
    form.requestSubmit();
    $(f ? '.flight-results-premium' : '.weekend-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});


/* ---------- Pas de date passée pour une réservation ---------- */
function bindDateGuards(){
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today=iso(new Date());
  const pairs=[['#carSearchForm','startDate','endDate'],['#homeCarSimulator','startDate','endDate'],['#flightSimulator','departDate','returnDate'],['#packSimulator','startDate','endDate']];
  for(const [sel,a,b] of pairs){
    const form=$(sel);if(!form||!form.elements[a])continue;
    const start=form.elements[a],end=form.elements[b];
    const sync=()=>{start.min=today;if(start.value&&start.value<today)start.value=today;end.min=start.value||today;if(end.value&&end.value<end.min)end.value=end.min};
    start.addEventListener('change',sync);end.addEventListener('change',sync);sync();
  }
}
bindDateGuards();
