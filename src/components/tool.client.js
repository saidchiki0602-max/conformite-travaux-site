var S={}, cur=1, N=5, MODE='vendeur';

/* Le test porte sur le bien, pas sur la personne : un agent ou un notaire peut
   le faire sur le bien d'un client. Seule la façon de rendre le résultat change. */
var modeBox=document.getElementById('mode');
modeBox&&modeBox.addEventListener('click',function(e){
  var b=e.target.closest('button[data-m]'); if(!b) return;
  modeBox.querySelectorAll('button').forEach(function(x){x.classList.remove('on')});
  b.classList.add('on'); MODE=b.dataset.m;
  var sel=document.querySelector('#mailf select[name=role]');
  if(sel) for(var i=0;i<sel.options.length;i++) if(sel.options[i].text===b.dataset.role) sel.selectedIndex=i;
});
var qs=document.querySelectorAll('.q[data-q]');
var nextB=document.getElementById('next'), prevB=document.getElementById('prev'), prog=document.getElementById('prog').children;

document.querySelectorAll('.opts').forEach(function(g){
  g.addEventListener('click',function(e){
    var b=e.target.closest('.opt'); if(!b) return;
    g.querySelectorAll('.opt').forEach(function(x){x.setAttribute('aria-pressed','false')});
    b.setAttribute('aria-pressed','true'); S[g.dataset.key]=b.dataset.v; nextB.disabled=false;
    if(cur<N) setTimeout(go.bind(null,cur+1),220); // avance automatiquement, sauf à la dernière
  });
});
function go(n){
  cur=n;
  qs.forEach(function(q){q.hidden=(+q.dataset.q!==n)});
  for(var i=0;i<prog.length;i++) prog[i].classList.toggle('on',i<n);
  prevB.hidden=(n===1);
  var key=['t','a','u','w','d'][n-1]; nextB.disabled=!S[key];
  nextB.textContent=(n===N)?'Voir ce qui manquera':'Suivant';
  document.getElementById('tool').scrollIntoView({behavior:'smooth',block:'start'});
}
nextB.addEventListener('click',function(){ if(cur<N) go(cur+1); else show(); });
prevB.addEventListener('click',function(){ if(cur>1) go(cur-1); });

function show(){
  var P=rules(S), r=verdict(S,P);
  qs.forEach(function(q){q.hidden=true}); document.querySelector('.qnav').hidden=true; document.getElementById('prog').hidden=true;
  var ring=document.getElementById('ring'); ring.style.setProperty('--v',Math.max(r.pct,4)); ring.style.setProperty('--c',r.c);
  document.getElementById('ringv').textContent=r.ok+'/'+r.tot;
  document.getElementById('rtitle').textContent=r.title; document.getElementById('rsub').textContent=r.sub;
  document.getElementById('rcount').textContent=P.length+' pièces examinées';
  document.getElementById('pieces').innerHTML=P.map(function(p){
    var g=(p.g&&window.GUIDES&&window.GUIDES[p.g])?'<a class="glk" href="'+window.GUIDES[p.g]+'">Le guide complet sur ce point →</a>':'';
    return '<div class="pc '+p.st+'"><b>'+p.n+'</b><span class="tag '+(p.st==='na'?'mute':p.st)+'">'+p.tag+'</span><small>'+p.d+'</small>'+(p.why?'<div class="why">'+p.why+g+'</div>':(g?'<div class="why">'+g+'</div>':''))+'</div>'}).join('');
  document.getElementById('law').innerHTML=r.law;
  document.getElementById('actl').innerHTML=r.acts.map(function(a){return '<li>'+a+'</li>'}).join('');
  var pn=document.getElementById('pronote');
  if(MODE==='vendeur'){ pn.hidden=true; }
  else {
    pn.hidden=false;
    pn.innerHTML = MODE==='agent'
      ? '<b>Vous regardez le bien d\'un client.</b> Ce qui suit est écrit pour le vendeur : imprimez-le et remettez-le-lui au rendez-vous d\'estimation. Les pièces bloquantes sont ce qui fera caler la vente chez le notaire — autant le dire avant de signer le mandat.'
      : '<b>Vous regardez le bien d\'un dossier.</b> Ce qui suit est écrit pour le vendeur : envoyez-le-lui tel quel, il saura quoi chercher et où. Les mentions d\'acte et les clauses restent votre appréciation.';
  }
  var res=document.getElementById('res'); res.classList.add('on');
  document.getElementById('tool').scrollIntoView({behavior:'smooth',block:'start'});
  window._lastResult={answers:S,ko:r.ko,warn:r.warn,ok:r.ok,title:r.title};
  window.dispatchEvent(new CustomEvent('ct:result'));
}
var againB=document.getElementById('again'); againB&&againB.addEventListener('click',function(){
  S={}; document.querySelectorAll('.opt').forEach(function(x){x.setAttribute('aria-pressed','false')});
  document.getElementById('res').classList.remove('on'); document.querySelector('.qnav').hidden=false; document.getElementById('prog').hidden=false; go(1);
});
var printB=document.getElementById('print'); printB&&printB.addEventListener('click',function(){ try{window.print()}catch(e){} });
