import { existsSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

export function resolveJavaHome() {
  if (process.env.JAVA_HOME) {
    const javaExecutable = path.join(
      process.env.JAVA_HOME,
      'bin',
      process.platform === 'win32' ? 'java.exe' : 'java',
    )
    if (!existsSync(javaExecutable)) {
      throw new Error(
        `JAVA_HOME does not contain a Java executable: ${process.env.JAVA_HOME}`,
      )
    }
    return process.env.JAVA_HOME
  }

  const command = process.platform === 'win32' ? 'where.exe' : 'which'
  const result = spawnSync(command, ['java'], {
    encoding: 'utf8',
    windowsHide: true,
  })
  const javaPath =
    result.status === 0 ? result.stdout.split(/\r?\n/).find(Boolean) : undefined
  if (!javaPath) {
    throw new Error(
      'Java 21 was not found. Set JAVA_HOME to a Java 21 JDK or add java to PATH.',
    )
  }

  const resolvedJavaPath = realpathSync(javaPath.trim())
  const javaHome = path.dirname(path.dirname(resolvedJavaPath))
  const javaExecutable = path.join(
    javaHome,
    'bin',
    process.platform === 'win32' ? 'java.exe' : 'java',
  )
  if (!existsSync(javaExecutable)) {
    throw new Error(
      `Could not resolve a Java home from PATH entry: ${javaPath}`,
    )
  }
  return javaHome
}
