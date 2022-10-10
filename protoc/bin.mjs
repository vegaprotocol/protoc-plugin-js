#!/usr/bin/env node
import concat from '../utils/concat.mjs'
import { decode as CodeGeneratorRequest } from './messages/google/protobuf/compiler/code-generator-request.js'
import * as CodeGeneratorResponse from './messages/google/protobuf/compiler/code-generator-response.js'
import util from 'util'
import remap from './passes/remap.js'
import recursive from './passes/recursive.js'
import * as prettier from 'prettier'

concat(process.stdin, (err, buf) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  const req = CodeGeneratorRequest(buf)

  const res = CodeGeneratorResponse.encode({
    supportedFeatures: 1,
    file: [
      {
        name: 'messages.json', content: JSON.stringify(req, (key, value) => {
          if (ArrayBuffer.isView(value) || Buffer.isBuffer(value) || value?.type == 'Buffer') return { type: 'Unknown' }
          return value
        }, 2)
      },
      ...codegen(recursive(remap(req.protoFile)))
        .flat()
        .map(f => ({
          name: f.name,
          content: prettier.format(
            f.content,
            { semi: false, parser: f.type === 'javascript' ? 'babel' : 'typescript' }
          )
        }))
    ]
  })

  process.stdout.end(res)
})
