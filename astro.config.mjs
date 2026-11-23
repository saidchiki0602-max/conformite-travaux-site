import { defineConfig } from 'astro/config';
// PUBLIC_PREVIEW=1 : build « aperçu » en fichiers plats pour relecture hors ligne ; sinon dossiers propres (/guides/...).
// PUBLIC_SITE : le domaine. À changer ici et dans public/CNAME le jour d'un changement de nom.
const preview = process.env.PUBLIC_PREVIEW === '1';
export default defineConfig({
  site: process.env.PUBLIC_SITE || 'https://conformitetravaux.com',
  output: 'static',
  build: { inlineStylesheets: 'always', format: preview ? 'file' : 'directory' },
  compressHTML: true,
});
