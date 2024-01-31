import * as fs from 'node:fs'
import { requestBody } from './utils'
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
//   await fs.promises.writeFile(inputJsonPath, JSON.stringify({
//     $schema: `file://${schemaPath}`,
//     font: 'zenantique.ttf',
//     text: 'foo',
//     fill: 'red',
//     strokes: [],
//   }, null, 2))
// }
//
void main()
