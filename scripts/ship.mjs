#!/usr/bin/env node
/**
 * One command for the whole trip: commit, push, and wait for GitHub Actions to
 * finish the deploy. Nothing runs on the VPS by hand.
 *
 *   npm run ship                       # commit staged + unstaged changes
 *   npm run ship -- -m "message"      # with your own commit message
 *   npm run ship -- --no-commit       # only push what is already committed
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const args = process.argv.slice(2);
const messageIndex = args.indexOf('-m');
const message = messageIndex >= 0 ? args[messageIndex + 1] : null;
const skipCommit = args.includes('--no-commit');

async function git(...argv) {
  const { stdout } = await run('git', argv, { cwd: process.cwd() });
  return stdout.trim();
}

async function main() {
  const branch = await git('rev-parse', '--abbrev-ref', 'HEAD');
  if (branch !== 'main') {
    console.error(`Refusing to ship from "${branch}". Switch to main first.`);
    process.exit(1);
  }

  if (!skipCommit) {
    const status = await git('status', '--porcelain');
    if (status) {
      await git('add', '-A');
      const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      await git('commit', '-m', message ?? `update ${stamp}`);
      console.log('Committed.');
    } else {
      console.log('Nothing to commit.');
    }
  }

  const head = await git('rev-parse', 'HEAD');
  console.log(`Pushing ${head.slice(0, 7)}…`);
  await run('git', ['push', 'origin', 'main'], { cwd: process.cwd() });

  console.log('Waiting for GitHub Actions to build and deploy…');
  const gh = await findGh();
  if (!gh) {
    console.log('gh CLI not found. Open the Actions tab to watch the deploy:');
    console.log('  https://github.com/nxsmlx/wh-sc-dl-dashboard/actions');
    return;
  }

  try {
    await new Promise((resolvePromise, reject) => {
      const watcher = execFile(
        gh,
        ['run', 'watch', '--exit-status', '--interval', '10', '--compact'],
        { cwd: process.cwd() },
      );
      watcher.stdout?.pipe(process.stdout);
      watcher.stderr?.pipe(process.stderr);
      watcher.on('exit', (code) => (code === 0 ? resolvePromise() : reject(new Error(`workflow exited ${code}`))));
    });
    console.log('Deployed.');
  } catch {
    console.error('Deploy failed. The VPS is still running the previous image.');
    process.exit(1);
  }
}

async function findGh() {
  for (const candidate of ['gh', `${process.env.HOME}/.local/bin/gh`]) {
    try {
      await run(candidate, ['--version']);
      return candidate;
    } catch {
      // Try the next location.
    }
  }
  return null;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
