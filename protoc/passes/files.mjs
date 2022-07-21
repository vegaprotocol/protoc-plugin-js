/* eslint-disable camelcase */

import assert from 'nanoassert'
import concatJson from '../utils/concat-json.mjs'
import * as path from 'path'
import { varint, wireTypes } from '../encode/wire-types.mjs'
import { default as j } from '../utils/join.mjs'

// concatJson(process.stdin, (err, json) => {
//   if (err) throw err

//   const remapped = json.map(file).flat()

//   process.stdout.write(JSON.stringify(remapped, null, 2))
// })

export function file({
  name,
  packageName,
  dependencies,
  messages,
  enums
}) {
  const root = packageName.split('.')
  root.unshift('.')

  return [
    ...enums.map(e => enumFile(root, e)),
    ...messages.map(m => messageFile(root, m)).flat()
  ].flat()
}

function messageFile(root, message) {
  root = [...root, message.name]

  const encodeFile = messageEncodeFile(root, message)
  const decodeFile = messageDecodeFile(root, message)
  const nestedEnums = message.enums.map(e => enumFile(root, e))
  const nestedMessages = message.messages.map(m => messageFile(root, m))

  const rootFileName = root.join('/') + '.mjs'
  const rootFile = {
    name: rootFileName,
    content: j`
      export * from './${path.relative([...root, '..'].join('/'), encodeFile.name)}'
      export * from './${path.relative([...root, '..'].join('/'), decodeFile.name)}'
      ${nestedEnums.map((n, i) =>
        `export * as ${message.enums[i].name} from './${path.relative([...root, '..'].join('/'), n.name)}'`)
      }

      ${nestedMessages.map((n, i) =>
        `export * as ${message.messages[i].name} from './${path.relative([...root, '..'].join('/'), n[0].name)}'`)
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
    name: [...root, 'encode.mjs'].join('/'),
    content: j`
      ${importLocal('Writer', 'encode/writer.mjs', root.join('/'))}
      ${importLocal('* as types', 'encode/types.mjs', root.join('/'))}
      ${resolveImports(root.join('/'), 'encode', message.fields)}

      export function encode (obj = {}, buf, byteOffset = 0) {
        const writer = new Writer()
        ${message.fields.map(field)}
        return writer.concat()
      }

      export function encodingLength (obj) {}
    `
  }

  function field(f) {
    assert(field.repeated === true ? field.packed === false : true, 'packed, repeated fields not yet supported')

    return `if (obj.${f.name}) writer.${f.wireType}(${f.number}, ${f.typeName?.split('.').at(-1) || 'types.' + f.type.toLowerCase() + '.encode'}(obj.${f.name}))`
  }
}

function messageDecodeFile(root, message) {
  return {
    name: [...root, 'decode.mjs'].join('/'),
    content: j`
      ${importLocal('reader', 'decode/reader.mjs', root.join('/'))}
      ${importLocal('* as types', 'decode/types.mjs', root.join('/'))}
      ${resolveImports(root.join('/'), 'decode', message.fields)}

      export function decode (buf, byteOffset = 0, byteLength = buf.byteLength) {
        ${message.fields.map(f => `const ${f.name} = null`)}
      }
    `
  }
}

function enumFile(root, enumt) {
  // Optimisation: encodingLength for groups of values, eg [0, 1, 2, 3], [1000, 1001, 1002]
  let maxValue = Math.max(...enumt.values.map(v => v.value))
  const encodingLength = varint.encodingLength(maxValue)
  const maxEncodingLength = varint.encodingLength(0xffff_ffff)
  const stringsMap = JSON.stringify(enumt.values.map(v => [v.value, v.name]), null, 2)

  return {
    name: [...root, enumt.name + '.mjs'].join('/'),
    content: `
      const strings = new Map(${stringsMap})

      export function encode (value, buf, byteOffset = 0) {
        return int32.encode(value, buf, byteOffset )
      }

      export function encodingLength (value) {
        if (value <= ${maxValue}) return ${encodingLength}
        return ${maxEncodingLength} // sint32 max value in case of unknown value
      }

      export function decode (buf, byteOffset = 0, byteLength = buf.byteLength) {
        return decodeInt32(buf, byteOffset, byteLength)
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
