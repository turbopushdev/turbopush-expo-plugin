// Runs a shell command on the local harness.
// Env (passed via `runScript` env): COMMAND (shell string), ASYNC ("true"|"false").
// On success (async): stores output.jobId. On sync: stores output.exitCode/stdout/stderr.
const res = http.post(HARNESS_URL + '/exec', {
  body: JSON.stringify({ command: COMMAND, async: ASYNC === 'true' })
})

const data = json(res.body)

if (ASYNC === 'true') {
  output.jobId = data.id
} else {
  output.exitCode = data.exitCode
  output.stdout = data.stdout
  output.stderr = data.stderr
  if (data.exitCode !== 0) {
    throw new Error('command failed: ' + data.stderr)
  }
}
