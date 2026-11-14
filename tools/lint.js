// Errors-only lint. The browser game runs as inline <script> blocks in the built index.html, where app.js, its app/
// parts and every feature module share scope, so linting source files one by one would report every cross-file name
// as undefined. This lints each built script block as the browser runs it and reports problems at their source file
// and line. Node scripts (tools/, tests/, desktop/) are linted file by file.
//
//   npm run lint            build, then lint everything
//   node tools/lint.js      lint the existing index.html
const fs = require('fs');
const path = require('path');
const { Linter } = require('eslint');
const globals = require('globals');

const root = path.join(__dirname, '..');
// Errors only: rules that catch real mistakes, not style.
const RULES = {
  'no-undef': 'error', 'no-dupe-keys': 'error', 'no-dupe-args': 'error', 'no-unreachable': 'error',
  'no-const-assign': 'error', 'no-self-assign': 'error', 'valid-typeof': 'error', 'use-isnan': 'error',
  'no-unsafe-negation': 'error', 'getter-return': 'error', 'no-dupe-else-if': 'error', 'no-duplicate-case': 'error',
  'no-obj-calls': 'error', 'no-invalid-regexp': 'error', 'no-unsafe-finally': 'error', 'no-loss-of-precision': 'error',
};
const linter = new Linter({ configType: 'flat' });
const config = (globalsSet, sourceType = 'script') => [{
  languageOptions: { ecmaVersion: 'latest', sourceType, globals: globalsSet },
  rules: RULES,
}];

// Every .js source the build can inline, so a problem in a built block can be traced to its file.
function sourceFiles() {
  const listJs = dir => fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.js')).map(f => dir === '.' ? f : `${dir}/${f}`);
  return [...listJs('.'), ...listJs('app'), ...listJs('portraits')].filter(f => !/^(forge\.config|sw)\.js$/.test(f));
}
function locate(block, sources) {
  const spans = [];
  for (const file of sources) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    // app.js holds the @app-parts marker, so its head and tail are found separately (lines count from each piece).
    const pieces = file === 'app.js' ? text.split(/^\/\*@app-parts [^\n]*\n/m) : [text];
    let lineBase = 0;
    for (const piece of pieces) {
      if (piece.length >= 40) {
        const at = block.indexOf(piece);
        if (at >= 0) spans.push({ file, start: at, end: at + piece.length, lineBase });
      }
      lineBase += piece.split('\n').length;
    }
  }
  // A part (app/NN-*.js) sits inside the assembled core; prefer the smallest span that contains a position.
  return pos => spans.filter(s => pos >= s.start && pos < s.end).sort((a, b) => (a.end - a.start) - (b.end - b.start))[0] || null;
}
const lineStarts = text => { const out = [0]; for (let i = 0; i < text.length; i++) if (text[i] === '\n') out.push(i + 1); return out; };
const offsetOf = (starts, line, column) => starts[line - 1] + column - 1;

// Names modules publish at runtime (globalThis.X = …, window.X = …) and read elsewhere, usually behind a typeof
// guard. Collected from source so a new bridge needs no list edit.
function publishedGlobals(sources) {
  const out = {};
  for (const file of sources) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    for (const m of text.matchAll(/\b(?:globalThis|window|self|root)\.([A-Za-z_$][\w$]*)\s*(?:=(?!=)|\?\?=)/g)) out[m[1]] = 'writable';
  }
  return out;
}
function lintBrowser() {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const sources = sourceFiles(), problems = [];
  // `module`/`require` appear only behind `typeof module` guards in modules that also load under Node tests.
  const browserGlobals = { ...globals.browser, ...globals.es2024, ...publishedGlobals(sources), module: 'readonly', require: 'readonly', process: 'readonly' };
  for (const block of blocks) {
    const where = locate(block, sources), starts = lineStarts(block);
    for (const m of linter.verify(block, config(browserGlobals))) {
      const pos = offsetOf(starts, m.line, m.column), span = where(pos);
      let file = 'index.html (inline)', line = m.line;
      if (span) {
        file = span.file;
        line = (span.lineBase || 0) + block.slice(span.start, pos).split('\n').length;
      }
      problems.push({ file, line, column: m.column, rule: m.ruleId || 'parse', message: m.message });
    }
  }
  return problems;
}
function lintNode() {
  const nodeGlobals = { ...globals.node, ...globals.es2024 };
  const files = ['tools', 'tests', 'tests/helpers', 'desktop'].flatMap(dir => {
    const full = path.join(root, dir);
    return fs.existsSync(full) ? fs.readdirSync(full).filter(f => f.endsWith('.js')).map(f => `${dir}/${f}`) : [];
  });
  const problems = [];
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    // Browser callbacks in Playwright tests (page.evaluate) run in the page, so browser names are allowed there too.
    const g = file === 'tools/sw-template.js' ? { ...globals.serviceworker, ...globals.es2024, __ASSETS__: 'readonly' }
      : file.startsWith('tests/') || file.startsWith('tools/') ? { ...nodeGlobals, ...globals.browser } : nodeGlobals;
    for (const m of linter.verify(text, config(g, 'commonjs'))) problems.push({ file, line: m.line, column: m.column, rule: m.ruleId || 'parse', message: m.message });
  }
  return problems;
}

if (require.main === module) {
  const problems = [...lintBrowser(), ...lintNode()];
  for (const p of problems) console.log(`${p.file}:${p.line}:${p.column}  ${p.rule}  ${p.message}`);
  console.log(problems.length ? `\n${problems.length} lint error(s)` : 'lint: no errors');
  process.exit(problems.length ? 1 : 0);
}
module.exports = { lintBrowser, lintNode, RULES };
