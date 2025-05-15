import { Octokit } from '@octokit/core'

const args = process.argv.slice(2)
if (!Array.isArray(args) || args.length !== 1 || typeof args[0] !== 'string') {
  // eslint-disable-next-line no-console
  console.log(args)
  throw new Error('Expected one (string) argument for the GitHub relase id')
}
const webhookUrl = process.env.MAKE_WEBHOOK_URL
if (typeof webhookUrl !== 'string') {
  throw new Error('Expected MAKE_WEBHOOK_URL to be set')
}
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})
const tag = args[0]
let releaseNote: string
try {
  const release = await octokit.request(
    `GET /repos/nordcraftengine/nordcraft/releases/tags/${tag}`,
    {
      owner: 'nordcraftengine',
      repo: 'nordcraft',
      tag,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )
  releaseNote = release.data.body
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('Failed to fetch release notes', error)
  process.exit(1)
}
const message = `New Nordcraft release available: ${tag} 🎉\n\n${releaseNote}`
try {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to send message: ${response.statusText} - ${text}`)
  }
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('Failed to send message', error)
  process.exit(1)
}
