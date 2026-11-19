const fs = require('node:fs')

const event = JSON.parse(fs.readFileSync(0, 'utf8'))
const toolName = String(event.toolName ?? '').toLowerCase()
const args = event.toolArgs
const editTools =
  /(^|[._-])(edit|create|write|apply_patch|str_replace_editor)$/.test(toolName)
const shellTools = /(^|[._-])(powershell|bash|shell|terminal)$/.test(toolName)

function isEnvPath(value) {
  const normalized = value
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\\/g, '/')
  return normalized.split('/').pop() === '.env'
}

function patchTargetsEnv(value) {
  return Array.from(
    value.matchAll(/^\s*\*\*\*\s+(?:Add|Update|Delete) File:\s*(.+?)\s*$/gm),
  ).some((match) => isEnvPath(match[1]))
}

function containsEnvTarget(value, key = '') {
  if (typeof value === 'string') {
    if (/patch|content/i.test(key)) {
      return patchTargetsEnv(value)
    }
    return /path|file|target|uri/i.test(key) && isEnvPath(value)
  }

  if (Array.isArray(value)) {
    return value.some((entry) => containsEnvTarget(entry, key))
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).some(([childKey, childValue]) =>
      containsEnvTarget(childValue, childKey),
    )
  }

  return false
}

function shellMentionsEnv(value) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value)
  return /(^|[\s"'=\\/:])\.env(?=$|[\s"'\\/;,)<>|&])/i.test(serialized)
}

if (
  (editTools &&
    (containsEnvTarget(args) ||
      (toolName.endsWith('apply_patch') &&
        typeof args === 'string' &&
        patchTargetsEnv(args)))) ||
  (shellTools && shellMentionsEnv(args))
) {
  process.stdout.write(
    JSON.stringify({
      permissionDecision: 'deny',
      permissionDecisionReason:
        'Edits or shell commands targeting .env are blocked by repository policy.',
    }),
  )
} else {
  process.stdout.write('{}')
}
