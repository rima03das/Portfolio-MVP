import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveJavaHome } from './java-home.mjs'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
const isWindows = process.platform === 'win32'
const databaseFile = path.join(rootDir, 'data', 'portfolio').replace(/\\/g, '/')
const javaHome = resolveJavaHome()

function quote(value) {
  return isWindows ? `"${value}"` : `'${value.replace(/'/g, "'\\''")}'`
}

function run(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
      ...options,
    })
    child.once('error', reject)
    child.once('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} exited with code ${code ?? 'unknown'}`))
    })
  })
}

await run(`${isWindows ? 'npm.cmd' : 'npm'} --prefix frontend run build`)

const wrapper = path.join(rootDir, 'backend', isWindows ? 'mvnw.cmd' : 'mvnw')
const server = spawn(`${quote(wrapper)} -f backend/pom.xml spring-boot:run`, {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    JAVA_HOME: javaHome,
    PORTFOLIO_DB_URL:
      process.env.PORTFOLIO_DB_URL ??
      `jdbc:h2:file:${databaseFile};DB_CLOSE_ON_EXIT=FALSE`,
  },
})

server.once('error', (error) => {
  console.error('Could not start the Spring Boot application.', error)
  process.exitCode = 1
})
server.once('close', (code) => {
  process.exitCode = code ?? 1
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.kill(signal))
}
