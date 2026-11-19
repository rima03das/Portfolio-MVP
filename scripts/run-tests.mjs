import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveJavaHome } from './java-home.mjs'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
const isWindows = process.platform === 'win32'
process.env.JAVA_HOME = resolveJavaHome()
const wrapper = path.join(rootDir, 'backend', isWindows ? 'mvnw.cmd' : 'mvnw')

function run(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    })
    child.once('error', reject)
    child.once('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} exited with code ${code ?? 'unknown'}`))
    })
  })
}

const quote = (value) => isWindows ? `"${value}"` : `'${value.replace(/'/g, "'\\''")}'`
await run(`${isWindows ? 'npm.cmd' : 'npm'} --prefix frontend test`)
await run(`${quote(wrapper)} -f backend/pom.xml test`)
await run(`${isWindows ? 'npm.cmd' : 'npm'} --prefix frontend run test:e2e`)
