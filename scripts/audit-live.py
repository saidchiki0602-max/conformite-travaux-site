#!/usr/bin/env python3
"""Passe les critères automatisables de la grille Webenvue (70 critères) sur un site EN LIGNE.
usage : python3 -I audit70.py https://exemple.fr"""
import sys, re, json, subprocess, collections
from urllib.parse import urljoin, urlparse

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'https://' + open('public/CNAME').read().strip()).rstrip('/')
HOST = urlparse(BASE).netloc

def curl(url, head=False, follow=True, maxt=20):
    a = ['curl', '-s'] + (['--noproxy', '*'] if 'localhost' in url else []) + [ '-m', str(maxt), '-A', 'Mozilla/5.0 (audit qualite)']
    if follow: a.append('-L')
    if head: a += ['-o', '/dev/null', '-w', '%{http_code} %{url_effective} %{size_download} %{time_total}']
    r = subprocess.run(a + [url], capture_output=True)
    return r.stdout.decode('utf-8', 'replace')

def status(url, follow=True):
    out = curl(url, head=True, follow=follow).split()
    return (out[0], out[1]) if len(out) >= 2 else ('000', '')

def lum(h):
    h = h.lstrip('#'); r, g, b = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    f = lambda c: c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la+0.05)/(lb+0.05)

R = collections.OrderedDict()   # critère -> (état, détail) ; état : OK / KO / PARTIEL / INFO
def put(k, ok, detail=''): R[k] = ('OK' if ok is True else 'KO' if ok is False else ok, detail)

# ── fichiers racine ──
robots = curl(BASE + '/robots.txt'); sm = curl(BASE + '/sitemap.xml'); llms = curl(BASE + '/llms.txt')
if '<sitemapindex' in sm:
    subs = re.findall(r'<loc>([^<]+)</loc>', sm); sm = ''.join(curl(u) for u in subs)
urls = [re.sub(r'^https?://[^/]+', BASE, u) for u in re.findall(r'<loc>([^<]+)</loc>', sm)]   # permet de contrôler une préproduction avec le sitemap de production
pages = {}
for u in urls[:80]:
    h = curl(u)
    if '<html' in h.lower(): pages[u] = h
print(f"\n══════ {BASE} — {len(pages)} pages lues (sitemap : {len(urls)} URL) ══════")
if not pages: sys.exit('  ✗ Site injoignable ou sitemap vide : aucune page lue.')

def vis(h): return re.sub(r'<(script|style|svg)[\s\S]*?</\1>', ' ', h)
def text(h): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', vis(h)))

