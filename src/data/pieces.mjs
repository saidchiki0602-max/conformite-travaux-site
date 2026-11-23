// ════════════════════════════════════════════════════════════════════
//  LE CONTENU JURIDIQUE DE L'OUTIL VIT ICI, ET NULLE PART AILLEURS.
//  Une règle à corriger, un texte à préciser : c'est dans ce fichier.
//  Entrées : t (ext|annexe|reno|neuve) · a (lt10|gt10|unk) · u (oui|unk|non)
//            w (ent|soi|mix) · d (oui|non)
//  Sortie  : [{n: nom, st: ko|warn|ok|na, tag, d: explication, why: chemin}]
// ════════════════════════════════════════════════════════════════════
// Entrées : t (ext|annexe|reno|neuve), a (lt10|gt10|unk), u (oui|unk|non), w (ent|soi|mix), d (oui|non)
// Sortie : liste de pièces {n, st: ko|warn|ok|na, tag, d, why}
export function rules(s){
  var P=[];
  var recent=s.a==='lt10', old=s.a==='gt10', unk=s.a==='unk';
  var surface=(s.t==='ext'||s.t==='neuve'||s.t==='annexe');
  var ent=(s.w==='ent'||s.w==='mix'), soi=(s.w==='soi'||s.w==='mix');
  var what={ext:'l’extension',annexe:'l’annexe',reno:'la rénovation',neuve:'la maison'}[s.t];

  // 1. Autorisation d'urbanisme
  if(surface){
    if(s.u==='oui') P.push({n:'Autorisation d’urbanisme de '+what,st:'ok',tag:'À joindre à l’acte',d:'Arrêté de permis ou de non-opposition à déclaration préalable, avec les plans autorisés. C’est la pièce de référence : tout le reste se vérifie par rapport à elle.',why:'Si vous n’avez plus la copie : la mairie la délivre sur demande (document administratif communicable).'});
    else if(s.u==='unk') P.push({n:'Autorisation d’urbanisme de '+what,st:old?'warn':'ko',tag:old?'À retrouver':'Bloquant tant qu’introuvable',d:'Sans elle, impossible de dire si ce qui est construit était autorisé. Le notaire ne peut pas l’ignorer.'+(s.t==='annexe'?' Exception : un abri de moins de 5 m² d’emprise ou une piscine de moins de 10 m² ne demandaient aucune formalité.':''),why:'<b>Chemin :</b> demande écrite au service urbanisme de la mairie, au nom des propriétaires successifs ; réponse sous un mois. Si rien n’existe, on retombe dans le cas « aucune autorisation » ci-dessous.'});
    else if(old) P.push({n:'Autorisation d’urbanisme de '+what,st:'warn',tag:'À mentionner dans l’acte',d:'Construit sans autorisation il y a plus de dix ans : plus personne ne peut vous poursuivre ni exiger la démolition — les délais sont passés (six ans au pénal, dix ans pour la démolition). L’irrégularité n’est pas effacée pour autant.',why:'<b>Chemin :</b> l’acte le dira et l’acquéreur sera informé. Passé dix ans, la mairie ne peut plus opposer cette irrégularité à une future demande de travaux (art. L421-9) — <b>sauf</b> si les travaux relevaient d’un permis de construire et qu’aucun n’a été obtenu : dans ce cas, la régularisation de l’existant pourra être exigée le jour où l’acquéreur voudra agrandir. Dites-le-lui.'});
    else P.push({n:'Autorisation d’urbanisme de '+what,st:'ko',tag:'Bloquant',d:'Construit sans permis ni déclaration il y a moins de dix ans : l’acquéreur achèterait une infraction en cours, avec le risque de démolition qui va avec.'+(s.t==='annexe'?' Exception : un abri de moins de 5 m² d’emprise ou une piscine de moins de 10 m² ne demandaient rien — dans ce cas, rien à régulariser.':''),why:'<b>Chemin :</b> permis ou déclaration préalable de régularisation, si les travaux respectent le PLU en vigueur (1 à 3 mois d’instruction, 0 € de taxe si déjà payée). Sinon : mise en conformité. À lancer <b>avant</b> le compromis.'});
  } else {
    P.push({n:'Autorisation d’urbanisme',st:'warn',tag:'À vérifier',d:'Une rénovation intérieure n’en demande pas — sauf si elle a modifié l’aspect extérieur (façade, toiture, ouvertures créées ou agrandies), créé de la surface de plancher (garage ou combles devenus habitables) ou changé la destination du bâtiment.',why:'<b>Chemin :</b> si c’est le cas, déclaration préalable de régularisation. Sinon, rien à produire : le notaire le notera.'});
  }

  // 2. DAACT
  if(surface && s.u!=='non'){
    P.push({n:'Déclaration de fin de travaux (la « DAACT ») et attestation de la mairie',st:old?'warn':'ko',tag:old?'À retrouver ou à déposer':'Bloquant si absente',d:'Le permis dit ce qui était autorisé ; la DAACT dit que c’est bien ce qui a été construit. Sans elle, la conformité n’a jamais été constatée — et peut être contestée.',why:'<b>Chemin :</b> dépôt tardif possible, avec le formulaire Cerfa 13408. La mairie a 3 mois pour contester, et peut venir vérifier sur place (5 mois en secteur protégé), puis délivre l’attestation de non-contestation sous 15 jours. Compter 4 mois : c’est la pièce qui décide la date de l’acte.'+(old?' Pour des travaux achevés avant octobre 2007, la pièce équivalente est le <b>certificat de conformité</b> délivré par la mairie : demandez-en copie.':'')});
  }

  // 3. Dommages-ouvrage
  if(s.t==='reno'){
    if(recent||unk) P.push({n:'Assurance dommages-ouvrage',st:'warn',tag:'Selon les travaux',d:'Obligatoire si la rénovation a touché la structure (murs porteurs, planchers, charpente). Pas pour une cuisine ou une salle de bains.',why:'<b>Chemin :</b> si gros œuvre et pas de DO, l’acte le mentionnera (voir ci-dessous). Si pas de gros œuvre : rien à produire.'});
    else P.push({n:'Assurance dommages-ouvrage',st:'na',tag:'Non exigible',d:'Plus de dix ans : sa période est écoulée.'});
  } else if(old){
    P.push({n:'Assurance dommages-ouvrage',st:'na',tag:'Non exigible',d:'Plus de dix ans : sa période de couverture est écoulée. Son absence sera simplement mentionnée.'});
  } else if(s.d==='oui'){
    P.push({n:'Assurance dommages-ouvrage',st:'ok',tag:'À joindre à l’acte',d:'Attestation ou contrat. Elle suit le bien : l’acquéreur en bénéficie jusqu’à la fin des dix ans. C’est un vrai argument de vente, dites-le.'});
  } else if(unk){
    P.push({n:'Assurance dommages-ouvrage',st:'warn',tag:'À dater d’abord',d:'Tout dépend de la date de fin des travaux : moins de dix ans, son absence compte ; plus de dix ans, non.',why:'<b>Chemin :</b> retrouvez la dernière facture ou le PV de réception, c’est ce qui date les travaux. Puis refaites le test.'});
  } else {
    P.push({n:'Assurance dommages-ouvrage',st:'ko',tag:'À déclarer dans l’acte',d:'Obligatoire avant l’ouverture du chantier (art. L242-1 C. assurances). Son absence n’empêche pas la vente, mais le notaire doit informer l’acquéreur et l’écrire : il hérite d’un risque non assuré jusqu’à la fin de la décennale.',why:'<b>Irrattrapable</b> après coup. Ce qui se rattrape, c’est la surprise : découvert chez le notaire, cela se paie en négociation ; annoncé dès l’annonce, presque pas. Confirmez-le par écrit plutôt que de laisser planer le doute.'});
  }

  // 4. Décennales des entreprises
  if(ent){
    if(old) P.push({n:'Attestations décennales des entreprises',st:'na',tag:'Utile, pas exigible',d:'Garanties éteintes. La pièce rassure l’acquéreur et évite une réserve dans l’acte, sans plus.'});
    else P.push({n:'Attestations décennales des entreprises',st:'warn',tag:'À réunir',d:'La décennale, c’est l’assurance qui oblige une entreprise à réparer pendant dix ans les désordres graves de ce qu’elle a construit. Il en faut une par entreprise, valable à la date d’ouverture du chantier (pas aujourd’hui), couvrant le métier réalisé. Une attestation d’une autre année ou d’un autre métier ne prouve rien.',why:'<b>Chemin :</b> demandez-les aux entreprises ; si l’une a disparu, son assureur de l’époque reste tenu — la facture ou l’ancienne attestation permet de le retrouver et de faire confirmer la couverture. <b>Pourquoi ça vous concerne :</b> en vendant dans les dix ans, vous êtes réputé constructeur envers l’acquéreur (art. 1792-1 C. civ.) ; ces attestations sont votre recours si un désordre apparaît après la vente.'});
  }
  if(soi){
    P.push({n:'Travaux réalisés par le vendeur lui-même',st:old?'na':'warn',tag:old?'Responsabilité éteinte':'Responsabilité personnelle 10 ans',d:'Celui qui construit pour lui-même est constructeur au sens de la loi (art. 1792-1 C. civ.) : il reste tenu de la garantie décennale envers l’acquéreur, sans assureur derrière lui.',why:old?'':'<b>Chemin :</b> aucune pièce ne remplace ça ; l’acte le mentionnera. Photos du chantier et factures de matériaux aident à prouver ce qui a été fait, et comment.'});
  }

  // 5. Factures
  P.push({n:'Factures des travaux',st:'warn',tag:'À réunir',d:ent?'Elles datent les travaux (point de départ des dix ans), identifient les responsables, et entrent dans le calcul de la plus-value.':'Factures de matériaux : elles datent les travaux. Pour la plus-value, seul le travail d’entreprise est déductible, pas votre main-d’œuvre.',why:'<b>Où chercher :</b> vos mails de l’année des travaux (« facture », nom de l’entreprise), votre banque (le virement donne la date et le nom), l’entreprise elle-même.'});

  // 6. PV de réception
  if(ent) P.push({n:'PV de réception',st:(recent||unk)?'warn':'na',tag:(recent||unk)?'Utile':'Utile, pas exigible',d:'Fixe le point de départ des garanties. Sans PV, la dernière facture ou la prise de possession font foi — avec plus de discussion.'});

  // 7. RT2012 / RE2020
  if(s.t==='neuve'){
    if(old) P.push({n:'Attestation RT2012 / RE2020',st:'na',tag:'Non exigible',d:'Construction antérieure à la réglementation thermique en vigueur.'});
    else P.push({n:'Attestation de prise en compte RT2012 ou RE2020',st:'warn',tag:'Exigible',d:'C’est la preuve que la construction respecte la réglementation sur l’isolation et l’énergie. Établie à la fin du chantier par un diagnostiqueur, un architecte ou un bureau de contrôle, et jointe à la déclaration de fin de travaux. RT2012 si le permis date d’après 2013, RE2020 après 2022.',why:'<b>Chemin :</b> si elle n’a jamais été faite, un diagnostiqueur peut l’établir a posteriori sur la base de l’étude thermique du permis.'});
  }
  if(s.t==='ext'&&(recent||unk)) P.push({n:'Attestation RT2012 / RE2020 (extension)',st:'warn',tag:'Si plus de 50 m²',d:'Selon la surface créée : rien en dessous de 50 m² ; attestation simplifiée entre 50 et 150 m² (si moins de 30 % de l’existant) ; attestation complète au-delà, comme pour une maison neuve.'});

  // 8. Consuel
  if(s.t==='reno') P.push({n:'Attestation Consuel (électricité)',st:'warn',tag:'À retrouver',d:'Si l’installation a été refaite ou le compteur remplacé. Le diagnostic électrique de la vente ne la remplace pas.',why:'<b>Chemin :</b> copie récupérable auprès du Consuel avec l’adresse et l’année.'});
  if(s.t==='neuve') P.push({n:'Attestation Consuel (électricité)',st:old?'na':'warn',tag:old?'Utile':'Exigible',d:'Obligatoire pour la mise sous tension d’une construction neuve : elle existe forcément. À retrouver ou à redemander au Consuel.'});

  // 9. Taxe d'aménagement / foncier
  if(surface) P.push({n:'Déclaration de la surface aux impôts et taxe d’aménagement',st:'warn',tag:'À vérifier',d:'Toute surface créée devait être déclarée au fisc dans les 90 jours. Sinon, le redressement de taxe foncière tombe sur le propriétaire du moment — donc, demain, sur l’acquéreur.',why:'<b>Chemin :</b> vérifier sur l’avis de taxe foncière si la surface correspond ; sinon, déclaration rectificative sur impots.gouv, espace « biens immobiliers » (c’est le formulaire H1 ou IL).'});

  // 10. Piscine
  if(s.t==='annexe') P.push({n:'Dispositif de sécurité (si piscine)',st:'warn',tag:'À vérifier',d:'Piscine enterrée ou semi-enterrée : barrière, alarme, couverture ou abri aux normes, avec l’attestation de conformité du fabricant ou de l’installateur. Exigée à la vente.',why:'Sans objet pour une véranda, un garage ou un abri.'});

  // 11. CCMI
  if(s.t==='neuve'&&!old&&ent) P.push({n:'Contrat de construction (CCMI) et garantie de livraison',st:'warn',tag:'À joindre',d:'Pour une maison récente : le contrat, l’attestation de garantie de livraison, le PV de réception et la levée des réserves. Si lots séparés : les marchés de chaque entreprise.'});

  // 12. Parfait achèvement
  if(recent) P.push({n:'Garantie de parfait achèvement',st:'na',tag:'Éteinte',d:'Elle oblige l’entreprise à reprendre les défauts signalés pendant la première année seulement. Passé ce délai, elle ne concerne plus la vente.'});

  // chaque pièce pointe vers le guide qui la traite en détail
  var G={ext:'vendre-maison-extension-sans-permis',neuve:'vendre-maison-extension-sans-permis',annexe:'veranda-piscine-non-declaree-vente'};
  P.forEach(function(x){
    if(/^Autorisation d/.test(x.n) && G[s.t]) x.g=G[s.t];
    if(/^Déclaration de fin de travaux/.test(x.n)) x.g='declaration-achevement-daact-non-deposee';
    if(/^Dispositif de sécurité/.test(x.n)) x.g='veranda-piscine-non-declaree-vente';
  });

  // tri : ko, warn, ok, na
  var o={ko:0,warn:1,ok:2,na:3};
  P.sort(function(a,b){return o[a.st]-o[b.st]});
  return P;
}

