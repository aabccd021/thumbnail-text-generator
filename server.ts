import * as http from 'node:http'
import * as fs from 'node:fs'
import { generateTitle } from './generate-text'
import { indexHtml } from './index.html'
import * as b from 'banditypes'

const assetsDir = new URL('./assets', import.meta.url).toString().replace('file://', '')
const fontsDir = `${assetsDir}/fonts`

const generateTextParams = b.object({
  font: b.string(),
  text: b.string(),
  fill: b.string(),
  strokes: b.array(b.object({
    color: b.string(),
    width: b.number(),
  })),
})

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
  console.log(req.url)
  // eslint-disable-next-line @microsoft/sdl/no-insecure-url
  const url = new URL(req.url ?? '', `http://${req.headers.host}`)
  if (url.pathname === '/' && req.method === 'GET') {
    const fontsAvailable = await fs.promises.readdir(fontsDir)
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write(indexHtml(fontsAvailable))
    res.end()
    return
  }
  if (url.pathname === '/client.js' && req.method === 'GET') {
    const data = await fs.promises.readFile(`${assetsDir}/client.js`, 'utf-8')
    res.writeHead(200, { 'Content-Type': 'text/javascript' })
    res.write(data)
    res.end()
    return
  }
  if (url.pathname.startsWith('/fs-files') && req.method === 'GET') {
    const fsPath = url.pathname.replace('/fs-files', '')
    const data = await fs.promises.readFile(fsPath)
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' })
    res.write(data)
    res.end()
    return
  }

  if (url.pathname === '/generate-text' && req.method === 'POST') {
    const bodyStr = await getPostBody(req)
    const bodyJson: unknown = JSON.parse(bodyStr)
    const params = generateTextParams(bodyJson)
    const titleArgsValue = {
      ...params,
      fontPath: `${fontsDir}/${params.font}`,
    }
    const filePath = await generateTitle(titleArgsValue)
    const fileUrl = `/fs-files${filePath}`

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.write(JSON.stringify(fileUrl))
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
