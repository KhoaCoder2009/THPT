#!/usr/bin/env node

/**
 * React Bits Component Search Utility
 * Fast local lookup across all 218 React Bits components.
 *
 * Usage:
 *   node search.cjs --query <keyword>
 *   node search.cjs --category <text|animations|components|micro|backgrounds>
 *   node search.cjs --engine <motion|gsap|ogl|three|matter>
 *   node search.cjs --info <ComponentName>
 *   node search.cjs --list-categories
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'components.json');
if (!fs.existsSync(dataPath)) {
  console.error('Error: components.json not found at', dataPath);
  process.exit(1);
}

const components = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--query' || args[i] === '-q') options.query = (args[++i] || '').toLowerCase();
  else if (args[i] === '--category' || args[i] === '-c') options.category = (args[++i] || '').toLowerCase();
  else if (args[i] === '--engine' || args[i] === '-e') options.engine = (args[++i] || '').toLowerCase();
  else if (args[i] === '--info' || args[i] === '-i') options.info = (args[++i] || '');
  else if (args[i] === '--list-categories') options.listCats = true;
  else if (!options.query && !args[i].startsWith('-')) options.query = args[i].toLowerCase();
}

if (options.listCats) {
  const counts = {};
  components.forEach(c => {
    counts[c.category] = (counts[c.category] || 0) + 1;
  });
  console.log('\nReact Bits Categories & Counts:');
  console.log('---------------------------------');
  Object.entries(counts).forEach(([cat, count]) => {
    console.log(`- ${cat}: ${count} components`);
  });
  console.log(`\nTotal: ${components.length} components\n`);
  process.exit(0);
}

if (options.info) {
  const target = components.find(c => c.name.toLowerCase() === options.info.toLowerCase());
  if (!target) {
    console.error(`Component '${options.info}' not found in React Bits.`);
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`Component: ${target.name}`);
  console.log(`Category:  ${target.category}`);
  console.log(`Docs:      ${target.docsUrl}`);
  console.log(`Dependencies: ${target.dependencies.length > 0 ? target.dependencies.join(', ') : 'None'}`);
  console.log(`Description:\n  ${target.description}`);
  console.log(`\nInstallation Commands:`);
  console.log(`- shadcn (TS + TW): npx shadcn@latest add https://reactbits.dev/r/${target.name}-TS-TW`);
  console.log(`- shadcn (TS + CSS): npx shadcn@latest add https://reactbits.dev/r/${target.name}-TS-CSS`);
  console.log(`- shadcn (JS + TW): npx shadcn@latest add https://reactbits.dev/r/${target.name}-JS-TW`);
  console.log(`- jsrepo:           npx jsrepo@latest add https://reactbits.dev/r/${target.name}-TS-TW`);
  console.log(`========================================\n`);
  process.exit(0);
}

// Filtering
let results = components;

if (options.category) {
  const catFilter = options.category;
  results = results.filter(c => {
    const cLow = c.category.toLowerCase();
    if (catFilter === 'text' || catFilter === 'textanimations') return cLow === 'textanimations';
    return cLow.includes(catFilter);
  });
}

if (options.engine) {
  const eng = options.engine.toLowerCase();
  results = results.filter(c => {
    return c.dependencies.some(d => d.toLowerCase().includes(eng));
  });
}

if (options.query) {
  const q = options.query;
  results = results.filter(c => {
    return c.name.toLowerCase().includes(q) ||
           c.description.toLowerCase().includes(q) ||
           (c.tags || []).some(t => t.toLowerCase().includes(q));
  });
}

console.log(`\nFound ${results.length} matching component(s):\n`);
results.forEach(c => {
  const deps = c.dependencies.length > 0 ? ` (${c.dependencies.join(', ')})` : '';
  console.log(`- [${c.category}] ${c.name}${deps}`);
  console.log(`  ${c.description}`);
  console.log(`  CLI: npx shadcn@latest add https://reactbits.dev/r/${c.name}-TS-TW`);
  console.log('');
});
