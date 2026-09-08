#!/usr/bin/env node
// Publishes the built game to GitHub Pages.
//
//   node tools/publish.js                  -> production, served at /
//   node tools/publish.js --preview v094   -> preview, served at /preview/v094/
//   node tools/publish.js --verify         -> verify a clean, reproducible release artifact
//   node tools/publish.js --list           -> show what is currently published
//   node tools/publish.js --remove v094    -> delete a preview
//
// Production and previews live on the same gh-pages branch, so one Pages site
// serves both. The preview index is regenerated from whatever folders exist,
// so it can never drift from reality.
//
// The site is served from this repository's gh-pages branch, so publishing
// uses a worktree of that branch rather than a checkout of another repo.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { requirePushedSourceCommit } = require('./release-guard');

const ROOT = path.join(__dirname, '..');
const BRANCH = 'gh-pages';
const PAGES = process.env.PAGES_WORKTREE || path.join(ROOT, '.pages');
const SITE = 'https://markjrogers92.github.io/Football';

const git = (...args) =>
  execFileSync('git', ['-C', PAGES, ...args], { encoding: 'utf8' }).trim();
const sourceGit = (...args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' }).trim();
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function usage(msg) {
  if (msg) console.error(`\n${msg}`);
  console.error(`
Usage:
  node tools/publish.js                 publish to production (/)
  node tools/publish.js --preview NAME  publish to /preview/NAME/
  node tools/publish.js --verify        verify release source and artifact
  node tools/publish.js --list          list what is published
  node tools/publish.js --remove NAME   delete a preview
`);
  process.exit(msg ? 1 : 0);
}

// A preview name becomes a URL path segment, so keep it boring on purpose.
function validName(name) {
  if (!name) usage('A preview name is required.');
  if (!/^[a-z0-9][a-z0-9._-]{0,39}$/i.test(name))
    usage(`Invalid preview name "${name}". Use letters, digits, dot, dash or underscore (max 40).`);
  return name;
}

function ensureCheckout() {
  // An explicit refspec: a shallow clone updates FETCH_HEAD but would not
  // create the remote-tracking ref the worktree needs.
  execFileSync('git', ['-C', ROOT, 'fetch', 'origin',
    `+refs/heads/${BRANCH}:refs/remotes/origin/${BRANCH}`], { encoding: 'utf8' });
  if (!fs.existsSync(path.join(PAGES, '.git'))) {
    // Actions checks out a detached source ref and does not create a local
    // gh-pages branch. Create or reset it from the fetched deployment ref so
    // the same publisher works both locally and in the manual workflow.
    execFileSync('git', ['-C', ROOT, 'worktree', 'add', '--force', '-B', BRANCH,
      PAGES, `refs/remotes/origin/${BRANCH}`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  }
  const dirty = git('status', '--porcelain');
  if (dirty) usage(`${PAGES} has uncommitted changes:\n${dirty}\nCommit or stash them first.`);
  git('checkout', '-B', BRANCH, `refs/remotes/origin/${BRANCH}`);
}

function listPreviews() {
  const dir = path.join(PAGES, 'preview');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'index.html')))
    .map(d => d.name)
    .sort();
}

function titleOf(file) {
  try {
    const head = fs.readFileSync(file, 'utf8').slice(0, 4096);
    return (head.match(/<title>([^<]*)<\/title>/) || [, 'Dynasty Lab'])[1];
  } catch { return 'Dynasty Lab'; }
}

function validateSourceArtifact() {
  const dirty = sourceGit('status', '--porcelain', '--untracked-files=all');
  if (dirty) {
    usage(
      `Refusing to publish from a dirty source tree:\n${dirty}\n` +
      'Commit or stash every source change before publishing.'
    );
  }

  const built = path.join(ROOT, 'index.html');
  if (!fs.existsSync(built)) usage('No validated index.html exists. Run npm run build and commit it first.');
  const validated = fs.readFileSync(built);
  console.log('verifying build...');
  console.log(run('node', [path.join(ROOT, 'tools', 'build.js')], ROOT).trim());
  const rebuilt = fs.readFileSync(built);
  if (!validated.equals(rebuilt)) {
    usage(
      'Refusing to publish because a fresh build differs from the committed index.html.\n' +
      'Review the generated diff, run validation, and commit the artifact first.'
    );
  }
}

function validatePublishCandidate() {
  const dirty = sourceGit('status', '--porcelain', '--untracked-files=all');
  if (dirty) {
    usage(
      `Refusing to publish from a dirty source tree:\n${dirty}\n` +
      'Commit or stash every source change before publishing.'
    );
  }
  try {
    const branches = requirePushedSourceCommit(ROOT);
    console.log(`source commit is pushed on ${branches.join(', ')}`);
  } catch (err) {
    usage(`Refusing to publish: ${err.message}`);
  }
  console.log('running full release validation...');
  execFileSync('npm', ['run', 'validate:full'], { cwd: ROOT, stdio: 'inherit' });
}

