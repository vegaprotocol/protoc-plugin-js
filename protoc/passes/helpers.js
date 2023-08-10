import path from 'path'
import { JS_EXTENSION } from './constants.js'

export function groupOneofs (message) {
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

/**
 * Transform dot-separated protobuf type names to JS safe identifiers.
 * Logic is simple, but made into a function to make purpose clear
 */
export function safeTypename (field) {
  return field.typeName?.replace(/\./g, '_')
}

export function requireCodecs (from, direction, message) {
  const imports = new Set()

  const primitiveTypes = new Set()

  for (const field of message.fields) {
    if (field.typeName == null) {
      primitiveTypes.add(field.type)
      continue
    }

    // prevent circular import
    if (field.typeName === message.fullName) continue

    // typeName is eg `vega.commands.v1.OracleSubmission`,
    // which we turn into `./vega/commands/v1/OracleSubmission`
    // enumerables we combine encoding and decoding in a single file, while
    // messages are split into a decode and encode part
    const typePath = '.' + field.typeName.replace(/\./g, '/') + (field.type === 'enumerable' ? '' : '/' + direction) + JS_EXTENSION

    const importPath = path.relative(from, typePath)

    imports.add(`const ${safeTypename(field)} = require('./${importPath}')`)
  }

  return [
    primitiveTypes.size > 0 ? `const {${[...primitiveTypes].join(', ')}} = require('protobuf-codec/${direction}/types')` : '',
    ...imports
  ]
}

export function importCodecs (from, direction, message) {
  const imports = new Set()

  const primitiveTypes = new Set()

  for (const field of message.fields) {
    if (field.typeName == null) {
      primitiveTypes.add(field.type)
      continue
    }

    // prevent circular import
    if (field.typeName === message.fullName) continue

    // typeName is eg `vega.commands.v1.OracleSubmission`,
    // which we turn into `./vega/commands/v1/OracleSubmission`
    // enumerables we combine encoding and decoding in a single file, while
    // messages are split into a decode and encode part
    const typePath = '.' + field.typeName.replace(/\./g, '/') + (field.type === 'enumerable' ? '' : '/' + direction) + JS_EXTENSION

    const importPath = path.relative(from, typePath)

    imports.add(`import * as ${safeTypename(field)} from './${importPath}'`)
  }

  return [
    primitiveTypes.size > 0 ? `import {${[...primitiveTypes].join(', ')}} from 'protobuf-codec/${direction}/types'` : '',
    ...imports
  ]
}

export function importTypes (from, message) {
  const imports = new Set()

  for (const field of message.fields) {
    if (field.typeName == null) continue
    if (field.typeName === message.fullName) continue

    // typeName is eg `vega.commands.v1.OracleSubmission`,
    // which we turn into `./vega/commands/v1/OracleSubmission`
    // enumerables we combine encoding and decoding in a single file, while
    // messages are split into a decode and encode part
    const typePath = '.' + field.typeName.replace(/\./g, '/')

    const importPath = path.relative(from, typePath)

    const importedIdentifier = field.messageTypeLocal == null ? field.messageType : `${field.messageType} as ${field.messageTypeLocal}`

    imports.add(`import type { ${importedIdentifier} } from './${importPath}'`)
  }

  return [
    ...imports
  ]
}
