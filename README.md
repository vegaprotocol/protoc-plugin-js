# `protoc-plugin-js`

> `protoc` plugin generating minimal JS codecs with typings and a focus on small bundle size

## Example

```sh
protoc \
  --plugin=protoc-gen-js="$(npm bin)/protoc-plugin-js" \
  --js_out="./build" \
  -I "vega/protos/sources" \
  vega/commands/v1/transaction.proto
```

## Main Ideas

Each package, namespace, message and enum is split into separate files to help
tree-shaking and minimise the final bundle size, if the user imports only the
messages needed.

All field names are transformed into their "JSON" form by `protoc`,
eg. `my_field` in protobuf will be `myField` in JS.

Currently merging is not supported.

### Encoding

Falsy values are not encoded as they coincide with default values in protobuf,
with the exception of `repeated` elements, which are checked against the length
of a possible array.

Unrecognised properties are not encoded as no mapping exists from an unknown
key to a `fieldNumber`.

`oneof`s are namespaced under the name of the `oneof`, eg.

```protobuf
message Example {
  oneof pick {
    uint32 before = 1;
    uint32 after = 2;
  }
}
```

can be set as `{ pick: { before: 2000 } }` or `{ pick: { after: 2000 } }`.
`{ pick: {} }` will encode to nothing, as none of the fields in the `oneof` are given.

#### Types

* `tag` is encoded as a pair of `fieldNumber` and `wireType`. `fieldNumber` can be at most 29 bits
* `bytes` and `string` are defined in the spec to be at most 2GB, however that is not validated currently
* `uint64`, `int64`, `uint32` and `int32` can be both encoded as `varint` and `fixed{32,64}`. This library encodes them as `varint` currently
* While not entirely clear in the spec, `varint` will encode up to 64 bits, even if the format could encode arbitrary size numbers
* `optional` values and unused `oneof`s are decoded as `null` to distinguish
them from `undefined` fields, as "explicit presence"

### Decoding

Decoding is done in three steps:

1. A `reader` will iterate over the full protobuf message, emitting a `key`/`value` pair for each `tag` encountered
2. `value`s are decoded based on their `wireType` into one of `varint`, `bytes`, `fixed64` or `fixed32`
3. The compiled decoder will switch based on the `fieldNumber` and apply a "view" based on the `type` given in the protobuf message file, eg. `string` will decode a `bytes` into a JS string, `sint64` will decode a `varint` and apply zig-zag decoding into a JS `BigInt`

Unknown fields and duplicate fields will still go through step 1 and 2, but may be discarded or overwrite a previous field in step 3.

Nested messages default to `{}` (empty object) since

## LICENSE

[MIT](LICENSE)
