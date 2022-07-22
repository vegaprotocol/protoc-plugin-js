/* eslint-disable camelcase */
import assert from 'nanoassert'

/**
 * In this pass we assert that only features we intend to support are present
 * and map all the data structures to formats which are easier to process, eg.
 * remove unused properties, enrich the information on a specific field and
 * simplify enums
 */
export default function (files) {
  return files.map(file)
}

function file ({
  name,
  packageName,
  dependency,
  messageType,
  enumType,
  syntax,

  publicDependency,
  weakDependency,
  service,
  extension
}) {
  assert(typeof name === 'string', 'FileDescriptor.name required')

  assert(publicDependency.length === 0, 'FileDescriptor.publicDependency unsupported')
  assert(weakDependency.length === 0, 'FileDescriptor.weakDependency unsupported')
  assert(service.length === 0, 'FileDescriptor.service unsupported')
  assert(extension.length === 0, 'FileDescriptor.extension unsupported')

  assert(syntax === 'proto3', 'only proto3 syntax supported')

  return {
    name,
    packageName,
    syntax,
    dependencies: dependency,
    messages: messageType.map(fmessageType),
    enums: enumType.map(fenumType)
  }
}

function fmessageType ({
  name,
  field,
  extension,
  nestedType,
  enumType,
  extensionRange,
  oneofDecl,
  options,
  reservedRange,
  reservedName
}) {
  let map = false

  assert(extensionRange.length === 0, 'Descriptor.extensionRange unsupported')
  assert(extension.length === 0, 'Descriptor.extension unsupported')

  // We only care about message options in the case where they signal the
  // message being a Map
  if (options) {
    assert(options.messageSetWireFormat === false, 'Descriptor.options.messageSetWireFormat unsupported')
    assert(options.noStandardDescriptorAccessor === false, 'Descriptor.options.noStandardDescriptorAccessor unsupported')
    assert(options.deprecated === false, 'Descriptor.options.deprecated unsupported')
    assert(options.uninterpretedOption.length === 0, 'Descriptor.options.uninterpretedOption unsupported')
    map = !!options.mapEntry
  }

  return {
    name,
    map,
    oneofs: oneofDecl.map(oneofType),
    enums: enumType.map(fenumType),
    messages: nestedType.map(fmessageType),
    fields: field.map(fieldType)
  }
}

function oneofType ({ name, options }) {
  assert(options == null, 'OneofDescriptor.options unsupported')
  return name
}

function fieldType ({
  name,
  number,
  label,
  type,
  typeName,
  extendee,
  defaultValue,
  oneofIndex,
  jsonName,
  options,
  proto3Optional
}) {
  assert(extendee == null, 'FieldDescriptor.extendee unsupported')
  assert(options == null, 'FieldDescriptor.options unsupported')
  assert(defaultValue == null, 'FieldDecleration.defaultValue unsupported')

  const Repeated = labelToString(label) === 'REPEATED'
  const Type = typeToString(type)
  const wireType = typeToWireType(Type)
  const packed = Repeated && ['varint', 'fixed32', 'fixed64'].includes(wireType)

  assert(!packed, 'packed fields are currently unsupported')

  return {
    name: jsonName,
    number,
    type: Type,
    wireType,
    repeated: Repeated,
    packed,
    optional: proto3Optional,
    typeName,
    oneofIndex: oneofIndex
  }
}

function labelToString (number) {
  switch (number) {
    case 0: return assert(false, 'label type error (0)')
    case 1: return 'OPTIONAL' // assert(false, 'label type OPTIONAL (1) is proto2')
    case 2: return assert(false, 'label type REQUIRED (2) is proto2')
    case 3: return 'REPEATED'
    default: return assert(false, `label type unknown (${number})`)
  }
}

function typeToString (number) {
  switch (number) {
    case 0: return assert(false, 'field type error (0)')
    case 1: return 'double'
    case 2: return 'float'

    case 3: return 'int64'
    case 4: return 'uint64'

    case 5: return 'int32'
    case 6: return 'fixed64'
    case 7: return 'fixed32'
    case 8: return 'bool'
    case 9: return 'string'

    case 10: return assert(false, 'field type GROUP (10) unsupported')
    case 11: return 'message'

    case 12: return 'bytes'
    case 13: return 'uint32'
    case 14: return 'enum'
    case 15: return 'sfixed32'
    case 16: return 'sfixed64'
    case 17: return 'sint32'
    case 18: return 'sint64'

    default: return assert(false, `field type unknown (${number})`)
  }
}

function typeToWireType(type) {
  switch (type) {
    case 'bool':
    case 'enum':
    case 'uint32':
    case 'int32':
    case 'sint32':
    case 'uint64':
    case 'int64':
    case 'sint64': return 'varint'


    case 'sfixed64':
    case 'fixed64':
    case 'double': return 'fixed64'

    case 'sfixed32':
    case 'fixed32':
    case 'float': return 'fixed32'

    case 'string':
    case 'message':
    case 'bytes': return 'bytes'
  }
}

function fenumType ({ name, value, options, reservedRange, reservedName }) {
  assert(options == null, 'EnumDescriptor.options unsupported')

  return {
    name,
    values: value.map(enumValue)
  }
}

function enumValue ({ name, number, options }) {
  assert(options == null, 'EnumValueDescriptor.options unsupported')
  return { name, value: number }
}
