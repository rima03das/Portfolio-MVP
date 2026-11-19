const { spawnSync } = require('node:child_process')
const fs = require('node:fs')

const event = JSON.parse(fs.readFileSync(0, 'utf8'))

if (event.stop_hook_active) {
  process.stdout.write(JSON.stringify({ decision: 'allow' }))
  process.exit(0)
}

const result = spawnSync('npm run check:quick', {
  cwd: event.cwd,
  encoding: 'utf8',
  shell: true,
  timeout: 570_000,
})

if (result.error || result.status !== 0) {
  const output = [result.stdout, result.stderr, result.error?.message]
    .filter(Boolean)
    .join('\n')
    .slice(-12_000)
  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason: `npm run check:quick failed. Fix the reported issues, then finish the turn again. The hook will allow the next stop to avoid a loop.\n\n${output}`,
    }),
  )
  process.exit(0)
}

process.stdout.write(JSON.stringify({ decision: 'allow' }))
