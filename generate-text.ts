import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as util from 'node:util'
import * as childProcess from 'node:child_process'
import * as b from 'banditypes'

const execPromise = util.promisify(childProcess.exec)

async function cachedExec(key: string, extension: string, cmd: string): Promise<string> {
  const hash = crypto.createHash('md5').update(cmd).digest('hex')
  const cachePath = `/tmp/${hash}.${extension}`
  if (fs.existsSync(cachePath)) {
    console.log(`Cache hit for ${key} on ${cachePath}`)
    return cachePath
  }
  console.log(`Cache miss for ${key} on ${cachePath}`)
  const outPath = `/tmp/cache-${hash}.${extension}`
  const fullCmd = `${cmd} ${outPath}`
  console.log(`Executing: ${fullCmd}`)
  await execPromise(fullCmd)
  if (!fs.existsSync(outPath)) {
    throw new Error(`outPath is empty for key: ${key} on ${outPath}`)
  }
  await fs.promises.rename(outPath, cachePath)
  return cachePath
}

function generateStroke(fontPath: string, text: string, strokeParam: Stroke) {
  const strokeColorArg = strokeParam.color ? `-stroke ${strokeParam.color}` : ''
  const strokeWidthArg = strokeParam.width ? `-strokewidth ${strokeParam.width}` : ''

  const cmd = [
    'convert',
    `-font "${fontPath}"`,
    '-background none',
    `-pointsize 200`,
    '-kerning -25',
    strokeColorArg,
    strokeWidthArg,
    '-gravity Center',
    `label:"${text}"`,
  ]
    .filter(arg => arg !== '')
    .join(' ')

  return cachedExec('generateStroke', 'png', cmd)
}

function generateInnerText(fontPath: string, text: string, fill?: string | undefined) {
  const fillColor = fill ?? 'red'

  const cmd = [
    'convert',
    `-font "${fontPath}"`,
    `-fill "${fillColor}"`,
    '-background none',
    `-pointsize 200`,
    '-kerning -25',
    '-gravity Center',
    `label:"${text}"`,
  ]
    .filter(arg => arg !== '')
    .join(' ')

  return cachedExec('generateTitleText', 'png', cmd)
}

function layerImages(args: {
  fg: string
  bg: string
  flags?: string
}) {
  const cmd = [
    'convert',
    args.flags ? args.flags : '',
    args.bg,
    args.fg,
    '-composite',
  ]
    .filter(arg => arg !== '')
    .join(' ')

  return cachedExec('layerImages', 'png', cmd)
}

const stroke = b.object({
  color: b.string(),
  width: b.number(),
})

export const titleArgs = b.object({
  fontPath: b.string(),
  text: b.string(),
  fill: b.string().or(b.optional()),
  strokes: b.array(stroke).or(b.optional()),
})

type Stroke = b.Infer<typeof stroke>

export type TitleArgs = b.Infer<typeof titleArgs>

async function generateStrokes(
  fontPath: string,
  text: string,
  strokes?: Stroke[]
): Promise<string | undefined> {
  if (strokes === undefined) {
    return undefined
  }
  const reversedStrokes = strokes.toReversed()
  const [outmostStroke, ...restStrokes] = reversedStrokes
  if (outmostStroke === undefined) {
    return undefined
  }
  let strokePng = await generateStroke(fontPath, text, outmostStroke)
  for (const stroke of restStrokes) {
    const innerStrokePng = await generateStroke(fontPath, text, stroke)
    strokePng = await layerImages({
      fg: strokePng,
      bg: innerStrokePng,
      flags: '-gravity center -colorspace sRGB',
    })
  }
  return strokePng
}

export async function generateTitle(args: TitleArgs) {
  const { fontPath, text, fill, strokes } = args
  const [innerTextPng, strokePng] = await Promise.all([
    generateInnerText(fontPath, text, fill),
    generateStrokes(fontPath, text, strokes),
  ])
  if (strokePng === undefined) {
    return innerTextPng
  }
  return layerImages({
    fg: innerTextPng,
    bg: strokePng,
    flags: '-gravity center -colorspace sRGB',
  })
}
