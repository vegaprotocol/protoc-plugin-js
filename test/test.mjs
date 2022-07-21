import * as InputData from './build/vega/commands/v1/InputData.mjs'
import * as Transaction from './build/vega/commands/v1/Transaction.mjs'

const inputData = InputData.encode({
  nonce: 10
})

const tx = Transaction.encode({
  inputData,
  version: 3,
  from: {
    pubKey: new Uint8Array(86)
  },
  signature: {
    version: 2,
    algo: 'vega/ed25519',
    value: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
  },
  proofOfWork: {
    hashFunction: 'sha3_24_rounds',
    tid: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
  }
})

console.log(tx)
