#!/usr/bin/env node
import concat from '../utils/concat.js'
import { decode as CodeGeneratorRequest } from './messages/google/protobuf/compiler/code-generator-request.js'
import * as CodeGeneratorResponse from './messages/google/protobuf/compiler/code-generator-response.js'
import jsonish from './passes/json.js'
import remap from './passes/remap.js'
import codegen from './passes/codegen.js'
import recursive from './passes/recursive.js'
import * as prettier from 'prettier'

concat(process.stdin, (err, buf) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  const req = CodeGeneratorRequest(buf)

  const treeStruct = recursive(remap(req.protoFile))

  Promise.all(codegen(treeStruct).flat().map(formatFile))
    .then(files => {
      process.stdout.end(CodeGeneratorResponse.encode({
        supportedFeatures: 1,
        file: [
          {
            name: 'messages.json', content: jsonish(treeStruct)
          },
          ...files
        ]
      }))
    }, err => {
      console.error(err)
      process.exit(1)
    })
})

async function formatFile ({ name, content, type }) {
  return {
    name,
    content: await prettier.format(
      content,
      {
        semi: false,
        singleQuote: true,
        trailingComma: 'none',
        parser: type === 'javascript' ? 'babel' : 'typescript'
      }
    )
  }
}
