#!/usr/bin/env node
/**
 * Next.js route groups: (marketing)/page and (dashboard)/page both map to `/`.
 * Fail the build early if that conflict reappears.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const marketingRoot = path.join(root, 'src/app/(marketing)/page.tsx');
const dashboardRoot = path.join(root, 'src/app/(dashboard)/page.tsx');
const appRoot = path.join(root, 'src/app/page.tsx');

const marketingExists = fs.existsSync(marketingRoot);
const dashboardExists = fs.existsSync(dashboardRoot);
const appExists = fs.existsSync(appRoot);

const roots = [
  marketingExists && '(marketing)/page.tsx',
  dashboardExists && '(dashboard)/page.tsx',
  appExists && 'app/page.tsx',
].filter(Boolean);

if (roots.length > 1) {
  console.error(
    `[route-check] Conflicto de ruta /: ${roots.join(' + ')}. ` +
      'Solo puede existir una page en la raíz. Marketing va en /empresa.',
  );
  process.exit(1);
}

console.log('[route-check] OK — sin conflicto de page en /');
