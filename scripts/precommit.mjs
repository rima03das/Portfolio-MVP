import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveJavaHome } from './java-home.mjs'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
const isWindows = process.platform === 'win32'
const npm = isWindows ? 'npm.cmd' : 'npm'
const wrapper = path.join(rootDir, 'backend', isWindows ? 'mvnw.cmd' : 'mvnw')
const prettier = path.join(
  rootDir,
  'node_modules',
  'prettier',
  'bin',
  'prettier.cjs',
)
const javaHome = resolveJavaHome()
process.env.JAVA_HOME = javaHome

function run(command, args, label, options = {}) {
  console.log(`\n> ${label}`)
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: process.env,
    stdio: 'inherit',
    shell: isWindows && (command.endsWith('.cmd') || command === npm),
    ...options,
  })

  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }

  if (result.status !== 0) process.exit(result.status ?? 1)
}

function stagedFiles() {
  const result = spawnSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'],
    {
      cwd: rootDir,
      encoding: 'utf8',
    },
  )
  if (result.status !== 0) {
    console.error(result.stderr)
    process.exit(result.status ?? 1)
  }
  return result.stdout.split('\0').filter(Boolean)
}

const files = stagedFiles()
const prettierFiles = files.filter((file) =>
  /\.(?:css|html|js|jsx|json|md|mdx|ts|tsx|yaml|yml)$/i.test(file),
)
const javaFiles = files.filter((file) => file.endsWith('.java'))

if (prettierFiles.length > 0) {
  run(
    process.execPath,
    [
      prettier,
      '--write',
      '--ignore-unknown',
      '--config',
      path.join(rootDir, 'frontend', '.prettierrc.json'),
      ...prettierFiles,
    ],
    'format staged files with Prettier',
  )
}

if (javaFiles.length > 0) {
  run(
    wrapper,
    ['-f', path.join(rootDir, 'backend', 'pom.xml'), 'spotless:apply'],
    'format staged Java files with Spotless',
  )
}

if (files.length > 0) {
  run('git', ['add', '--', ...files], 'stage formatted files')
}

run(npm, ['--prefix', 'frontend', 'run', 'lint'], 'frontend ESLint')
run(npm, ['--prefix', 'frontend', 'run', 'lint:ts'], 'frontend Oxlint')
run(npm, ['--prefix', 'frontend', 'run', 'typecheck'], 'frontend typecheck')
run(
  wrapper,
  [
    '-f',
    path.join(rootDir, 'backend', 'pom.xml'),
    'checkstyle:check',
    'compile',
  ],
  'backend lint and compile',
)

const localGitleaks = path.join(
  process.env.LOCALAPPDATA ?? '',
  'Programs',
  'PortfolioToolchain',
  'gitleaks',
  isWindows ? 'gitleaks.exe' : 'gitleaks',
)
const gitleaks = fs.existsSync(localGitleaks) ? localGitleaks : 'gitleaks'
run(
  gitleaks,
  ['git', '--staged', '--config', '.gitleaks.toml'],
  'Gitleaks staged-content scan',
)
