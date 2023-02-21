/* eslint-disable camelcase */

import assert from 'nanoassert'
import * as path from 'path'

import { JS_EXTENSION, DTS_EXTENSION } from './constants.js'

import enumJs from './templates/enum-js.js'
import enumDTs from './templates/enum-d-ts.js'

import packageJs from './templates/package-js.js'
import packageDTs from './templates/package-d-ts.js'

import messageJs from './templates/message-js.js'
import messageDTs from './templates/message-d-ts.js'

import messageEncodeJs from './templates/message-encode-js.js'
import messageEncodeDTs from './templates/message-encode-d-ts.js'

import messageDecodeJs from './templates/message-decode-js.js'
import messageDecodeDTs from './templates/message-decode-d-ts.js'

export default function (packages) {
  return Array.from(packages.values(), p => packageFile('', p))
}

function packageFile (root, {
  name,
  messages,
  enums,
  packages
}) {
  const packagePath = path.join(root, name)

  const nestedEnums = enums.map(e => enumFile(packagePath, e))
  const nestedMessages = messages.map(m => messageFile(packagePath, m))
  const nestedPackages = Array.from(packages.values(), p => packageFile(packagePath, p))

  const rootFile = {
    name: (packagePath === '.' ? 'index' : packagePath) + JS_EXTENSION,
    identifier: name,
    type: 'javascript',
    content: packageJs({
      path: root,
      packages: nestedPackages.map(filterFileType('javascript')),
      enums: nestedEnums.map(filterFileType('javascript')),
      messages: nestedMessages.map(filterFileType('javascript'))
    })
  }

  const rootTypes = {
    name: (packagePath === '.' ? 'index' : packagePath) + DTS_EXTENSION,
    identifier: name,
    type: 'type-definition',
    content: packageDTs({
      path: root,
      // This is correct, we need to import the .js files and tsc will
      // resolve to the .d.ts files
      packages: nestedPackages.map(filterFileType('javascript')),
      enums: nestedEnums.map(filterFileType('javascript')),
      messages: nestedMessages.map(filterFileType('javascript'))
    })
  }

  return [
    rootFile,
    rootTypes,
    ...nestedPackages.flat(),
    ...nestedEnums.flat(),
    ...nestedMessages
  ].flat()
}

function messageFile (root, message) {
  // assert(message.map === false, 'codegen: Maps are unsupported (' + message.fullName + ')')

  const messagePath = path.join(root, message.name)

  const encodeFiles = messageEncodeFile(messagePath, message)
  const decodeFiles = messageDecodeFile(messagePath, message)
  const nestedEnums = message.enums.map(e => enumFile(messagePath, e))
  const nestedMessages = message.messages.map(m => messageFile(messagePath, m))

  const rootFile = [{
    name: messagePath + JS_EXTENSION,
    identifier: message.name,
    type: 'javascript',
    content: messageJs({
      path: root,
      message,
      encodeFile: filterFileType('javascript')(encodeFiles),
      decodeFile: filterFileType('javascript')(decodeFiles),
      nestedEnums: nestedEnums.map(filterFileType('javascript')),
      nestedMessages: nestedMessages.map(filterFileType('javascript')),
    })
  },
  {
    name: messagePath + DTS_EXTENSION,
    identifier: message.name,
    type: 'type-definition',
    content: messageDTs({
      path: root,
      message,
      encodeFile: filterFileType('javascript')(encodeFiles),
      decodeFile: filterFileType('javascript')(decodeFiles),
      nestedEnums: nestedEnums.map(filterFileType('javascript')),
      nestedMessages: nestedMessages.map(filterFileType('javascript')),
    })
  }]

  return [
    ...rootFile,
    ...encodeFiles,
    ...decodeFiles,

    ...nestedEnums,
    ...nestedMessages
  ]
}

function messageEncodeFile (root, message) {
  return [{
    name: path.join(root, 'encode' + JS_EXTENSION),
    type: 'javascript',
    content: messageEncodeJs({ root, message })
  }, {
    name: path.join(root, 'encode' + DTS_EXTENSION),
    type: 'type-definition',
    content: messageEncodeDTs({ message })
  }]
}

function messageDecodeFile (root, message) {
  return [{
    name: path.join(root, 'decode' + JS_EXTENSION),
    type: 'javascript',
    content: messageDecodeJs({ root, message })
  }, {
    name: path.join(root, 'decode' + DTS_EXTENSION),
    type: 'type-definition',
    content: messageDecodeDTs({ message })
  }]
}

function enumFile (root, enumt) {
  return [
    {
      name: path.join(root, enumt.name + JS_EXTENSION),
      identifier: enumt.name,
      type: 'javascript',
      content: enumJs({ name: enumt.name, values: enumt.values })
    },
    {
      name: path.join(root, enumt.name + DTS_EXTENSION),
      identifier: enumt.name,
      type: 'type-definition',
      content: enumDTs({ name: enumt.name, values: enumt.values })
    }
  ]
}

function filterFileType (type) {
  return function (n) {
    const identifier = n.find(f => f.type === type).identifier
    const path = n.find(f => f.type === type).name
    return {
      identifier, path
    }
  }
}
