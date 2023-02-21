import join from '../../../utils/join.js'

export default function ({ message }) {
  return join`
    /// autogenerated by protoc-plugin-js
    import { ${message.name} } from '../${message.name}'
    export function encode(obj?: ${message.name},  buf?:  Uint8Array, byteOffset?: number): Uint8Array
  `
}
