import * as types from '../../../../../decode/types.mjs'
import reader from '../../../../../decode/reader.mjs'
import { decode as EnumDescriptorProto } from '../enum-descriptor-proto/decode.mjs'
import { decode as Type } from './type.mjs'
import { decode as Label } from './label.mjs'

export function decode(
  buf,
  byteOffset = 0,
  byteLength = buf.byteLength
) {
  let name = null
  let number = null
  let label = null
  let type = null
  let typeName = null
  let extendee = null
  let defaultValue = null
  let oneofIndex = null
  let jsonName = null
  let options = null
  let proto3Optional = null

  for (const [_field, { data }] of reader(buf, byteOffset, byteLength)) {
    switch (_field) {
      case 1: name = types.string(data); break
      case 3: number = types.int32(data); break
      case 4: label = Label(data); break
      case 5: type = Type(data); break
      case 6: typeName = types.string(data); break
      case 2: extendee = types.string(data); break
      case 7: defaultValue = types.string(data); break
      case 9: oneofIndex = types.int32(data); break
      case 10: jsonName = types.string(data); break
      case 8: options = data; break
      case 17: proto3Optional = types.bool(data); break
    }
  }

  return {
    name,
    number,
    label,
    type,
    typeName,
    extendee,
    defaultValue,
    oneofIndex,
    jsonName,
    options,
    proto3Optional
  }
}
