#!/usr/bin/env node
/**
 * Fails when the files of a known code injection are tracked in this repo.
 *
 * The injection drops a loader called `init`, a payload with an `.orc`
 * extension hidden under a nested `public/fonts` folder, a `.vscode/tasks.json`
 * task that runs on folder open, and edits `package.json` or a config file so
 * the loader runs on every dev, build and start. It has come back through
 * merges more than once, so this runs before every commit and push (see
 * `.githooks`) and in CI (`.github/workflows/guard.yml`).
 *
 * `node scripts/check-injected-code.mjs`                 check the repo
 * `node scripts/check-injected-code.mjs --install-hooks` also point git at `.githooks`
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

const MAX_BYTES = 1024 * 1024;

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

if (process.argv.includes('--install-hooks')) {
  try {
    if (existsSync('.githooks')) git('config', 'core.hooksPath', '.githooks');
  } catch {
    // Not a git checkout (a container or an archive): nothing to hook.
  }
  process.exit(0);
}

let files;
try {
  // Tracked files plus new files not yet added, so a commit is stopped early.
  files = git('ls-files', '--cached', '--others', '--exclude-standard')
    .split('\n')
    .filter(Boolean);
} catch {
  console.error('check-injected-code: not inside a git repository.');
  process.exit(2);
}

const problems = [];
const read = (file) => {
  try {
    if (!existsSync(file) || statSync(file).size > MAX_BYTES) return '';
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
};

const isConfigFile = (file) =>
  /(^|\/)(package\.json|[^/]*\.config\.[cm]?[jt]s|\.eslintrc[^/]*|babel\.config\.[cm]?js)$/.test(
    file
  );

for (const file of files) {
  if (/\.orc$/i.test(file)) {
    problems.push(`${file}: an .orc file is the injected payload`);
    continue;
  }
  if (file === 'init') {
    problems.push(`${file}: a root file named "init" is the injected loader`);
    continue;
  }

  const text =
    /^(\.vscode\/|package\.json$)/.test(file) || isConfigFile(file)
      ? read(file)
      : '';
  if (!text) continue;

  if (file.startsWith('.vscode/') && /folderOpen/.test(text)) {
    problems.push(`${file}: a task that runs when the folder is opened`);
  }
  if (
    file.startsWith('.vscode/') &&
    /"task\.allowAutomaticTasks"\s*:\s*true/.test(text)
  ) {
    problems.push(`${file}: turns on automatic tasks`);
  }
  if (file === 'package.json') {
    try {
      const scripts = JSON.parse(text).scripts ?? {};
      for (const [name, command] of Object.entries(scripts)) {
        if (/(^|[\s&|;])node\s+(\.\/)?init(\s|$)/.test(String(command))) {
          problems.push(
            `package.json: script "${name}" runs the injected loader`
          );
        }
      }
    } catch {
      problems.push('package.json: not valid JSON');
    }
  }
  if (isConfigFile(file) && /\.orc['"`)\]]/.test(text)) {
    problems.push(`${file}: loads an .orc payload`);
  }
}

if (problems.length) {
  console.error('Injected code found. Remove it before committing:\n');
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    '\nDo not run node on these files. Delete them and find out where they came from.'
  );
  process.exit(1);
}
console.log('check-injected-code: clean.');
