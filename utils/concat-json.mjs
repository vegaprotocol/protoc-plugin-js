import concat from './concat.mjs'

export default function (stream, cb) {
  return concat(stream, function (err, data) {
    if (err) return cb(err)
    let json
    try {
      json = JSON.parse(data)
    } catch (ex) {
      return cb(ex)
    }

    return cb(null, json)
  })
}
