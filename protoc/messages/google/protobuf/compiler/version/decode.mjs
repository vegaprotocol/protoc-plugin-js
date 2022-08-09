import * as types from 'protobuf-codec/decode/types.mjs'
import reader from 'protobuf-codec/decode/reader.mjs'

/**
 * The version number of protocol compiler.
 * @typedef {object} Version
 * @property {?number} major
 * @property {?number} minor
 * @property {?number} patch
 * @property {?string} suffix A suffix for alpha, beta or rc release, e.g., "alpha-1", "rc2". It should be empty for mainline stable releases.
 */

/**
 * @param {Uint8Array} buf
 * @param {number} byteOffset
 * @param {number} byteLength
 * @returns {Version}
 */
export function decode(
  buf,
  byteOffset = 0,
  byteLength = buf.byteLength
) {
  let major = null
  let minor = null
  let patch = null
  let suffix = null

  for (const [field, { data }] of reader(buf, byteOffset, byteLength)) {
    switch (field) {
      case 1: major = types.int32(data); break
      case 2: minor = types.int32(data); break
      case 3: patch = types.int32(data); break
      case 4: suffix = types.string(data); break
    }
  }

  return { major, minor, patch, suffix }
}
