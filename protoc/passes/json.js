export default function (root) {
  return JSON.stringify(root.get(''), function (key, value) {
    if (value instanceof Map) return Object.fromEntries(value.entries())
    return value
  }, 2)
}

export function re (k, pkg) {
  return {
    packages: Object.fromEntries(Array.from(pkg.packages.entries(), ([k, v]) => [k, re(k, v)])),
    messages: pkg.messages,
    enums: pkg.enums
  }
}
