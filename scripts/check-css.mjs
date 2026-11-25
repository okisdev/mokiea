import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry.name) ? [readFileSync(path, 'utf8')] : [];
  });
}

const css = readFileSync(join(root, 'ui.css'), 'utf8');
const code = sources(root).join('\n');
const classes = [...new Set(css.match(/\.ui-[a-z0-9-]+/g) ?? [])].map((name) => name.slice(1));
const unused = classes.filter((name) => {
  const literal = new RegExp(`(^|[^\\w-])${name}(?![\\w-])`);
  if (literal.test(code)) return false;
  const prefix = name.slice(0, name.lastIndexOf('-') + 1);
  return !prefix || !code.includes(prefix + '${');
});

if (unused.length) {
  console.error(`check-css: ${unused.length} unused class(es)\n${unused.sort().join('\n')}`);
  process.exitCode = 1;
} else console.log(`check-css: ok (${classes.length} classes)`);
