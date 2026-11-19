import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveJavaHome } from './java-home.mjs'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
const isWindows = process.platform === 'win32'
const npm = isWindows ? 'npm.cmd' : 'npm'
const quick = process.argv.includes('--quick')
process.env.JAVA_HOME = resolveJavaHome()

function run(command, label) {
  console.log(`\n> ${label}`)
  const result = spawnSync(command, {
    cwd: rootDir,
    env: process.env,
    stdio: 'inherit',
    shell: isWindows,
  })
  if (result.error) {
    if (command.startsWith('gitleaks ') && result.error.code === 'ENOENT') {
      console.error(
        'Gitleaks CLI is required. Install the official binary from https://github.com/gitleaks/gitleaks/releases and add it to PATH.',
      )
    } else {
      console.error(result.error.message)
    }
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
}

for (const script of [
  'format:check',
  'format:root:check',
  'lint',
  'lint:ts',
  'typecheck',
]) {
  run(`${npm} --prefix frontend run ${script}`, `frontend ${script}`)
}

run(
  'gitleaks git --config .gitleaks.toml .',
  'Gitleaks repository history scan',
)
run('gitleaks dir --config .gitleaks.toml .', 'Gitleaks working-tree scan')

run(
  quick ? `${npm} run test:quick` : `${npm} test`,
  quick ? 'quick checks' : 'full checks',
)
