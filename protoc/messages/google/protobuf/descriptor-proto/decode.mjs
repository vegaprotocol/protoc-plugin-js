import * as types from 'protobuf-codec/decode/types.mjs'
import reader from 'protobuf-codec/decode/reader.mjs'
import { decode as EnumDescriptorProto } from '../enum-descriptor-proto/decode.mjs'
import { decode as FieldDescriptorProto } from '../field-descriptor-proto/decode.mjs'
import { decode as OneofDescriptorProto } from '../oneof-descriptor-proto/decode.mjs'
import { decode as MessageOptions } from '../message-options/decode.mjs'
export function decode(
  buf,
  byteOffset = 0,
  byteLength = buf.byteLength
) {
  let name = null
  const field = []
  const extension = []
  const nestedType = []
  const enumType = []
  const extensionRange = []
  const oneofDecl = []
  let options = null
  const reservedRange = []
  const reservedName = []

  for (const [_field, { data }] of reader(buf, byteOffset, byteLength)) {
    switch (_field) {
      case 1: name = types.string(data); break
      case 2: field.push(FieldDescriptorProto(data)); break
      case 6: extension.push(data); break
      case 3: nestedType.push(decode(data)); break
      case 4: enumType.push(EnumDescriptorProto(data)); break
      case 5: extensionRange.push(data); break
      case 8: oneofDecl.push(OneofDescriptorProto(data)); break
      case 7: options = MessageOptions(data); break
      case 9: reservedRange.push(data); break
      case 10: reservedName.push(data); break
    }
  }

  return {
    name,
    field,
    extension,
    nestedType,
    enumType,
    extensionRange,
    oneofDecl,
    options,
    reservedRange,
    reservedName
  }
}
