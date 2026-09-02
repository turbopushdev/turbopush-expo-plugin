import http from 'node:http'
import { spawn } from 'node:child_process'

const HOST = process.env.HARNESS_HOST || '127.0.0.1'
const PORT = Number(process.env.HARNESS_PORT || 3210)
const CWD = process.env.HARNESS_CWD || process.cwd()

const jobs = new Map()
let jobCounter = 0

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(obj))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function jobStatus(job) {
  return {
    status: job.status,
    exitCode: job.exitCode,
    stdout: job.stdout,
    stderr: job.stderr,
  }
}

function runCommand(command, { async = false } = {}) {
  const child = spawn('bash', ['-lc', command], {
    cwd: CWD,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const job = { status: 'running', exitCode: null, stdout: '', stderr: '' }
  child.stdout.on('data', (d) => (job.stdout += d))
  child.stderr.on('data', (d) => (job.stderr += d))

  if (async) {
    const id = String(++jobCounter)
    jobs.set(id, job)
    child.on('exit', (code) => {
      job.status = code === 0 ? 'success' : 'error'
      job.exitCode = code
    })
    child.on('error', (err) => {
      job.status = 'error'
      job.exitCode = null
      job.stderr += String(err)
    })
    return { id }
  }

  return new Promise((resolve) => {
    child.on('exit', (code) => resolve({ exitCode: code, stdout: job.stdout, stderr: job.stderr }))
    child.on('error', (err) => resolve({ exitCode: null, stdout: job.stdout, stderr: String(err) }))
  })
}

function waitForJob(res, id) {
  const job = jobs.get(id)
  if (!job) {
    sendJson(res, 404, { error: `job not found: ${id}` })
    return
  }

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Transfer-Encoding': 'chunked',
  })

  if (job.status !== 'running') {
    res.end(JSON.stringify(jobStatus(job)))
    return
  }

  // Send a heartbeat byte periodically to keep the client read-timeout from
  // firing while the job runs. The client strips leading whitespace before parsing.
  const heartbeat = setInterval(() => res.write(' '), 5000)
  const poll = setInterval(() => {
    if (job.status !== 'running') {
      clearInterval(heartbeat)
      clearInterval(poll)
      res.end(JSON.stringify(jobStatus(job)))
    }
  }, 200)
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname

  if (req.method === 'GET' && pathname === '/health') {
    sendJson(res, 200, { ok: true })
    return
  }

  if (req.method === 'POST' && pathname === '/exec') {
    try {
      const body = await readBody(req)
      const result = await runCommand(body.command, { async: body.async === true })
      sendJson(res, 200, result)
    } catch (err) {
      sendJson(res, 400, { error: String(err) })
    }
    return
  }

  const jobMatch = pathname.match(/^\/jobs\/([^/]+)(\/wait)?$/)
  if (req.method === 'GET' && jobMatch) {
    const id = jobMatch[1]
    const job = jobs.get(id)
    if (!job) {
      sendJson(res, 404, { error: `job not found: ${id}` })
      return
    }
    if (jobMatch[2] === '/wait') {
      waitForJob(res, id)
    } else {
      sendJson(res, 200, jobStatus(job))
    }
    return
  }

  sendJson(res, 404, { error: 'not found' })
})

server.listen(PORT, HOST, () => {
  console.log(`[harness] listening on http://${HOST}:${PORT} (cwd=${CWD})`)
})

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))
