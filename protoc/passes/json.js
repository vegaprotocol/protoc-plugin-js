export default function (root) {
  return JSON.stringify(root.get(''), function (key, value) {
    if (value instanceof Map) return Object.fromEntries(value.entries())
    return value
  }, 2)
}

export function walk (k, pkg) {
  return {
    packages: Object.fromEntries(Array.from(pkg.packages.entries(), ([k, v]) => [k, walk(k, v)])),
    messages: pkg.messages,
    enums: pkg.enums
  }
}
