// Waits for a previously started async job (output.jobId) to finish.
// The harness long-polls with heartbeat bytes, so strip leading whitespace before parsing.
const res = http.get(HARNESS_URL + '/jobs/' + output.jobId + '/wait')

const data = json(res.body.trim())

output.exitCode = data.exitCode
output.status = data.status

if (data.exitCode !== 0) {
  throw new Error('job failed: ' + data.stderr)
}
