import { int32 as decodeInt32 } from 'protobuf-codec/decode/types.js'
import { int32 } from 'protobuf-codec/encode/types.js'

const strings = new Map([
  [1, 'LABEL_OPTIONAL'],
  [2, 'LABEL_REQUIRED'],
  [3, 'LABEL_REPEATED']
])

export function encode(value, buf, byteOffset) {
  return int32.encode(value, buf, byteOffset)
}

export function encodingLength() {
  return 1
}

export function decode(buf, byteOffset = 0, byteLength = buf.byteLength) {
  return decodeInt32(buf)
}

export function string(int) {
  return strings.get(int)
}
