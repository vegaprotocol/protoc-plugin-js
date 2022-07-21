export default function concat (s, cb) {
  const chunks = []
  s.on('data', ondata)
  s.once('error', onerror)
  s.once('end', onend)

  function onerror (err) { done(err) }
  function ondata (ch) { chunks.push(ch) }
  function onend () { done(null, Buffer.concat(chunks)) }

  function done (err, data) {
    s.off('data', ondata)
    s.off('error', onerror)

    return cb(err, data)
  }
}
