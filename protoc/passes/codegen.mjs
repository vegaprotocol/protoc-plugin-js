/* eslint-disable camelcase */

import assert from 'nanoassert'
import * as path from 'path'
import { enumerable } from 'protobuf-codec/encode/wire-types'
import { default as j } from '../../utils/join.js'

const EXTENSION = '.js'

export default function (packages) {
  return Array.from(packages.values(), p => packageFile('', p))
}

function packageFile(root, {
  name,
  messages,
  enums,
  packages
}) {
  const packagePath = path.join(root, name)

  const nestedEnums = enums.map(e => enumFile(packagePath, e))
  const nestedMessages = messages.map(m => messageFile(packagePath, m))
  const nestedPackages = Array.from(packages.values(), p => packageFile(packagePath, p))

  const rootFile = {
    name: (packagePath === '.' ? 'index' : packagePath) + EXTENSION,
    identifier: name,
    type: 'javascript',
    content: j`
      ${nestedPackages.map((n, i) =>
        `export * as ${n[0].identifier} from './${path.relative(root, n[0].name)}'`)
      }

      ${nestedEnums.map((n, i) =>
        `export * as ${n.identifier} from './${path.relative(root, n.name)}'`)
      }

      ${nestedMessages.map((n, i) =>
        `export * as ${n[0].identifier} from './${path.relative(root, n[0].name)}'`)
      }
    `
  }

  return [
    rootFile,
    ...nestedPackages.flat(),
    ...nestedEnums.flat(),
    ...nestedMessages
  ].flat()
}

function messageFile(root, message) {
  const messagePath = path.join(root, message.name)

  const encodeFile = messageEncodeFile(messagePath, message)
  const decodeFile = messageDecodeFile(messagePath, message)
  const nestedEnums = message.enums.map(e => enumFile(messagePath, e))
  const nestedMessages = message.messages.map(m => messageFile(messagePath, m))

  const rootFile = {
    name: messagePath + EXTENSION,
    identifier: message.name,
    type: 'javascript',
    content: j`
      export * from './${path.relative(root, encodeFile.name)}'
      export * from './${path.relative(root, decodeFile.name)}'
      ${nestedEnums.map(n =>
        `export * as ${n.identifier} from './${path.relative(root, n.name)}'`)
      }

      ${nestedMessages.map(n =>
        `export * as ${n[0].identifier} from './${path.relative(root, n[0].name)}'`)
      }
    `
  }

  return [
    rootFile,
    encodeFile,
    decodeFile,

    ...nestedEnums,
    ...nestedMessages
  ]
}

