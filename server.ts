import * as http from 'node:http'
import * as fs from 'node:fs'

const assetsDir = new URL('./assets', import.meta.url).toString().replace('file://', '')

const html = (strings: TemplateStringsArray, ...values: string[]) => {
  const raw = strings.raw
  let result = ''
  for (let i = 0; i < raw.length; i++) {
    result += raw[i]
    if (i < values.length) {
      result += values[i]
    }
  }
  return result
}

const indexHtml = html`
<!-- hello world -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>hello world</title>
</head>
<body>
    <h1>hello worl</h1>
</body>
<script src="/client.js"></script>
</html>
`

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
  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.write('404 Not Found')
  res.end()
}

const server = http.createServer((req, res) => {
  void serverHandler(req, res)
})

server.listen(3000)
