import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as util from 'node:util'
import * as childProcess from 'node:child_process'
import * as b from 'zod' const requestBody = b.object({ $schema: b.string().optional(), font: b.enum([ 'zenantique.ttf',
    'delagothicone.ttf',
    'rocknrollone.ttf',
  ]).optional(),
  interlineSpacing: b.string().optional(),
  text: b.string(),
  fill: b.string().optional(),
  vertical: b.boolean().optional(),
  strokes: b.array(b.object({
    color: b.string(),
    width: b.number(),
  })).optional(),
})

type RequestBody = b.infer<typeof requestBody>

type Stroke = {
  color: string
  width: number
}

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
  const result = await execPromise(fullCmd)
  console.log(result.stdout)
  console.log(result.stderr)
  if (!fs.existsSync(outPath)) {
    throw new Error(`outPath is empty for key: ${key} on ${outPath}`)
  }
  await fs.promises.rename(outPath, cachePath)
  return cachePath
}

function generateStroke(args: {
  font: string
  text: string
  stroke: Stroke
  interlineSpacing: string
  vertical?: true
}) {
  const cmd = [
    'convert',
    `-font "${args.font}"`,
    '-background none',
    '-fill none',
    `-pointsize 200`,
    '-kerning -25',
    `-interline-spacing ${args.interlineSpacing}`,
    `-stroke ${args.stroke.color}`,
    `-strokewidth ${args.stroke.width}`,
    '-gravity center',
    `label:"${args.text}"`,
  ]
    .filter(arg => arg !== '')
    .join(' ')

  return cachedExec('generateStroke', 'png', cmd)
}

function generateInnerText(args: {
  font: string
  text: string
  fill: string
  interlineSpacing: string
}) {
  const cmd = [
    'convert',
    `-font "${args.font}"`,
    `-fill "${args.fill}"`,
    '-background none',
    `-pointsize 200`,
    '-kerning -25',
    `-interline-spacing ${args.interlineSpacing}`,
    '-gravity center',
    `label:"${args.text}"`,
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

async function generateStrokes(
  args: {
    font: string
    text: string
    strokes: Stroke[]
    interlineSpacing: string
  }
): Promise<string | undefined> {
  const reversedStrokes = args.strokes.toReversed()
  const [outmostStroke, ...restStrokes] = reversedStrokes
  if (outmostStroke === undefined) {
    return undefined
  }
  let strokePng = await generateStroke({ ...args, stroke: outmostStroke })
  for (const stroke of restStrokes) {
    const innerStrokePng = await generateStroke({ ...args, stroke })
    strokePng = await layerImages({
      bg: strokePng,
      fg: innerStrokePng,
      flags: '-gravity center -colorspace sRGB',
    })
  }
  return strokePng
}

export async function generateTitle(args: RequestBody, fontsDir: string) {
  const directedText = args.vertical === true ? args.text.split('').join('\n') : args.text
  const interlineSpacing = args.interlineSpacing ?? '-100'
  const strokes: Stroke[] = args.strokes ?? [{
    color: 'black',
    width: 20,
  }, {
    color: 'white',
    width: 20,
  },
  ]
  const fill = args.fill ?? 'red'
  const fontFamily = args.font ?? 'zenantique.ttf'
  const font = `${fontsDir}/${fontFamily}`
  const [innerTextPng, strokePng] = await Promise.all([
    generateInnerText({
      ...args,
      font,
      fill,
      text: directedText, interlineSpacing,
    }),
    generateStrokes({
      ...args,
      font,
      strokes,
      text: directedText, interlineSpacing,
    }),
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
