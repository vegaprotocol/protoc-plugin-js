import * as types from 'protobuf-codec/decode/types.js'
import reader from 'protobuf-codec/decode/reader.js'
import { decode as EnumValueDescriptorProto } from '../enum-value-descriptor-proto/decode.js'

export function decode (
  buf,
  byteOffset = 0,
  byteLength = buf.byteLength
) {
  let name = null
  const value = []
  let options = null
  const reservedRange = []
  const reservedName = []

  for (const [_field, { data }] of reader(buf, byteOffset, byteLength)) {
    switch (_field) {
      case 1: name = types.string(data); break
      case 2: value.push(EnumValueDescriptorProto(data)); break
      case 3: options = data; break
      case 4: reservedRange.push(data); break
      case 5: reservedName.push(data); break
    }
  }

  return {
    name,
    value,
    options,
    reservedName,
    reservedRange
  }
}
