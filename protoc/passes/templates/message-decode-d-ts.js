import join from '../../../utils/join.js'

export default function ({ message }) {
  return join`
    import { ${message.name} } from '../${message.name}'
    export function decode (buf: Uint8Array, byteOffset?: number, byteLength?: number): ${message.name}
  `
}
