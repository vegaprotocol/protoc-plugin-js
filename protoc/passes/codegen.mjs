/* eslint-disable camelcase */

import assert from 'nanoassert'
import * as path from 'path'
import { enumerable } from '../../encode/wire-types.mjs'
import { default as j } from '../../utils/join.mjs'

export default function (files) {
  return files.map(file)
}

function file({
  name,
  packageName,
  dependencies,
  messages,
  enums
}) {
  const packagePath = packageName.replace(/\./g, '/')

  return [
    ...enums.map(e => enumFile(packagePath, e)),
    ...messages.map(m => messageFile(packagePath, m)).flat()
  ].flat()
}

function messageFile(root, message) {
  const messagePath = path.join(root, message.name)

  const encodeFile = messageEncodeFile(messagePath, message)
  const decodeFile = messageDecodeFile(messagePath, message)
  const nestedEnums = message.enums.map(e => enumFile(messagePath, e))
  const nestedMessages = message.messages.map(m => messageFile(messagePath, m))

  const rootFile = {
    name: messagePath + '.mjs',
    content: j`
      export * from './${path.relative(root, encodeFile.name)}'
      export * from './${path.relative(root, decodeFile.name)}'
      ${nestedEnums.map((n, i) =>
        `export * as ${message.enums[i].name} from './${path.relative(root, n.name)}'`)
      }

      ${nestedMessages.map((n, i) =>
        `export * as ${message.messages[i].name} from './${path.relative(root, n[0].name)}'`)
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
    name: path.join(root, 'encode.mjs'),
    content: j`
      ${importLocal('Writer', 'encode/writer.mjs', root)}
      ${importLocal('* as types', 'encode/types.mjs', root)}
      ${resolveImports(root, 'encode', message.fields)}

      export function encode (obj = {}, buf, byteOffset = 0) {
        const writer = new Writer()
        ${message.fields.map(field)}
        return writer.concat()
      }

      export function encodingLength (obj) {}
    `
  }

  function field(f) {
    return `if (obj.${f.name}) writer.${f.wireType}(${f.number}, ${f.typeName?.split('.').at(-1) || 'types.' + f.type.toLowerCase() + '.encode'}(obj.${f.name}))`
  }
}

function messageDecodeFile(root, message) {
  return {
    name: path.join(root, 'decode.mjs'),
    content: j`
      ${importLocal('reader', 'decode/reader.mjs', root)}
      ${importLocal('* as types', 'decode/types.mjs', root)}
      ${resolveImports(root, 'decode', message.fields)}

      export function decode (buf, byteOffset = 0, byteLength = buf.byteLength) {
        ${message.fields.map(f => `const ${f.name} = null`)}
      }
    `
  }
}

function enumFile(root, enumt) {
  // Optimisation: "Dense" (string sequences without gaps) can be encoded as an array instead of map
  // Optimisation: Longest common prefix can be removed and deferred to the string step
  // Optimisation: encodingLength for groups of values, eg [0, 1, 2, 3], [1000, 1001, 1002]
  let maxValue = Math.max(...enumt.values.map(v => v.value))
  const encodingLength = enumerable.encodingLength(maxValue)
  const maxEncodingLength = enumerable.encodingLength(enumerable.MAX_VALUE)
  const stringsMap = JSON.stringify(enumt.values.map(v => [v.value, v.name]), null, 2)

  return {
    name: path.join(root, enumt.name + '.mjs'),
    content: `
      ${importLocal(`{ enumerable }`, 'encode/types.mjs')}
      ${importLocal(`{ int32 as decodeEnumerable }`, 'decode/types.mjs')}
      const strings = new Map(${stringsMap})

      export function encode (value, buf, byteOffset = 0) {
        return enumerable.encode(value, buf, byteOffset )
      }

      export function encodingLength (value) {
        if (value <= ${maxValue}) return ${encodingLength}
        return ${maxEncodingLength} // enumerable max value in case of unknown value
      }

      export function decode (varint) {
        return decodeEnumerable(varint)
      }

      export function string (value) {
        return strings.get(value)
      }
    `
  }
}

function importLocal(obj, from) {
  return `import ${obj} from '${path.join(new URL(import.meta.url).pathname, '../..', from)}'`
}

function resolveImports(from, direction, fields) {
  let imports = new Set()

  const primitiveTypes = new Set()

  for (const field of fields) {
    if (field.typeName == null) {
      primitiveTypes.add(field.type)
      continue
    }
    const typeName = field.typeName.split('.').at(-1)
    const typePath = '.' + field.typeName.replace(/\./g, '/') + (field.type === 'enum' ? '' : '/' + direction) + '.mjs'
    const importPath = path.relative(from, typePath)

    imports.add(`import { ${direction} as ${typeName} } from './${importPath}'`)
  }

  return Array.from(imports.values())
}
