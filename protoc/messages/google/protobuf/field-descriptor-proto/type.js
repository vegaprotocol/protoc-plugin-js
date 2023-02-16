import { int32 as decodeInt32 } from 'protobuf-codec/decode/types.js'
import { int32 } from 'protobuf-codec/encode/types.js'

const strings = new Map([
  [1, 'TYPE_DOUBLE'],
  [2, 'TYPE_FLOAT'],
  [3, 'TYPE_INT64'],
  [4, 'TYPE_UINT64'],
  [5, 'TYPE_INT32'],
  [6, 'TYPE_FIXED64'],
  [7, 'TYPE_FIXED32'],
  [8, 'TYPE_BOOL'],
  [9, 'TYPE_STRING'],
  [10, 'TYPE_GROUP'],
  [11, 'TYPE_MESSAGE'],
  [12, 'TYPE_BYTES'],
  [13, 'TYPE_UINT32'],
  [14, 'TYPE_ENUM'],
  [15, 'TYPE_SFIXED32'],
  [16, 'TYPE_SFIXED64'],
  [17, 'TYPE_SINT32'],
  [18, 'TYPE_SINT64']
])

export function encode (value, buf, byteOffset) {
  return int32.encode(value, buf, byteOffset)
}

export function encodingLength () {
  return 1
}

export function decode (buf, byteOffset = 0, byteLength = buf.byteLength) {
  return decodeInt32(buf)
}

export function string (int) {
  return strings.get(int)
}
