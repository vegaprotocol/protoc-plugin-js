import join from '../../../utils/join.js'

import { importCodecs, groupOneofs } from '../helpers.js'

export default function ({ root, message }) {
  return join`
    import Writer from 'protobuf-codec/encode/writer'
    ${importCodecs(root, 'encode', message)}

    export function encode (obj = {}, buf, byteOffset = 0) {
      const writer = new Writer()
      ${fields(message)}
      return writer.concat(buf, byteOffset)
    }

    // export function encodingLength (obj) {
    //   throw new Error('Unimplemented')
    // }
  `

  /**
   * An example to help digest the below; fields can be set in a number of ways that relate
   * both to how protobufs are encoded and how they should be presented in JS
   *
   * Oneof fields are nested under their field name eg. `inputData` has a `oneof command` which becomes
   *
   * ```
   * // Non-strict conditional since all falsy values happend to coincide with default values in protos
   * // and defaults should not be encoded on the wire. Only exception is repeated elements, where we
   * // encode the accessor as `field?.length` such that empty lists are not encoded
   * if (obj.command) {
   *   // alias to help the minifier compress
   *   const _o = obj.command
   *   // Again, loose accessor
   *   if (_o.transfer) writer.bytes(1012, Transfer.encode(_o.transfer))
   * }
   * ```
   */
  function fields (message) {
    const grouped = groupOneofs(message)

    const res = []
    for (const [key, fields] of grouped) {
      const isOneof = key !== ''
      const accessorPath = isOneof ? '_o' : 'obj'

      res.push(join`
        ${isOneof ? `if(obj.${key}) { const _o = obj.${key}; ` : ''}
        ${fields.map(field => {
          const accessor = `${accessorPath}.${field.name}`
          const codec = field.typeName?.replace(/\./g, '_') ?? field.type
          const isMessage = field.type === 'message'
          const isRepeated = field.repeated === true
          const elementAccessor = isRepeated ? 'v' : accessor

          const writerMethod = `writer.${field.wireType}`
          const writerArgs = [
            field.number,
            isMessage
              ? field.typeName !== message.fullName
                ? field.typeName.replace(/\./g, '_') + `.encode(${elementAccessor})`
                : `encode(${elementAccessor})`
              : elementAccessor
          ]

          if (!isMessage) writerArgs.push(codec)

          const writer = isRepeated
            ? `${accessor}.forEach(${elementAccessor} => ${writerMethod}(${writerArgs.join()}))`
            : `${writerMethod}(${writerArgs.join()})`
          return `if (${isRepeated ? accessor + '?.length' : accessor}) ${writer}`
        })}
        ${isOneof ? '}' : ''}
      `)
    }

    return res
  }
}
