import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const libRoot = path.resolve(process.cwd(), 'src/lib');

function resolveLib(specifier) {
  const rel = specifier === '$lib' ? '' : specifier.replace('$lib/', '');
  const basePath = path.join(libRoot, rel);
  const candidates = [
    basePath,
    `${basePath}.js`,
    `${basePath}.mjs`,
    `${basePath}.cjs`,
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.mjs'),
    path.join(basePath, 'index.cjs'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const stat = fs.statSync(candidate);
      if (stat.isFile()) {
        return pathToFileURL(candidate).href;
      }
    }
  }

  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '$lib' || specifier.startsWith('$lib/')) {
    const url = resolveLib(specifier);
    if (url) {
      return { url, shortCircuit: true };
    }
  }

  return nextResolve(specifier, context);
}
