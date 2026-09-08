const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { requirePushedSourceCommit } = require('../tools/release-guard');

const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

test('release guard accepts only commits reachable from a pushed source branch', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dynasty-release-guard-'));
  const remote = path.join(tmp, 'origin.git');
  const source = path.join(tmp, 'source');
  try {
    execFileSync('git', ['init', '--bare', remote], { stdio: 'ignore' });
    execFileSync('git', ['init', '-b', 'source', source], { stdio: 'ignore' });
    git(source, 'config', 'user.name', 'Release Guard Test');
    git(source, 'config', 'user.email', 'release-guard@example.invalid');
    git(source, 'remote', 'add', 'origin', remote);
    fs.writeFileSync(path.join(source, 'VERSION.txt'), '0.0.1\n');
    git(source, 'add', 'VERSION.txt');
    git(source, 'commit', '-m', 'initial source');

    assert.throws(() => requirePushedSourceCommit(source), /not reachable/);
    git(source, 'push', '-u', 'origin', 'source');
    assert.deepEqual(requirePushedSourceCommit(source), ['origin/source']);

    fs.appendFileSync(path.join(source, 'VERSION.txt'), 'unpushed\n');
    git(source, 'commit', '-am', 'unpushed source');
    assert.throws(() => requirePushedSourceCommit(source), /not reachable/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