# ── 1. Technique & indexation ──
h1bad = [u for u, h in pages.items() if len(re.findall(r'<h1[\s>]', vis(h))) != 1]
put('Une seule balise H1 par page', not h1bad, f"{len(h1bad)} page(s) fautive(s) : " + ', '.join(urlparse(u).path for u in h1bad[:4]) if h1bad else '')
titles = {u: (re.search(r'<title>([\s\S]*?)</title>', h) or [None, ''])[1].strip() for u, h in pages.items()}
dup = [t for t, n in collections.Counter(titles.values()).items() if n > 1]
longt = [u for u, t in titles.items() if len(re.sub(r'&#39;|&amp;', 'x', t)) > 60]
put('Title unique, < 60 caractères', (not dup and not longt) or ('PARTIEL' if not dup else False), f"{len(dup)} doublon(s), {len(longt)} trop long(s) : " + ', '.join(urlparse(u).path for u in longt[:4]))
descs = {u: (re.search(r'name="description" content="([^"]*)"', h) or [None, ''])[1] for u, h in pages.items()}
dd = [d for d, n in collections.Counter(descs.values()).items() if n > 1]
badd = [u for u, d in descs.items() if not (120 <= len(d) <= 160)]
put('Meta description unique, 120-160', (not dd and not badd) or ('PARTIEL' if not dd and len(badd) <= len(pages)//3 else False), f"{len(dd)} doublon(s), {len(badd)} hors longueur : " + ', '.join(f"{urlparse(u).path}({len(descs[u])})" for u in badd[:5]))
jumps = []
for u, h in pages.items():
    lv = [int(x) for x in re.findall(r'<h([1-6])[\s>]', vis(h))]
    if any(b-a > 1 for a, b in zip(lv, lv[1:])): jumps.append(u)
put('Hiérarchie Hn sans saut', not jumps, f"{len(jumps)} page(s) : " + ', '.join(urlparse(u).path for u in jumps[:5]) if jumps else '')
badurl = [u for u in pages if re.search(r'[A-Z_?=]|%', urlparse(u).path)]
put('URL propres', not badurl, ', '.join(badurl[:3]))
nocan = [u for u, h in pages.items() if 'rel="canonical"' not in h]
wrongcan = [u for u, h in pages.items() if (m := re.search(r'rel="canonical" href="([^"]*)"', h)) and m[1].rstrip('/') != u.rstrip('/')]
put('Canonical sur chaque page', not nocan and not wrongcan, f"{len(nocan)} absente(s), {len(wrongcan)} incohérente(s) " + ', '.join(urlparse(u).path for u in (nocan+wrongcan)[:4]))
put('robots.txt présent et correct', 'user-agent' in robots.lower() and not re.search(r'Disallow:\s*/\s*$', robots, re.M))
put('sitemap.xml à jour', len(urls) > 0, f"{len(urls)} URL, lastmod : {'oui' if '<lastmod>' in sm else 'NON'}")
noidx = [u for u, h in pages.items() if re.search(r'name="robots"[^>]*noindex', h)]
put('Aucune page importante en noindex', not noidx, ', '.join(urlparse(u).path for u in noidx[:4]))
c_http, eff = status('http://' + HOST + '/')
put('HTTPS + redirection http→https', eff.startswith('https://') and c_http == '200', f"http:// aboutit à {eff} ({c_http})")
alt = ('www.' + HOST) if not HOST.startswith('www.') else HOST[4:]
c_alt, eff_alt = status('https://' + alt + '/')
put('Version unique du domaine (www / sans www)', urlparse(eff_alt).netloc == HOST, f"{alt} → {eff_alt or 'ne répond pas'} ({c_alt})")
ai = [b for b in ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'] if re.search(r'User-agent:\s*' + b + r'[\s\S]{0,200}?Disallow:\s*/\s*$', robots, re.M | re.I)]
put('Robots des IA autorisés', not ai, ('bloqués : ' + ', '.join(ai)) if ai else ('explicite' if 'GPTBot' in robots else 'par défaut (non nommés)'))
types = collections.Counter(); ldbad = 0
for h in pages.values():
    for m in re.findall(r'<script type="application/ld\+json"[^>]*>([\s\S]*?)</script>', h):
        try:
            j = json.loads(m)
            for n in (j.get('@graph', [j]) if isinstance(j, dict) else j):
                t = n.get('@type'); [types.update([x]) for x in (t if isinstance(t, list) else [t])]
        except Exception: ldbad += 1
put('Schema Organization / LocalBusiness', bool(types.get('Organization') or types.get('LocalBusiness')))
put('Schema FAQPage', bool(types.get('FAQPage')), f"{types.get('FAQPage', 0)} page(s)")
put('Schema Service / produit', bool(types.get('Service') or types.get('SoftwareApplication') or types.get('Product')), ', '.join(f"{k}×{v}" for k, v in types.items() if k in ('Service', 'SoftwareApplication', 'Product', 'Offer')))
put('JSON-LD valide (syntaxe)', ldbad == 0, f"{ldbad} bloc(s) illisible(s)")

# ── 2. Contenu ──
imgs = [(u, t) for u, h in pages.items() for t in re.findall(r'<img[^>]*>', vis(h))]
noalt = [(u, t) for u, t in imgs if not re.search(r'alt="[^"]+"', t) and 'aria-hidden' not in t and 'alt=""' not in t]
put('Alt sur toutes les images', not noalt, f"{len(imgs)} image(s), {len(noalt)} sans alt")
srcs = set(re.findall(r'src="([^"]+\.(?:png|jpe?g|webp|avif|gif))"', ''.join(pages.values()), re.I))
vague = [s for s in srcs if re.search(r'(^|/)(img|image|photo|og|pic|dsc|screenshot|capture)[-_]?\d*\.\w+$', s, re.I)]
put("Noms de fichiers d'images descriptifs", not vague, ', '.join(v.split('/')[-1] for v in list(vague)[:5]))
thin = [(u, len(text(h).split())) for u, h in pages.items() if len(text(h).split()) < 300 and not re.search(r'mentions|confidential|cgv|cgu|404|merci', u)]
put('Contenu suffisant (≥ 300 mots)', not thin, ', '.join(f"{urlparse(u).path}({n})" for u, n in thin[:6]))
anc = re.findall(r'<a[^>]*>\s*(cliquez ici|ici|en savoir plus|lire la suite|click here)\s*</a>', ''.join(vis(h) for h in pages.values()), re.I)
put('Ancres de liens descriptives', not anc, f"{len(anc)} ancre(s) vague(s)")
# liens internes
links = set()
for u, h in pages.items():
    for l in re.findall(r'href="([^"#]+)', re.sub(r'<script[\s\S]*?</script>', '', h)):
        if l.startswith(('mailto:', 'tel:', 'javascript:', 'data:')): continue
        full = urljoin(u, l)
        if urlparse(full).netloc == HOST and not re.search(r'\.(css|js|png|jpe?g|svg|webp|ico|xml|txt|pdf|woff2?)$', full): links.add(full.split('?')[0])
broken = []
for l in sorted(links)[:160]:
    c, _ = status(l)
    if c not in ('200', '301', '302'): broken.append(f"{urlparse(l).path}({c})")
put('Aucun lien interne cassé', not broken, f"{len(links)} lien(s) testés ; cassés : " + ', '.join(broken[:8]) if broken else f"{len(links)} lien(s) testés")
orphan = [u for u in pages if u.rstrip('/') not in {l.rstrip('/') for l in links} and u.rstrip('/') != BASE]
put('Maillage : aucune page orpheline', not orphan, ', '.join(urlparse(u).path for u in orphan[:6]))

# ── 3. GEO ──
arts = {u: h for u, h in pages.items() if re.search(r'/guides?/[^/]+|/blog/[^/]+|/articles?/[^/]+', urlparse(u).path)}
put('Pages éditoriales (guides) présentes', bool(arts) or 'INFO', f"{len(arts)} guide(s)")
if arts:
    qh = [u for u, h in arts.items() if len(re.findall(r'<h2[^>]*>[^<]*\?', vis(h))) >= 2]
    put('Sections en question → réponse', len(qh) == len(arts) or ('PARTIEL' if qh else False), f"{len(qh)}/{len(arts)} guides")
    dated = [u for u, h in arts.items() if '<time' in h or re.search(r'mis à jour|publié le', text(h), re.I)]
    put('Date de mise à jour visible', len(dated) == len(arts) or ('PARTIEL' if dated else False), f"{len(dated)}/{len(arts)} guides")
    auth = [u for u, h in arts.items() if re.search(r'"author":\{"@type":"Person"', h.replace(' ', ''))]
    put('Auteur identifiable', len(auth) == len(arts) or ('PARTIEL' if auth else False), f"{len(auth)}/{len(arts)} guides (personne nommée)")
    src = [u for u, h in arts.items() if re.search(r'legifrance|service-public|insee|ademe|Sources?\s*:|Textes de référence|art\.\s*[LR]\s?\d', text(h) + h, re.I)]
    put('Données sourcées', len(src) == len(arts) or ('PARTIEL' if src else False), f"{len(src)}/{len(arts)} guides citent une source")
    faqp = [u for u, h in arts.items() if 'FAQPage' in h]
    put('FAQ balisée sur les pages clés', len(faqp) == len(arts) or ('PARTIEL' if faqp else False), f"{len(faqp)}/{len(arts)} guides")
allt = ' '.join(text(h) for h in pages.values())
stats = re.findall(r'[^.]{0,60}\b\d{1,3}(?:[,.]\d)? ?%[^.]{0,40}', allt)
put('Statistiques : à contrôler à la main', 'INFO', f"{len(stats)} phrase(s) avec un pourcentage, ex. : « {stats[0].strip()[:110]} »" if stats else 'aucun pourcentage')
put('Aucune ancienne marque (e-POLAZ)', not re.search(r'e-?polaz', ''.join(pages.values()), re.I))
put('llms.txt présent', llms.strip().startswith('#'), f"{len(llms)} octets")
missing_llms = [urlparse(u).path for u in pages if urlparse(u).path.strip('/') and urlparse(u).path not in llms and not re.search(r'mentions|confidential|cgv|cgu', u)]
put('llms.txt couvre toutes les pages', not missing_llms, f"{len(missing_llms)} absente(s) : " + ', '.join(missing_llms[:5]))

# ── 5. Performance & mobile ──
home = pages.get(BASE + '/', next(iter(pages.values())))
sz = curl(BASE + '/', head=True).split()
put("Poids de l'accueil", int(sz[2]) < 400_000 if len(sz) > 2 else 'INFO', f"{int(sz[2])//1024} Ko de HTML, {sz[3]} s (depuis le serveur d'audit)" if len(sz) > 3 else '')
ext = set(re.findall(r'<script[^>]*src="(https?://[^"]+)"', home))
put('Pas de scripts tiers lourds', len(ext) <= 2, f"{len(ext)} script(s) externe(s) : " + ', '.join(urlparse(e).netloc for e in ext))
put('Viewport mobile déclaré', 'name="viewport"' in home)
fav = re.search(r'rel="(?:shortcut )?icon"[^>]*href="([^"]+)"', home)
put('Favicon présent', bool(fav) and status(urljoin(BASE + '/', fav[1]))[0] == '200' if fav else False)
noog = [u for u, h in pages.items() if 'og:image' not in h]
ogu = re.search(r'property="og:image" content="([^"]+)"', home)
ogok = status(ogu[1])[0] == '200' if ogu else False
put('Aperçu de partage (Open Graph)', not noog and ogok, f"{len(noog)} page(s) sans image ; image d'accueil {'accessible' if ogok else 'ABSENTE ou inaccessible'}")
# contrastes déclarés dans la feuille de style
css = ' '.join(re.findall(r'<style[^>]*>([\s\S]*?)</style>', home))
for l in re.findall(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"', home):
    if urlparse(urljoin(BASE, l)).netloc == HOST: css += curl(urljoin(BASE + '/', l))
root = re.search(r':root\s*\{([^}]*)\}', css)
low = []
if root:
    v = dict(re.findall(r'--([\w-]+)\s*:\s*(#[0-9A-Fa-f]{6})\b', root[1]))
    bgs = {k: x for k, x in v.items() if re.fullmatch(r'bg\d?|paper|fond|white|blanc|surface|cream|creme', k)} or {'blanc': '#FFFFFF'}
    for k, x in v.items():
        if k in bgs: continue
        best = max(cr(x, b) for b in bgs.values())
        if 1.6 < best < 4.5 and re.search(r'mute|soft|gris|grey|gray|ink|text|fg|sub|faint|dim|ok|warn|ko|err|success|danger', k): low.append(f"--{k} {x} ({best:.1f})")
put('Contrastes des couleurs de texte', not low, ' ; '.join(low[:6]) if low else 'variables de texte ≥ 4,5 (ou non détectables)')

# ── 6. Avant mise en ligne ──
forms = len(re.findall(r'<form', ''.join(pages.values())))
ep = re.findall(r'(https://[a-z0-9]+\.supabase\.co[^"\'\s]*|formspree\.io[^"\'\s]*|https://[^"\'\s]*brevo[^"\'\s]*)', ''.join(pages.values()))
put('Formulaire branché à un service', bool(ep) if forms else 'INFO', f"{forms} formulaire(s) ; point d'envoi : {urlparse(ep[0]).netloc if ep and ep[0].startswith('http') else (ep[0][:40] if ep else 'AUCUN détecté')}")
nocta = [u for u, h in pages.items() if not re.search(r'class="[^"]*\b(btn|cta|button)\b', h) and not re.search(r'mentions|confidential', u)]
put("Appel à l'action sur chaque page", not nocta, ', '.join(urlparse(u).path for u in nocta[:5]))
c_ml = [u for u in list(pages) + list(links) if re.search(r'mentions', u)]; c_pc = [u for u in list(pages) + list(links) if re.search(r'confidential|donnees|rgpd', u)]
put('Mentions légales', bool(c_ml)); put('Politique de confidentialité', bool(c_pc))
tr = re.findall(r'googletagmanager|google-analytics|gtag\(|plausible|matomo|umami|clarity\.ms|fbq\(|connect\.facebook', ''.join(pages.values()))
put('Suivi du trafic installé', bool(tr), ', '.join(sorted(set(tr))) or 'aucun traceur détecté')
cook = re.search(r'cookie', ''.join(vis(h) for h in pages.values()), re.I)
put('Bandeau cookies si traceurs', (bool(cook) if tr and re.search(r'gtag|google|facebook|fbq|clarity', ' '.join(tr)) else 'INFO'), 'requis seulement avec des traceurs à consentement')
gsc = 'google-site-verification' in home
put('Search Console (balise de vérification)', gsc or 'INFO', 'balise présente' if gsc else 'pas de balise — la vérification par DNS reste possible, invisible depuis ici')
c404, _ = status(BASE + '/cette-page-nexiste-pas-audit/')
p404 = curl(BASE + '/cette-page-nexiste-pas-audit/')
put('Page 404 personnalisée', c404 == '404' and ('href' in p404 and len(p404) > 1500 and 'There isn\'t a GitHub Pages site' not in p404 and 'File not found' not in p404[:400]), f"code {c404}, {len(p404)} octets")
put('Aucun texte de test', not re.search(r'lorem ipsum|TODO|XXX|à compléter|\[à ', allt, re.I))

# ── choix assumés : critères écartés volontairement (un par ligne dans scripts/veille-choix.txt) ──
try:
    for line in open('scripts/veille-choix.txt', encoding='utf-8'):
        k = line.split('#')[0].strip()
        if k in R and R[k][0] in ('KO', 'PARTIEL'): R[k] = ('INFO', 'écarté par choix — ' + R[k][1])
except FileNotFoundError: pass

# ── restitution ──
tot = collections.Counter(s for s, _ in R.values())
for k, (s, d) in R.items():
    mark = {'OK': '✓', 'KO': '✗', 'PARTIEL': '~', 'INFO': '·'}[s]
    if s != 'OK' or d: print(f"  {mark} {k}" + (f" — {d}" if d else ''))
    else: print(f"  {mark} {k}")
print(f"\n  BILAN automatisable : {tot['OK']} validés · {tot['PARTIEL']} partiels · {tot['KO']} non validés · {tot['INFO']} à voir à la main")
