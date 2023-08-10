import join from '../../../utils/join.js'

import { requireCodecs, groupOneofs, safeTypename } from '../helpers.js'

export default function ({ root, message }) {
  return join`
    /// autogenerated by protoc-plugin-js
    const Writer = require('protobuf-codec/encode/writer')
    ${requireCodecs(root, 'encode', message)}

    exports.encode = function encode (obj = {}, buf, byteOffset = 0) {
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
   * Oneof fields are nested under their field name. Eg. `inputData` has a `oneof` `command` which becomes
   *
   * ```
   * // Non-strict conditional since all falsy values happend to coincide with default values in protos
   * // and defaults should not be encoded on the wire. Only exception is repeated elements, where we
   * // encode the accessor as `field?.length` such that empty lists are not encoded
   * if (obj.command?.transfer ?? obj.transfer) {
   *  writer.bytes(1012, Transfer.encode(obj.command?.transfer ?? obj.transfer))
   * }
   * ```
   *
   * Note that in the above, for compatibility reasons, you can also set the `oneof` field directly on the
   * top-level object. This is not recommended, but it is supported. For decoding this top-level field
   * will not be set but only the nested field will be available.
   */
  function fields (message) {
    const grouped = groupOneofs(message)

    const res = []
    for (const [key, fields] of grouped) {
      const isOneof = key !== ''

      res.push(join`
        ${fields.map(field => {
        const accessor = isOneof ? `(obj.${key}?.${field.name} ?? obj.${field.name})` : `obj.${field.name}`
        const codec = safeTypename(field) ?? field.type
        const isMessage = field.type === 'message'
        const isRepeated = field.repeated === true
        const isSelfRecursive = field.typeName === message.fullName
        const elementAccessor = isRepeated ? 'v' : accessor

        const writerMethod = `writer.${field.wireType}`
        const writerArgs = [
          field.number,
          isMessage
            ? !isSelfRecursive
              ? safeTypename(field) + `.encode(${elementAccessor})`
              : `encode(${elementAccessor})`
            : elementAccessor
        ]

        if (!isMessage) writerArgs.push(codec)

        const writer = isRepeated
          ? `${accessor}.forEach(${elementAccessor} => ${writerMethod}(${writerArgs.join()}))`
          : `${writerMethod}(${writerArgs.join()})`
        return `if (${isRepeated ? accessor + '?.length' : accessor}) ${writer}`
      })}
      `)
    }

    return res
  }
}
