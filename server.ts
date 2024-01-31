import * as http from 'node:http'
import * as fs from 'node:fs'
import { generateTitle, titleArgs } from './generate-text'
import { indexHtml } from './index.html'

const assetsDir = new URL('./assets', import.meta.url).toString().replace('file://', '')

const getPostBody = async (req: http.IncomingMessage) => {
  const chunks: Uint8Array[] = []
  for await (const chunk of req) {
    if (!(chunk instanceof Uint8Array)) {
      throw new Error(`chunk is not Uint8Array: ${chunk}`)
    }
    chunks.push(chunk)
  }
  const body: string = Buffer.concat(chunks).toString()
  return body
}

const serverHandler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write(indexHtml)
    res.end()
    return
  }
  if (req.url === '/client.js') {
    const data = await fs.promises.readFile(`${assetsDir}/client.js`, 'utf-8')
    res.writeHead(200, { 'Content-Type': 'text/javascript' })
    res.write(data)
    res.end()
    return
  }
  if (req.url === '/generate-text' && req.method === 'POST') {
    const bodyStr = await getPostBody(req)
    const bodyJson: unknown = JSON.parse(bodyStr)
    const titleArgsValue = titleArgs(bodyJson)
    const data = await generateTitle(titleArgsValue)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.write(data)
    res.end()
    return
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.write('404 Not Found')
  res.end()
}

const server = http.createServer((req, res) => {
  void serverHandler(req, res)
})

server.listen(3000)
