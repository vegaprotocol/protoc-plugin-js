import * as types from 'protobuf-codec/decode/types.js'
import reader from 'protobuf-codec/decode/reader.js'
import { decode as Version } from '../version.js'
import { decode as FileDescriptorProto } from '../../file-descriptor-proto/decode.js'

export function decode (
  buf,
  byteOffset = 0,
  byteLength = buf.byteLength
) {
  const fileToGenerate = []
  let parameter = null
  const protoFile = []
  let compilerVersion = null

  for (const [field, { data }] of reader(buf, byteOffset, byteLength)) {
    switch (field) {
      case 1: fileToGenerate.push(types.string(data)); break
      case 2: parameter = types.string(data); break
      case 15: protoFile.push(FileDescriptorProto(data)); break
      case 3: compilerVersion = Version(data); break
    }
  }

  return {
    fileToGenerate,
    parameter,
    protoFile,
    compilerVersion
  }
}
