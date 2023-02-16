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

  const res = CodeGeneratorResponse.encode({
    supportedFeatures: 1,
    file: [
      {
        name: 'messages.json', content: jsonish(treeStruct)
      },
      ...codegen(treeStruct)
        .flat()
        .map(f => {
          return {
            name: f.name,
            content: prettier.format(
              f.content,
              {
                semi: false,
                singleQuote: true,
                trailingComma: 'none',
                parser: f.type === 'javascript' ? 'babel' : 'typescript'
              }
            )
          }
        })
    ]
  })

  process.stdout.end(res)
})
