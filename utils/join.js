export default function (strings, ...pieces) {
  let str = strings[0]
  for (let i = 0; i < pieces.length; i++) {
    str += Array.isArray(pieces[i]) ? pieces[i].join('\n') : pieces[i]
    str += strings[i + 1]
  }

  return str
}