// Regenerated on every publish so the list always matches the folders on disk.
function writePreviewIndex() {
  const names = listPreviews();
  const dir = path.join(PAGES, 'preview');
  if (!names.length) {
    if (fs.existsSync(dir)) fs.rmSync(path.join(dir, 'index.html'), { force: true });
    return names;
  }
  const rows = names.map(n => {
    const t = titleOf(path.join(dir, n, 'index.html'));
    return `    <li><a href="./${n}/">${n}</a> <span>${t}</span></li>`;
  }).join('\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dynasty Lab previews</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;background:#0e1116;color:#edf1f7;
       font:15px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
       padding:40px 24px;max-width:640px;margin-inline:auto}
  h1{font-size:20px;margin:0 0 6px}
  p{color:#96a3b7;margin:0 0 24px}
  ul{list-style:none;padding:0;margin:0;border:1px solid #2a3444;border-radius:12px;overflow:hidden}
  li{display:flex;justify-content:space-between;gap:16px;align-items:baseline;
     padding:13px 15px;border-bottom:1px solid #2a3444;background:#151a22}
  li:last-child{border-bottom:0}
  a{color:#8fb1ff;text-decoration:none;font-weight:600}
  a:hover,a:focus{text-decoration:underline}
  span{color:#96a3b7;font-size:13px}
  .prod{display:inline-block;margin-top:24px;color:#77d6a3}
</style></head><body>
  <h1>Dynasty Lab previews</h1>
  <p>Unreleased builds. Each runs from its own save storage scope.</p>
  <ul>
${rows}
  </ul>
  <a class="prod" href="../">← Production build</a>
</body></html>`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return names;
}

function publish({ preview, remove }) {
  if (!remove) validatePublishCandidate();
  ensureCheckout();

  let target, label;
  if (remove) {
    const dir = path.join(PAGES, 'preview', remove);
    if (!fs.existsSync(dir)) usage(`No preview named "${remove}".`);
    fs.rmSync(dir, { recursive: true, force: true });
    label = `remove preview ${remove}`;
  } else {
    const built = path.join(ROOT, 'index.html');
    target = preview ? path.join(PAGES, 'preview', preview) : PAGES;
    fs.mkdirSync(target, { recursive: true });
    fs.copyFileSync(built, path.join(target, 'index.html'));
    // index.html is self-contained except for CSS url() references outside the concatenated
    // bundle (e.g. the title screen background), which resolve relative to wherever the page
    // itself is served from — so any such asset has to be copied alongside every target, not
    // just committed once at the repo root.
    const assetsDir = path.join(ROOT, 'assets');
    if (fs.existsSync(assetsDir))
      fs.cpSync(assetsDir, path.join(target, 'assets'), { recursive: true });
    label = preview ? `preview ${preview}` : 'production';
  }

  writePreviewIndex();
  git('add', '-A');
  if (!git('status', '--porcelain')) {
    console.log('\nNothing changed — the published build already matches.');
    return;
  }
  const version = fs.readFileSync(path.join(ROOT, 'VERSION.txt'), 'utf8').trim();

  // Two agents (or two sessions) can build this same version from different source and both
  // reach for `node tools/publish.js` — that is exactly how v0.9.36 got silently overwritten in
  // production once already this project. If this version number already has a production
  // publish commit AND the content about to be pushed actually differs, refuse rather than
  // clobber it: someone has to look at what is different before one side's work disappears.
  if (!remove && !preview) {
    const prior = git('log', '--oneline', '--grep', `^Publish production: ${version}$`);
    if (prior) {
      usage(
        `Refusing to publish production: ${version} — that version was already published ` +
        `(${prior.split('\n')[0]}), and the build about to go out differs from what is live.\n` +
        `Someone else likely shipped this version number from different source. Reconcile ` +
        `first (see CONTINUATION.md), or bump VERSION.txt to a version never published before.`
      );
    }
  }

  git('-c', 'user.email=MarkJRogers92@gmail.com', '-c', 'user.name=Mark J Rogers',
      'commit', '-q', '-m', `Publish ${label}: ${version}`);
  git('push', 'origin', BRANCH);

  const url = remove ? `${SITE}/preview/` : preview ? `${SITE}/preview/${preview}/` : `${SITE}/`;
  console.log(`\npublished ${label}`);
  console.log(`  ${url}`);
  console.log('  Pages usually serves the new build within a minute.');
}

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) usage();

if (argv.includes('--verify')) {
  if (argv.length !== 1) usage('--verify cannot be combined with another argument.');
  validateSourceArtifact();
  console.log('release source and artifact verified');
} else if (argv.includes('--list')) {
  ensureCheckout();
  const names = listPreviews();
  const prod = path.join(PAGES, 'index.html');
  console.log(`production  ${fs.existsSync(prod) ? titleOf(prod) : '(none)'}  ${SITE}/`);
  if (!names.length) console.log('previews    (none)');
  for (const n of names)
    console.log(`preview     ${titleOf(path.join(PAGES, 'preview', n, 'index.html'))}  ${SITE}/preview/${n}/`);
} else if (argv.includes('--remove')) {
  publish({ remove: validName(argv[argv.indexOf('--remove') + 1]) });
} else if (argv.includes('--preview')) {
  publish({ preview: validName(argv[argv.indexOf('--preview') + 1]) });
} else if (argv.length) {
  usage(`Unrecognised argument: ${argv[0]}`);
} else {
  publish({});
}
