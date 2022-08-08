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

### Encoding

### Decoding


## LICENSE

[MIT](LICENSE)
