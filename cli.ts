import * as fs from 'node:fs'
import { requestBody } from './utils'
import { generateTitle } from './generate-text'

const assetsDir = new URL('./assets', import.meta.url).toString().replace('file://', '')
const fontsDir = `${assetsDir}/fonts`

const main = async () => {
  const tmpDir = await fs.promises.mkdtemp('/tmp/thumbnail-generator-cli-')
  const inputJsonPath = `${tmpDir}/input.json`
  await fs.promises.writeFile(inputJsonPath, JSON.stringify({
    font: 'zenantique.ttf',
    text: 'foo',
    fill: 'red',
    strokes: [],
  }, null, 2))
  const watcher = fs.promises.watch(inputJsonPath)
  console.log(`Watching ${inputJsonPath}`)
  let alreadyOpened = false
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _event of watcher) {
    try {
      const fileContent = await fs.promises.readFile(inputJsonPath, 'utf-8')
      const input: unknown = JSON.parse(fileContent)
      const request = requestBody(input)
      const generateParams = {
        ...request,
        fontPath: `${fontsDir}/${request.font}`,
      }
      const generateResultPath = await generateTitle(generateParams)
      await fs.promises.copyFile(generateResultPath, `${tmpDir}/output.png`)
      if (!alreadyOpened) {
        alreadyOpened = true
      }
    }
    catch (e) {
      console.error(e)
    }
  }
}

void main()
