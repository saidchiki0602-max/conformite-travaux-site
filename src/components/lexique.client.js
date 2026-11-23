/* Lexique : une seule version du texte pour tout le monde.
   Le vocabulaire du métier reste écrit tel quel ; le premier emploi de chaque terme,
   dans chaque bloc, devient cliquable et ouvre une explication en français courant.
   Les professionnels ne voient qu'un soulignement discret ; les particuliers tapent. */
(function () {
  if (!window.LEXIQUE || !window.LEXIQUE.length) return;

  // Trié du plus long au plus court : « garantie décennale » avant « décennale ».
  var TERMS = [];
  window.LEXIQUE.forEach(function (e) {
    [e.t].concat(e.v || []).forEach(function (label) { TERMS.push({ label: label, d: e.d, key: e.t }); });
  });
  TERMS.sort(function (a, b) { return b.label.length - a.label.length; });

  var SEL = '.pc small, .pc .why, .art p, .art li, .vi p, .law p, .card li, .acts li, .score p, .q .help, .gi p, .sub';
  var ESC = /[.*+?^${}()|[\]\\]/g;
  var apos = function (s) { return s.replace(/['’]/g, "['’]"); };

  function decorate(root) {
    var blocks = (root || document).querySelectorAll(SEL);
    blocks.forEach(function (block) {
      if (block.dataset.lex) return;
      block.dataset.lex = '1';
      var seen = {};
      TERMS.forEach(function (t) {
        if (seen[t.key]) return;
        var re = new RegExp('(^|[\\s(«"\'’,;:—-])(' + apos(t.label.replace(ESC, '\\$&')) + ')(?![\\wÀ-ÿ])', 'i');
        var walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
        var node, hit = null;
        while ((node = walker.nextNode())) {
          if (node.parentElement.closest('button, a, .dfn, b, h1, h2, h3, h4')) continue;
          if (re.test(node.nodeValue)) { hit = node; break; }
        }
        if (!hit) return;
        seen[t.key] = 1;
        var m = hit.nodeValue.match(re);
        var before = hit.nodeValue.slice(0, m.index + m[1].length);
        var word = m[2];
        var after = hit.nodeValue.slice(m.index + m[0].length);
        var btn = document.createElement('button');
        btn.className = 'dfn'; btn.type = 'button'; btn.textContent = word;
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', word + ' — voir la définition');
        btn.dataset.d = t.d;
        var frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode(before));
        frag.appendChild(btn);
        frag.appendChild(document.createTextNode(after));
        hit.parentNode.replaceChild(frag, hit);
      });
    });
  }

  var pop = null;
  function close() {
    if (!pop) return;
    var b = pop._btn; if (b) b.setAttribute('aria-expanded', 'false');
    pop.remove(); pop = null;
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.dfn');
    if (!btn) { if (!e.target.closest('.dfnpop')) close(); return; }
    e.preventDefault();
    if (pop && pop._btn === btn) { close(); return; }
    close();
    pop = document.createElement('span');
    pop.className = 'dfnpop';
    pop.innerHTML = '<b></b><span></span>';
    pop.querySelector('b').textContent = btn.textContent;
    pop.querySelector('span').textContent = btn.dataset.d;
    pop._btn = btn;
    btn.setAttribute('aria-expanded', 'true');
    btn.insertAdjacentElement('afterend', pop);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  decorate();
  // Le résultat du test est construit après coup : on redécore à chaque affichage.
  window.addEventListener('ct:result', function () { decorate(document.getElementById('res')); });
})();
