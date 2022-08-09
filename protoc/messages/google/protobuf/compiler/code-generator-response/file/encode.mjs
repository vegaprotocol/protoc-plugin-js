import * as t from "protobuf-codec/encode/wire-types.mjs"
import Writer from "protobuf-codec/encode/writer.mjs"
import assert from "nanoassert"

export function encode({ name, content, insertionPoint, generatedCodeInfo }) {
  assert(insertionPoint == null, 'insertionPoint unsupported')
  assert(generatedCodeInfo == null, 'generatedCodeInfo unsupported')

  const writer = new Writer()
  if (name) writer.bytes(1, name, t.string)
  if (content) writer.bytes(15, content, t.string)
  return writer.concat()
}
