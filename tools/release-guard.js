const { execFileSync } = require('child_process');

function pushedSourceBranches(root, remote = 'origin') {
  execFileSync('git', ['-C', root, 'fetch', '--quiet', '--no-tags', remote,
    `+refs/heads/*:refs/remotes/${remote}/*`], { encoding: 'utf8' });
  return execFileSync('git', ['-C', root, 'for-each-ref', '--format=%(refname:short)',
    '--contains', 'HEAD', `refs/remotes/${remote}`], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean)
    .filter(name => name !== `${remote}/HEAD` && name !== `${remote}/gh-pages`);
}

function requirePushedSourceCommit(root, remote = 'origin') {
  const branches = pushedSourceBranches(root, remote);
  if (!branches.length) {
    throw new Error(
      `HEAD is not reachable from any pushed ${remote} source branch. ` +
      'Push this exact commit before publishing it.'
    );
  }
  return branches;
}

module.exports = { pushedSourceBranches, requirePushedSourceCommit };