export function verdict(s,P){
  var ko=P.filter(function(p){return p.st==='ko'}).length, warn=P.filter(function(p){return p.st==='warn'}).length, ok=P.filter(function(p){return p.st==='ok'}).length, na=P.filter(function(p){return p.st==='na'}).length;
  var tot=ko+warn+ok; var old=s.a==='gt10';
  var r={ko:ko,warn:warn,ok:ok,na:na,tot:tot,pct:tot?Math.round(ok/tot*100):100};
  if(ko>0){r.c='var(--ko)';r.title='Le dossier n’est pas prêt pour l’acte';r.sub=ko+' pièce'+(ko>1?'s':'')+' bloquante'+(ko>1?'s':'')+', '+warn+' à réunir ou vérifier, '+na+' non exigible'+(na>1?'s':'')+'. Le temps joue contre vous : commencez par les bloquantes.';}
  else if(warn>0){r.c='var(--warn)';r.title='Presque prêt : des pièces à réunir';r.sub='Rien ne devrait empêcher la signature, mais '+warn+' pièce'+(warn>1?'s':'')+' manque'+(warn>1?'nt':'')+' encore et chacune peut devenir une réserve dans l’acte.';}
  else {r.c='var(--ok)';r.title='Rien ne devrait bloquer';r.sub='Les pièces sont là ou non exigibles. Le notaire les annexera.';}
  // conséquence
  if(ko>0&&!old) r.law='<b>Ce que ça change à la signature</b><p>Avec '+ko+' pièce'+(ko>1?'s':'')+' bloquante'+(ko>1?'s':'')+', le notaire devra soit <em>reporter</em> la signature, soit <em>informer l’acquéreur et insérer une clause</em> (décharge, prix ajusté, somme séquestrée), soit obtenir la <em>régularisation</em> avant l’acte. Compter <em>1 à 4 mois</em> selon la pièce. Plus c’est lancé tôt, moins ça se négocie.</p>';
  else if(ko>0) r.law='<b>Ce que ça change à la signature</b><p>La vente peut se signer : le notaire <em>mentionnera</em> ce qui manque et l’acquéreur en sera <em>informé par écrit</em>. Le prix s’en ressentira si c’est découvert tard ; presque pas si c’est annoncé dès l’annonce.</p>';
  else if(old&&s.u==='non') r.law='<b>Ce que ça change à la signature</b><p>La vente peut se signer. Le notaire <em>mentionnera l’absence d’autorisation</em> et l’acquéreur en sera informé. S’il veut un jour agrandir, la mairie pourra exiger la régularisation de l’existant : dites-le-lui, c’est ce qui évite le litige après la vente.</p>';
  else if(warn>0) r.law='<b>Ce que ça change à la signature</b><p>Pas de blocage, mais chaque pièce absente devient une <em>réserve dans l’acte</em> — et une réserve, c’est un argument de négociation pour l’acquéreur. Réunies avant le compromis, elles ne coûtent rien.</p>';
  else r.law='<b>Ce que ça change à la signature</b><p>Rien : les pièces sont annexées, l’acte est <em>sans réserve</em>. C’est rare, profitez-en dans l’annonce.</p>';
  // actions
  r.acts=[];
  P.forEach(function(p){ if(r.acts.length<3 && (p.st==='ko'||p.st==='warn') && p.why){ var t=p.why.replace(/<b>Chemin :<\/b>\s*/,'').replace(/<b>Où chercher :<\/b>\s*/,'').replace(/<[^>]+>/g,''); r.acts.push('<b>'+p.n+'</b> — '+t); }});
  if(!r.acts.length) r.acts.push('<b>Rassemblez les pièces</b> dans un seul dossier et remettez-le à votre notaire dès le compromis.');
  return r;
}

