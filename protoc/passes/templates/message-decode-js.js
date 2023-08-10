import join from '../../../utils/join.js'
import { requireCodecs, safeTypename } from '../helpers.js'

export default function ({ root, message }) {
  const fieldAssignments = new Map()

  return join`
    /// autogenerated by protoc-plugin-js
    const reader = require('protobuf-codec/decode/reader')
    ${requireCodecs(root, 'decode', message)}

    exports.decode = function decode (buf, byteOffset = 0, byteLength = buf.byteLength) {
      ${initials()}
      ${assignments()}
      ${returnValue()}
    }
  `

  /**
   * We keep all fields as variables so minifiers can make the names much smaller,
   * and then at the end of the decode function we assign them to a object with
   * the proper field names
   *
   * Add all variable initialisers:
   * 1. Determine if the field is reassignable
   * 2. Add the default value
   *
   * We do this in two steps:
   * 1. First we add all fields
   * 2. Then we add all oneof fields
   */
  function initials () {
    const res = []

    for (const f of message.fields) {
      if (f.oneofIndex != null) continue
      const name = 'field$' + f.name
      fieldAssignments.set(f.name, name)
      res.push(`${isConst(f) ? 'const' : 'let'} ${name} = ${defaultValue(f)}`)
    }

    for (const f of message.oneofs) {
      const name = 'field$' + f
      fieldAssignments.set(f, name)
      // Default value here should be `null`, but is decided by presence rules
      // in the `defaultValue` function
      res.push(`let ${name} = ${defaultValue({ oneofIndex: true })}`)
    }

    return res
  }

  /**
   * Assignment is done in a decoding loop over the binary message and switching on the field number.
   *
   * The variables we assign into are called "slots" and how the value is represented is called "container".
   *
   * Slot is either directly the field name or the oneof name it is part of
   * Container is either directly the primitive value or a wrapper object for oneofs
   *
   */
  function assignments () {
    const res = []

    for (const f of message.fields) {
      const isOneof = f.oneofIndex != null
      const isNestedMessage = f.messageType != null
      const isSelfRecursive = f.typeName == message.fullName

      // For primitive data types the API is eg `string(data)` while nested messages
      // have eg `NestedMessage.decode(data)`
      const decoder = (() => {
        if (isSelfRecursive) return 'decode(data)'
        if (isNestedMessage) return safeTypename(f) + '.decode(data)'
        return f.type + '(data)'
      })()

      // For oneofs we have multiple fields sharing the same variable (slot)
      const slot = fieldAssignments.get(isOneof ? message.oneofs[f.oneofIndex] : f.name)

      // Oneofs are nested objects like `oneofName = {field: value}`
      const container = isOneof ? `{${f.name}: ${decoder}}` : decoder

      res.push(`case ${f.number}:
        ${slot}${f.repeated ? `.push(${container})` : `= ${container}`}
        break
      `)
    }

    return join`for (const [field, { data }] of reader(buf, byteOffset, byteLength)) {
          switch (field) {
            ${res}
          }
        }`
  }

  // `{ variables }` return.
  function returnValue () {
    const res = []

    for (const f of message.fields) {
      if (f.oneofIndex != null) continue
      res.push(f.name + ':' + fieldAssignments.get(f.name))
    }

    for (const f of message.oneofs) {
      res.push(f + ':' + fieldAssignments.get(f))
    }

    return `return {${res.join(',')}}`
  }
}

function isConst (f) {
  // [] is the only "object" we do not overwrite
  if (f.repeated) return true
  return false
}

function defaultValue (f) {
  // "Explicit presence"
  if (f.oneofIndex != null) return 'null'
  if (f.optional) return 'null'
  if (f.repeated) return '[]'

  // Implied no presence
  switch (f.type) {
    case 'bool': return 'false'
    case 'enumerable':
      // Special case; we want to decode the default case to its string value
      // if one exists
      return safeTypename(f) + '.decode(0)'
    case 'uint32': return '0'
    case 'int32': return '0'
    case 'sint32': return '0'
    case 'uint64': return '0n'
    case 'int64': return '0n'
    case 'sint64': return '0n'

    case 'sfixed64': return '0n'
    case 'fixed64': return '0n'
    case 'double': return '0'

    case 'sfixed32': return '0'
    case 'fixed32': return '0'
    case 'float': return '0'

    case 'string': return "''"
    case 'message': return '{}'
    case 'bytes': return 'new Uint8Array(0)'
  }
}
