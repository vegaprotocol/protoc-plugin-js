import * as t from "../../../../../../encode/wire-types.mjs"
import Writer from "../../../../../../encode/writer.mjs"
import * as File from './file.mjs'

export function encode({ error, supportedFeatures, file }) {
  const writer = new Writer()

  if (error) writer.bytes(1, error, t.string)
  if (supportedFeatures) writer.fixed64(2, supportedFeatures, t.uint64)
  file?.forEach(f => {
    writer.bytes(15, File.encode(f))
  })

  return writer.concat()
}
