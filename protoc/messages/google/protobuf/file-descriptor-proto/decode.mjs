import * as types from 'protobuf-codec/decode/types.mjs'
import reader from 'protobuf-codec/decode/reader.mjs'
import { decode as DescriptorProto } from '../descriptor-proto/decode.mjs'
import { decode as EnumDescriptorProto } from '../enum-descriptor-proto/decode.mjs'

export function decode(
  buf,
  byteOffset = 0,
  byteLength = buf.byteLength
) {
  let name = null
  let packageName = null
  const dependency = []
  const publicDependency = []
  const weakDependency = []
  const messageType = []
  const enumType = []
  const service = []
  const extension = []
  let options = null
  let sourceCodeInfo = null
  let syntax = null

  for (const [field, { data }] of reader(buf, byteOffset, byteLength)) {
    switch (field) {
      case 1: name = types.string(data); break
      case 2: packageName = types.string(data); break
      case 3: dependency.push(types.string(data)); break
      case 10: publicDependency.push(types.int32(data)); break
      case 11: weakDependency.push(types.int32(data)); break
      case 4: messageType.push(DescriptorProto(data)); break
      case 5: enumType.push(EnumDescriptorProto(data)); break
      case 6: service.push(data); break
      case 7: extension.push(data); break
      case 8: options = data; break
      case 9: sourceCodeInfo = data; break
      case 12: syntax = types.string(data); break
    }
  }

  return {
    name,
    packageName,
    dependency,
    publicDependency,
    weakDependency,
    messageType,
    enumType,
    service,
    extension,
    options,
    sourceCodeInfo,
    syntax
  }
}
