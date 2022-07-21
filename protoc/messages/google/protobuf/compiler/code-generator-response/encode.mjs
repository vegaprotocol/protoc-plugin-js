import * as t from "../../../../../../encode/wire-types.mjs"
import Writer from "../../../../../../encode/writer.mjs"
import * as File from './file.mjs'

export function encode({ error, supportedFeatures, file }) {
  const writer = new Writer()

  if (error) writer.push(t.tag.encode(1, t.wireTypes.BYTES), t.string.encode(error))
  if (supportedFeatures) writer.push(t.tag.encode(2, t.wireTypes.VARINT), t.string.uint64(supportedFeatures))
  file?.forEach(f => {
    writer.push(t.tag.encode(15, t.wireTypes.BYTES), t.bytes.encode(File.encode(f)))
  })

  return writer.concat()
}
