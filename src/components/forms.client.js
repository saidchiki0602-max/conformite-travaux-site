/* ========== Formulaires (même contrat que kaertgroupe.com) ========== */
function wire(form,extra){
  if(!form) return;
  var ok=form.querySelector('[data-ok]'), err=form.querySelector('[data-err]');
  form.addEventListener('submit',function(e){
    e.preventDefault(); err.hidden=true;
    var fd=new FormData(form); if((fd.get('website')||'').length) return;
    var contact=(fd.get('contact')||'').trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact)){err.textContent='Indiquez une adresse e-mail valide.';err.hidden=false;return}
    var payload={source:'conformite-travaux',role:fd.get('role'),nom:'',contact:contact,message:(fd.get('message')||'').trim()+(extra?' | '+extra():''),page:location.pathname,ua:navigator.userAgent};
    var btn=form.querySelector('button[type=submit]'); btn.disabled=true;
    if(!FORM_ENDPOINT){
      var body=encodeURIComponent('Conformité Travaux — '+payload.role+'\nContact : '+contact+'\n'+payload.message);
      err.innerHTML='Le formulaire sera actif très bientôt. En attendant : <b>contact@kaertgroupe.com</b> — <a href="mailto:contact@kaertgroupe.com?subject=Conformit%C3%A9%20Travaux&body='+body+'">ouvrir un e-mail prérempli</a>.';
      err.hidden=false; btn.disabled=false; return;
    }
    fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','apikey':FORM_ANON,'Authorization':'Bearer '+FORM_ANON,'Prefer':'return=minimal'},body:JSON.stringify(payload)})
      .then(function(r){ if(!r.ok) throw 0; ok.hidden=false; form.reset(); })
      .catch(function(){ err.textContent='Envoi impossible pour le moment. Écrivez-nous à contact@kaertgroupe.com.'; err.hidden=false; btn.disabled=false; });
  });
}
wire(document.getElementById('mailf'),function(){ var r=window._lastResult||{}; return 'test:'+JSON.stringify(r.answers||{})+' ko='+r.ko+' warn='+r.warn+' ok='+r.ok; });
wire(document.getElementById('waitf'));

/* Le visiteur a cliqué depuis une offre : le formulaire s'ouvre déjà à son rôle. */
document.addEventListener('click', function (e) {
  var a = e.target.closest('[data-role]'); if (!a) return;
  var sel = document.querySelector('#waitf select[name=role]'); if (!sel) return;
  for (var i = 0; i < sel.options.length; i++) if (sel.options[i].text === a.dataset.role) sel.selectedIndex = i;
  var t = document.getElementById('waitf-title');
  if (t) t.textContent = a.dataset.role === 'Vendeur' ? 'Prévenez-moi quand le dossier ouvre.' : 'Prévenez-moi, et prenez-moi dans les premiers.';
});
