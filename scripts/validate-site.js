const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ignoredDirectories = new Set(['.git', '.vercel', 'node_modules']);
const htmlFiles = [];
const missingAssets = [];

function collectHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) collectHtml(path.join(directory, entry.name));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlFiles.push(path.join(directory, entry.name));
    }
  }
}

function checkAsset(reference, htmlFile) {
  if (!reference || /^(?:[a-z]+:|#|\/\/)/i.test(reference)) return;

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(reference, `https://site.invalid/${path.relative(root, htmlFile).replace(/\\/g, '/')}`).pathname);
  } catch {
    missingAssets.push(`${path.relative(root, htmlFile)}: invalid asset URL "${reference}"`);
    return;
  }

  const assetPath = path.resolve(root, `.${pathname}`);
  if (!assetPath.startsWith(`${root}${path.sep}`) && assetPath !== root) {
    missingAssets.push(`${path.relative(root, htmlFile)}: asset escapes project root "${reference}"`);
  } else if (!fs.existsSync(assetPath)) {
    missingAssets.push(`${path.relative(root, htmlFile)}: missing "${reference}"`);
  }
}

collectHtml(root);
htmlFiles.sort();

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  for (const match of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    checkAsset(match[1], htmlFile);
  }
  for (const match of html.matchAll(/<link\b(?=[^>]*\brel\s*=\s*["'][^"']*\bstylesheet\b[^"']*["'])[^>]*>/gi)) {
    const href = match[0].match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (href) checkAsset(href[1], htmlFile);
  }
}

const serviceWorkerPath = path.join(root, 'sw.js');
if (fs.existsSync(serviceWorkerPath)) {
  const serviceWorker = fs.readFileSync(serviceWorkerPath, 'utf8');
  const cacheList = serviceWorker.match(/const\s+urlsToCache\s*=\s*\[([\s\S]*?)\];/);
  if (!cacheList) {
    missingAssets.push('sw.js: precache asset list was not found');
  } else {
    for (const match of cacheList[1].matchAll(/['"]([^'"]+)['"]/g)) {
      checkAsset(match[1], serviceWorkerPath);
    }
  }
}

if (missingAssets.length) {
  console.error(`Static site validation found ${missingAssets.length} issue(s):`);
  for (const issue of missingAssets) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log(`Static asset validation passed for ${htmlFiles.length} HTML pages.`);
}
