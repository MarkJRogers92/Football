// Runs node --test with one worker per core. node's own default leaves a core idle, and these files are CPU-bound
// simulations, so using every core cuts the full suite by about 7% on a four-core machine.
const { spawnSync } = require('child_process');
const os = require('os');
const workers = Math.max(1, (os.availableParallelism?.() || os.cpus().length));
const res = spawnSync(process.execPath, ['--test', `--test-concurrency=${workers}`, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(res.status ?? 1);
