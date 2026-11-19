import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveJavaHome } from './java-home.mjs'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
const isWindows = process.platform === 'win32'
const databaseFile = path.join(rootDir, 'data', 'portfolio').replace(/\\/g, '/')
const javaHome = resolveJavaHome()
const wrapper = path.join(rootDir, 'backend', isWindows ? 'mvnw.cmd' : 'mvnw')
const quote = (value) =>
  isWindows ? `"${value}"` : `'${value.replace(/'/g, "'\\''")}'`
const child = spawn(`${quote(wrapper)} -f backend/pom.xml spring-boot:run`, {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    JAVA_HOME: javaHome,
    PORTFOLIO_DB_URL:
      process.env.PORTFOLIO_DB_URL ??
      `jdbc:h2:file:${databaseFile};DB_CLOSE_ON_EXIT=FALSE`,
    PORTFOLIO_RESET: 'true',
    SPRING_MAIN_WEB_APPLICATION_TYPE: 'none',
  },
})

child.once('error', (error) => {
  console.error('Could not reset the local sample data.', error)
  process.exitCode = 1
})
child.once('close', (code) => {
  process.exitCode = code ?? 1
})
