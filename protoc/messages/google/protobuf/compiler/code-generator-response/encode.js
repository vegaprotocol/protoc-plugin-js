import * as t from "protobuf-codec/encode/wire-types.js"
import Writer from "protobuf-codec/encode/writer.js"
import * as File from './file.js'

export function encode({ error, supportedFeatures, file }) {
  const writer = new Writer()

  if (error) writer.bytes(1, error, t.string)
  if (supportedFeatures) writer.varint(2, supportedFeatures, t.uint64)
  file?.forEach(f => {
    writer.bytes(15, File.encode(f))
  })

  return writer.concat()
}
