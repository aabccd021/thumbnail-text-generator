import * as b from 'banditypes'

export const requestBody = b.object({
  font: b.string(),
  text: b.string(),
  fill: b.string(),
  strokes: b.array(b.object({
    color: b.string(),
    width: b.number(),
  })),
})

export type RequestBody = b.Infer<typeof requestBody>

export type Stroke = {
  color: string
  width: number
}
