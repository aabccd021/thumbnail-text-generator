import * as fs from 'node:fs'
import { RequestBody, requestBody } from './utils'
import { generateTitle } from './generate-text'
import { zodToJsonSchema } from 'zod-to-json-schema'

const assetsDir = new URL('../assets', import.meta.url).toString().replace('file://', '')
const fontsDir = `${assetsDir}/fonts`

const main = async () => {
  const requestBodyJsonSchema = zodToJsonSchema(requestBody)
  const schemaString = JSON.stringify(requestBodyJsonSchema, null, 2)
  const schemaPath = '/home/aabccd021/tmp/schema.json'
  await fs.promises.writeFile(schemaPath, schemaString)
  const inputJsonPath = `/home/aabccd021/tmp/input.json`
  if (!fs.existsSync(inputJsonPath)) {
    const example: RequestBody = {
      text: 'Hello World',
      font: 'zenantique.ttf',
      fill: 'black',
      strokes: [{
        color: 'white',
        width: 10,
      }],
    }
    await fs.promises.writeFile(inputJsonPath, JSON.stringify(example, null, 2))
  }
  const fileContent = await fs.promises.readFile(inputJsonPath, 'utf-8')
  const input: unknown = JSON.parse(fileContent)
  const request = await requestBody.parseAsync(input)
  const generateParams = {
    ...request,
    fontPath: `${fontsDir}/${request.font}`,
  }
  const generateResultPath = await generateTitle(generateParams)
  await fs.promises.copyFile(generateResultPath, '/home/aabccd021/tmp/out.png')
}

// const main = async () => {
//   const tmpDir = await fs.promises.mkdtemp('/tmp/thumbnail-generator-cli-')
// }
//
void main()
