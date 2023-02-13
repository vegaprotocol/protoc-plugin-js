// d.ts helpers
export function union (...args) {
  return args.flat().join('|')
}

export function quote(str) {
  return `'${str}'`
}
