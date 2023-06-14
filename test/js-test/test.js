import { test } from 'brittle'
import * as fixtures from '../build/fixtures.js'

test('test', async (assert) => {
  const preferNested = fixtures.core.Test.decode(fixtures.core.Test.encode({
    int: 1,

    string: 'one',
    bytes: new Uint8Array([1, 2, 3]),
    either: { string: 'two' },
  }))

  assert.is(preferNested.int, 1n)
  assert.is(preferNested.either.string, 'two', 'flat should be overridden by more specific')
  assert.is(preferNested.either.bytes, undefined, 'bytes should be excluded')

  const fallbackFlat = fixtures.core.Test.decode(fixtures.core.Test.encode({
    int: 1,
    string: 'one',
    bytes: new Uint8Array([1, 2, 3]),
  }))

  assert.is(fallbackFlat.int, 1n)
  assert.is(fallbackFlat.either.string, 'one', 'flat should be used when more specific is missing')
  assert.is(fallbackFlat.either.bytes, undefined, 'bytes should be excluded')
})
