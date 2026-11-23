// Aperçu : met les guides à plat (guides-x.html) pour que tous les liens relatifs fonctionnent hors serveur.
import fs from 'node:fs'; import path from 'node:path';
const dir = process.argv[2] || 'dist-preview'; const g = path.join(dir, 'guides');
if (fs.existsSync(g)) { for (const f of fs.readdirSync(g)) if (f.endsWith('.html')) fs.copyFileSync(path.join(g, f), path.join(dir, 'guides-' + f)); fs.rmSync(g, { recursive: true }); }
