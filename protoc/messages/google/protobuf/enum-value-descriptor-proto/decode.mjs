import * as types from '../../../../../decode/types.mjs'
import reader from '../../../../../decode/reader.mjs'

export function decode(
  buf,
  byteOffset = 0,
  byteLength = buf.byteLength
) {
  let name = null
  let number = null
  let options = null

  for (const [_field, { data }] of reader(buf, byteOffset, byteLength)) {
    switch (_field) {
      case 1: name = types.string(data); break
      case 2: number = types.int32(data); break
      case 3: options = data; break
    }
  }

  return {
    name,
    number,
    options
  }
}
