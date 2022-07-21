import * as t from "../../../../../../../encode/wire-types.mjs"
import Writer from "../../../../../../../encode/writer.mjs"
import assert from "nanoassert"

export function encode({ name, content, insertionPoint, generatedCodeInfo }) {
  assert(insertionPoint == null, 'insertionPoint unsupported')
  assert(generatedCodeInfo == null, 'generatedCodeInfo unsupported')

  const writer = new Writer()
  if (name) writer.push(t.tag.encode(1, t.wireTypes.BYTES), t.string.encode(name))
  if (content) writer.push(t.tag.encode(15, t.wireTypes.BYTES), t.string.encode(content))
  return writer.concat()
}
