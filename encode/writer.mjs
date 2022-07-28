import { varint, tag, bytes, uint64, uint32, wireTypes } from './wire-types.mjs'

const PAGE_SIZE = 256

export default class Writer {
  constructor (prealloc = PAGE_SIZE) {
    this.buf = [new Uint8Array(prealloc)]
    this.offset = 0
  }

  get pages() {
    return this.buf.length
  }

  alloc(bytes) {
    const tail = this.buf.at(-1)
    if (tail.byteLength - this.offset >= bytes) {
      this.offset += bytes
      return tail.subarray(this.offset - bytes)
    }

    this._trim()
    this.offset = bytes
    const buf = new Uint8Array(Math.max(bytes, PAGE_SIZE))
    this.buf.push(buf)
    return buf
  }

  _trim() {
    if (this.offset === 0) {
      this.buf.pop() // remove the item that is unused
    }
    else this.buf.push(this.buf.pop().subarray(0, this.offset))
  }

  append(...b) {
    this._trim()
    this.buf.push(...b)
    let tail = this.buf.at(-1)
    this.offset = tail.byteLength

    return tail
  }

  varint(fieldNumber, value, codec = varint) {
    if (!value) return null

    const buf = this.alloc(
      tag.encodingLength(fieldNumber, wireTypes.VARINT) +
      codec.encodingLength(value)
    )

    tag.encode(fieldNumber, wireTypes.VARINT, buf)
    codec.encode(value, buf, tag.encode.bytes)
  }

  bytes(fieldNumber, value, codec = bytes) {
    if (!value) return null

    const buf = this.alloc(
      tag.encodingLength(fieldNumber, wireTypes.BYTES) +
      codec.encodingLength(value)
    )

    tag.encode(fieldNumber, wireTypes.BYTES, buf)
    codec.encode(value, buf, tag.encode.bytes)
  }

  fixed64(fieldNumber, value, codec = uint64) {
    if (!value) return null
    const buf = this.alloc(
      tag.encodingLength(fieldNumber, wireTypes.FIXED64) +
      codec.encodingLength(value)
    )

    tag.encode(fieldNumber, wireTypes.FIXED64, buf)
    codec.encode(value, buf, tag.encode.bytes)
  }

  fixed32(fieldNumber, value, codec = uint32) {
    if (!value) return null
    const buf = this.alloc(
      tag.encodingLength(fieldNumber, wireTypes.FIXED32) +
      codec.encodingLength(value)
    )

    tag.encode(fieldNumber, wireTypes.FIXED32, buf)
    codec.encode(value, buf, tag.encode.bytes)
  }

  encodingLength () {
    let size = 0
    for (let i = 0; i < this.buf.length - 1; i++) {
      size += this.buf[i].byteLength
    }

    size += this.offset

    return size
  }

  // TODO take buf, byteOffset and write into if given
  concat(buf, byteOffset = 0) {
    this._trim()
    let size = this.encodingLength()

    if (buf == null) buf = new Uint8Array(size)

    for (let i = 0, offset = byteOffset; i < this.buf.length; i++) {
      const b = this.buf[i]
      buf.set(b, offset)
      offset += b.byteLength
    }

    return buf
  }
}

function _view (bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}
