import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const BANNED_TAGS = new Set([
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'table',
  'details',
  'dialog',
  'label',
  'form',
]);
const BANNED_ATTRS = ['class', 'className', 'style', 'title'];
const COLOR = /['"`]#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?['"`]|rgba?\(|hsla?\(/;

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

function openingTags(source) {
  const tags = [];
  const pattern = /<([A-Za-z][\w.-]*)(?=[\s/>])/g;
  for (let match; (match = pattern.exec(source));) {
    let depth = 0;
    let quote = '';
    let i = pattern.lastIndex;
    for (; i < source.length; i++) {
      const ch = source[i];
      if (quote) {
        if (ch === quote && source[i - 1] !== '\\') quote = '';
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') quote = ch;
      else if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) break;
    }
    tags.push({ tag: match[1], attrs: source.slice(pattern.lastIndex, i), at: match.index });
    pattern.lastIndex = i;
  }
  return tags;
}

function line(source, at) {
  return source.slice(0, at).split('\n').length;
}

const problems = [];
const pageFiles = [
  ...files(join(root, 'pages')),
  ...files(join(root, 'modules')),
  join(root, 'App.tsx'),
];
for (const file of pageFiles) {
  const source = readFileSync(file, 'utf8');
  const name = relative(root, file);
  if (/from ['"][./]*ui\/(kit|Chart)['"]/.test(source))
    problems.push(`${name}: imports a retired ui module; import from ui instead`);
  for (const match of source.matchAll(
    /<Row key=\{[^>]*>\s*(?:\{[^}]*\?\s*\()?\s*<(IconBox|DomainIcon|Flag|Swatch|Avatar|StatusDot)\b/g,
  ))
    problems.push(
      `${name}:${line(source, match.index)} a list row built from Row; use List and ListItem so its marks and text share one column`,
    );
  for (const { tag, attrs, at } of openingTags(source)) {
    if (BANNED_TAGS.has(tag))
      problems.push(`${name}:${line(source, at)} <${tag}> is a raw control; use the ui component`);
    for (const attr of BANNED_ATTRS)
      if ((attr !== 'title' || /^[a-z]/.test(tag)) && new RegExp(`(^|\\s)${attr}=`).test(attrs))
        problems.push(
          `${name}:${line(source, at)} ${attr}= on <${tag}>; styling and tooltips belong to ui components`,
        );
  }
}
for (const file of files(root)) {
  const source = readFileSync(file, 'utf8');
  const name = relative(root, file);
  source.split('\n').forEach((text, index) => {
    if (COLOR.test(text))
      problems.push(`${name}:${index + 1} literal color; use a token from ui/tokens.css`);
  });
}

if (problems.length) {
  console.error(`check-ui: ${problems.length} problem(s)\n${problems.join('\n')}`);
  process.exitCode = 1;
} else console.log('check-ui: ok');
