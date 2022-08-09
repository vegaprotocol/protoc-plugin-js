import * as types from 'protobuf-codec/decode/types.mjs'
import reader from 'protobuf-codec/decode/reader.mjs'

export function decode(
  buf,
  byteOffset = 0,
  byteLength = buf.byteLength
) {
  let messageSetWireFormat = false
  let noStandardDescriptorAccessor = false
  let deprecated = false
  let mapEntry = null
  const uninterpretedOption = []

  for (const [field, { data }] of reader(buf, byteOffset, byteLength)) {
    switch (field) {
      case 1: messageSetWireFormat = types.bool(data); break
      case 2: noStandardDescriptorAccessor = types.bool(data); break
      case 3: deprecated = types.bool(data); break
      case 7: mapEntry = types.bool(data); break
      case 999: uninterpretedOption.push(data); break
    }
  }

  return {
    messageSetWireFormat,
    noStandardDescriptorAccessor,
    deprecated,
    mapEntry,
    uninterpretedOption
  }
}
