import * as fs from 'node:fs'
import * as util from 'node:util'
import { RequestBody, requestBody } from './utils'
import { generateTitle } from './generate-text'
import { zodToJsonSchema } from 'zod-to-json-schema'

const assetsDir = new URL('../assets', import.meta.url).toString().replace('file://', '')
const fontsDir = `${assetsDir}/fonts`

const schemaPath = '/home/aabccd021/tmp/schema.json'
const inputJsonPath = `/home/aabccd021/tmp/input.json`

const args = util.parseArgs({
  args: process.argv.slice(2),
  options: {
    generateExample: { type: 'boolean' },
  },
})

const generateExample = async () => {
  console.log(`Creating example input file on ${inputJsonPath}`)
  const example: RequestBody = {
    text: '本日のハイライト',
    font: 'zenantique.ttf',
    fill: 'red',
    strokes: [
      {
        color: 'black',
        width: 20,
      },
      {
        color: 'white',
        width: 40,
      },
    ],
  }
  await fs.promises.writeFile(inputJsonPath, JSON.stringify(example, null, 2))
}

const generate = async () => {
  const requestBodyJsonSchema = zodToJsonSchema(requestBody)
  const schemaString = JSON.stringify(requestBodyJsonSchema, null, 2)
  await fs.promises.writeFile(schemaPath, schemaString)
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

const main = async () => {
  if (args.values.generateExample === true) {
    await generateExample()
    return
  }
  await generate()
}

void main()
