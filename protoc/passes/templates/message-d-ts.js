import join from '../../../utils/join.js'
import { importTypes } from '../helpers.js'
import { relative } from 'path'

export default function ({ path, message, encodeFile, decodeFile, nestedEnums, nestedMessages }) {
  return join`
    ${importTypes(path, message)}

    export * from './${relative(path, encodeFile.path)}'
    export * from './${relative(path, decodeFile.path)}'
    ${nestedEnums.map(n =>
      `export * as ${n.identifier} from '${relative(path, n.path)}'`
    )}

    ${nestedMessages.map(n =>
      `export * as ${n.identifier} from '${relative(path, n.path)}'`
    )}

    export type ${message.name} = {
      ${typeFields(message)}
    }
  `
}

function typeFields (message) {
  const fieldGroups = group(message)

  const res = []
  for (const [name, field] of fieldGroups) {
    if (field.oneof === true) {
      res.push(kv(field.name, field.fields.map(f => br(kv(f.name, fieldType(f)))).concat('undefined').join('|')))
    } else {
      res.push(kv(field.name, fieldType(field)))
    }
  }

  return res.join(';')
  // return res

  function br (v) {
    return '{' + v + '}'
  }

  function kv (name, type) {
    return name + ': ' + type
  }
}

function group (msg) {
  const fields = new Map()

  for (const field of msg.fields) {
    if (field.oneofName != null) {
      const off = fields.get(field.oneofName) ?? { name: field.oneofName, oneof: true, fields: [] }
      off.fields.push(field)
      fields.set(off.name, off)
    } else {
      fields.set(field.name, field)
    }
  }

  return fields
}

function fieldType (f) {
  let primitiveType = f.messageType ?? tsType(f.type)
  if (f.repeated) primitiveType += '[]'

  if (f.optional) primitiveType += '| undefined'
  return primitiveType
}

function tsType (t) {
  switch (t) {
    case 'bool': return 'boolean'
    case 'enumerable': return 'number'
    case 'uint32': return 'number'
    case 'int32': return 'number'
    case 'sint32': return 'number'
    case 'uint64': return 'bigint'
    case 'int64': return 'bigint'
    case 'sint64': return 'bigint'

    case 'sfixed64': return 'bigint'
    case 'fixed64': return 'bigint'
    case 'double': return 'number'

    case 'sfixed32': return 'number'
    case 'fixed32': return 'number'
    case 'float': return 'number'

    case 'string': return 'string'
    case 'bytes': return 'Uint8Array'

    case 'message':
    default:
      assert('Unreachable: Missing protoc field type to TS type')
  }
}
