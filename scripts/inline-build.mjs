#!/usr/bin/env node
/**
 * Inline the Vite bundle into dist/index.html so the wallboard runs from a
 * double-clicked file: no server, no module-script CORS restriction.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const htmlPath = join(dist, 'index.html');
const assetsDir = join(dist, 'assets');

let html = await readFile(htmlPath, 'utf8');
const assets = await readdir(assetsDir);

const scriptFile = assets.find((name) => name.endsWith('.js'));
const styleFile = assets.find((name) => name.endsWith('.css'));
if (!scriptFile) {
  throw new Error('dist/assets contains no JavaScript bundle');
}

let script = await readFile(join(assetsDir, scriptFile), 'utf8');
if (/^\s*(import|export)\s/m.test(script)) {
  throw new Error('Bundle contains import/export statements; cannot inline as a classic script');
}
script = script.replace(/<\/script/gi, '<\\/script');

let style = '';
if (styleFile) {
  style = await readFile(join(assetsDir, styleFile), 'utf8');
}

html = html
  .replace(/<script\b[^>]*\bsrc="[^"]*"[^>]*>\s*<\/script>/gi, '')
  .replace(/<link\b[^>]*\brel="modulepreload"[^>]*>/gi, '')
  .replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/gi, '');

if (style) {
  html = html.replace('</head>', () => `<style>\n${style}\n</style>\n  </head>`);
}
html = html.replace('</body>', () => `<script>\n${script}\n</script>\n  </body>`);

if (/<script\b[^>]*\bsrc=/i.test(html)) {
  throw new Error('An external script tag survived inlining');
}

await writeFile(htmlPath, html, 'utf8');
console.log(`Inlined ${scriptFile}${styleFile ? ` and ${styleFile}` : ''} into dist/index.html`);
