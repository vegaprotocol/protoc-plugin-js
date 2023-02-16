declare interface ProtoFile {
  name: string | null;
  packageName: string | null;
  dependency: string[];
  messageType: DescriptorProto[];
  enumType: EnumDescriptorProto[];
  service: Uint8Array[];
  extension: Uint8Array[];
  options: Uint8Array | null;
  sourceCodeInfo: Uint8Array | null;
  syntax: string | null;
}

declare interface DescriptorProto {
  name: string;
  field: FieldDescriptorProto[];
  extension: Uint8Array[];
  nestedType: DescriptorProto[];
  enumType: EnumDescriptorProto[];
  extensionRange: Uint8Array[];
  oneofDecl: OneofDescriptorProto[];
  options: MessageOptions;
  reservedRange: Uint8Array[];
  reservedName: Uint8Array[];
}

declare interface EnumDescriptorProto {
  name: string;
  value: EnumValueDescriptorProto[];
  options: Uint8Array | null;
  reservedRange: Uint8Array[];
  reservedName: Uint8Array[];
}

declare interface EnumValueDescriptorProto {
  name: string;
  number: Number;
  options: Uint8Array | null;
}

declare interface OneofDescriptorProto {
  name: string;
  options: Uint8Array | null;
}

declare interface MessageOptions {
  messageSetWireFormat: boolean;
  noStandardDescriptorAccessor: boolean;
  deprecated: boolean;
  mapEntry: boolean | null;
  uninterpretedOption: Uint8Array[];
}

declare interface FieldDescriptorProto {
  name: string;
  number: number;
  label: number | null;
}

declare interface TypeEnum {
  name: string;
  values: [{ name: string; value: number }];
}

declare interface TypeField {
  name: string;
  number: number;
  type: 'double' | 'float' | 'int64' | 'uint64' | 'int32' | 'fixed64' | 'fixed32' | 'bool' | 'string' | 'message' | 'bytes' | 'uint32' | 'enumerable' | 'sfixed32' | 'sfixed64' | 'sint32' | 'sint64';
  wireType: 'varint' | 'fixed64' | 'fixed32' | 'bytes';
  repeated: boolean;
  packed: boolean;
  optional: boolean;
  typeName: string;
  messageType: string | undefined;
  oneofIndex: number | undefined | null;
  oneofName: string | undefined | null;
}

declare interface TypeMessage {
  name: string;
  map: boolean;
  oneofs: string[];
  enums: TypeEnum[];
  messages: TypeMessage[];
  fields: TypeField[];
}

export default function (files: ProtoFile[]): [{
  name: string;
  packageName: string;
  syntax: 'proto3';
  dependencies: string[];
  messages: TypeMessage[];
  enums: TypeEnum[];
}]
