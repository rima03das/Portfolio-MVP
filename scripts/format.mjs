import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveJavaHome } from './java-home.mjs'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
const isWindows = process.platform === 'win32'
const npm = isWindows ? 'npm.cmd' : 'npm'
const wrapper = path.join(rootDir, 'backend', isWindows ? 'mvnw.cmd' : 'mvnw')
const mavenCommand = isWindows ? `"${wrapper}"` : wrapper
process.env.JAVA_HOME = resolveJavaHome()

function run(command) {
  const result = spawnSync(command, {
    cwd: rootDir,
    env: process.env,
    stdio: 'inherit',
    shell: isWindows,
  })
  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(`${npm} --prefix frontend run format`)
run(`${npm} --prefix frontend run format:root`)
run(`${mavenCommand} -f backend/pom.xml spotless:apply`)
