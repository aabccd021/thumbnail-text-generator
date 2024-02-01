import * as b from 'zod'

export const requestBody = b.object({
  $schema: b.string().optional(),
  font: b.enum([
    'zenantique.ttf',
    'delagothicone.ttf',
    'rocknrollone.ttf',
  ]),
  text: b.string(),
  fill: b.string(),
  vertical: b.boolean().optional(),
  strokes: b.array(b.object({
    color: b.string(),
    width: b.number(),
  })),
})

export type RequestBody = b.infer<typeof requestBody>

export type Stroke = {
  color: string
  width: number
}