function messageEncodeFile(root, message) {
  return {
    name: path.join(root, 'encode' + EXTENSION),
    type: 'javascript',
    content: j`
      import Writer from 'protobuf-codec/encode/writer'
      ${importTypes(root, 'encode', message.fields)}

      export function encode (obj = {}, buf, byteOffset = 0) {
        const writer = new Writer()
        ${fields(message)}
        return writer.concat(buf, byteOffset)
      }

      // export function encodingLength (obj) {
      //   throw new Error('Unimplemented')
      // }
    `
  }

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
  function fields(message) {
    const grouped = groupOneofs(message)

    const res = []
    for (const [key, fields] of grouped) {
      const hasOneofKey = key !== ''
      const accessorPath = hasOneofKey ? '_o' : 'obj'

      res.push(j`
        ${hasOneofKey ? `if(obj.${key}) { const _o = obj.${key}; ` : ''}
        ${fields.map(field => {
          const accessor = `${accessorPath}.${field.name}`
          const codec = field.messageType ?? field.type
          const isMessage = field.type === 'message'
          const isRepeated = field.repeated === true
          const elementAccessor = isRepeated ? 'v' : accessor

          const writerMethod = `writer.${field.wireType}`
          const writerArgs = [
            field.number,
            isMessage ? field.messageType + `.encode(${elementAccessor})` : elementAccessor
          ]

          if (!isMessage) writerArgs.push(codec)


          const writer = isRepeated
            ? `${accessor}.forEach(${elementAccessor} => ${writerMethod}(${writerArgs.join()}))`
            : `${writerMethod}(${writerArgs.join()})`
          return `if (${isRepeated ? accessor + '?.length' : accessor}) ${writer}`
        })}
        ${hasOneofKey ? '}' : ''}
      `)
    }

    return res
  }
}

function messageDecodeFile(root, message) {
  return {
    name: path.join(root, 'decode' + EXTENSION),
    type: 'javascript',
    content: j`
      import reader from 'protobuf-codec/decode/reader'
      ${importTypes(root, 'decode', message.fields)}

      export function decode (buf, byteOffset = 0, byteLength = buf.byteLength) {
        ${message.fields.map(f => `${isConst(f) ? 'const' : 'let'} ${f.name} = ${defaultValue(f)}`)}
      }
    `
  }

  function isConst(f) {
    // [] is the only "object" we do not overwrite
    if (f.repeated) return true
    return false
  }

  function defaultValue(f) {
    if (f.oneofIndex != null) return 'null'
    if (f.optional) return 'null'
    if (f.repeated) return '[]'
    switch (f.type) {
      case 'bool': return 'false'
      case 'enumerable': return '0'
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
}

function groupOneofs(message) {
  if (message.oneofs.length == 0) return new Map([['', message.fields]])

  const groups = new Map()
  groups.set('', [])

  for (const field of message.fields) {
    if (field.oneofIndex == null) {
      groups.set('', groups.get('').concat(field))
      continue
    }

    const oneofName = message.oneofs[field.oneofIndex]
    const group = groups.get(oneofName) ?? []
    group.push(field)
    groups.set(oneofName, group)
  }

  return groups
}

function enumFile(root, enumt) {
  // Optimisation: "Dense" (string sequences without gaps) can be encoded as an array instead of map
  // Optimisation: Longest common prefix can be removed and deferred to the string step
  // Optimisation: encodingLength for groups of values, eg [0, 1, 2, 3], [1000, 1001, 1002]
  let maxValue = Math.max(...enumt.values.map(v => v.value))
  const encodingLength = enumerable.encodingLength(maxValue)
  const maxEncodingLength = enumerable.encodingLength(enumerable.MAX_VALUE)
  const stringsMap = JSON.stringify(enumt.values.flatMap(v => [[v.value, v.name], [v.name, v.value]]), null, 2)

  return {
    name: path.join(root, enumt.name + EXTENSION),
    identifier: enumt.name,
    type: 'javascript',
    content: j`
      import { enumerable } from 'protobuf-codec/encode/types'
      import { int32 as decodeEnumerable } from 'protobuf-codec/decode/types'

      const strings = new Map(${stringsMap})

      ${enumt.values.map(v => `export const ${v.name} = ${v.value}`)}

      export function encode (value, buf, byteOffset = 0) {
        if (typeof value === 'string') {
          const int = string(value)
          if (int == null) throw new Error(\`\${value} is not a valid value for ${enumt.name}\`)
          return encode(int, buf, byteOffset)
        }

        return enumerable.encode(value, buf, byteOffset)
      }

      export function encodingLength (value) {
        if (value <= ${maxValue}) return ${encodingLength}

        // enumerable max value in case of unknown value
        return ${maxEncodingLength}
      }

      export function decode (varint) {
        const int = decodeEnumerable(varint)
        return string(int) ?? int
      }

      export function string (value) {
        return strings.get(value)
      }
    `
  }
}

function importTypes(from, direction, fields) {
  let imports = new Set()

  const primitiveTypes = new Set()

  for (const field of fields) {
    if (field.typeName == null) {
      primitiveTypes.add(field.type)
      continue
    }

    // typeName is eg `vega.commands.v1.OracleSubmission`,
    // which we turn into `./vega/commands/v1/OracleSubmission`
    // enumerables we combine encoding and decoding in a single file, while
    // messages are split into a decode and encode part
    const typePath = '.' + field.typeName.replace(/\./g, '/') + (field.type === 'enumerable' ? '' : '/' + direction) + EXTENSION

    const importPath = path.relative(from, typePath)

    imports.add(`import * as ${field.messageType} from './${importPath}'`)
  }

  return [
    `import {${[...primitiveTypes].join(', ')}} from 'protobuf-codec/${direction}/types'`,
    ...imports
  ]
}
