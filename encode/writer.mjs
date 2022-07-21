import { varint, tag, bytes, wireTypes } from './wire-types.mjs'

export default class Writer {
  constructor () {
    this.buf = []
  }

  alloc(bytes) {
    // TODO This can use preallocated data
    const buf = new Uint8Array(bytes)
    this.push(buf)
    return buf
  }

  push (...b) {
    this.buf.push(...b)
  }

  varint(fieldNumber, value) {
    if (!value) return null
    const buf = this.alloc(
      tag.encodingLength(fieldNumber, wireTypes.VARINT) +
      varint.encodingLength(value)
    )

    tag.encode(fieldNumber, wireTypes.VARINT, buf)
    varint.encode(value, buf, tag.encode.bytes)
  }

  bytes(fieldNumber, value) {
    if (!value) return null
    const buf = this.alloc(
      tag.encodingLength(fieldNumber, wireTypes.BYTES) +
      bytes.encodingLength(value)
    )

    tag.encode(fieldNumber, wireTypes.BYTES, buf)
    bytes.encode(value, buf, tag.encode.bytes)
  }

  fixed64(fieldNumber, value) {
    if (!value) return null
    const buf = this.alloc(
      tag.encodingLength(fieldNumber, wireTypes.FIXED64) +
      this.fixed64.encodingLength(value)
    )

    tag.encode(fieldNumber, wireTypes.FIXED64, buf)
    this.fixed64.encode(value, buf, tag.encode.bytes)
  }

  fixed32(fieldNumber, value) {
    if (!value) return null
    const buf = this.alloc(
      tag.encodingLength(fieldNumber, wireTypes.FIXED32) +
      this.fixed32.encodingLength(value)
    )

    tag.encode(fieldNumber, wireTypes.FIXED32, buf)
    this.fixed32.encode(value, buf, tag.encode.bytes)
  }

  concat() {
    const size = this.buf.reduce((s, b) => s + b.byteLength, 0)
    if (size === 0) return null
    const concat = new Uint8Array(size)

    for (let i = 0, offset = 0; i < this.buf.length; i++) {
      const b = this.buf[i]
      concat.set(b, offset)
      offset += b.byteLength
    }

    return concat
  }
}

function _view (bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}
