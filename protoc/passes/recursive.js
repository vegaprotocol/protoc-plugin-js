export default function recurse (files) {
  return files.reduce((pkg, file) => {
    let toplevel = pkg.get('')
    if (file.packageName) {
      for (const sub of file.packageName.split('.')) {
        const tmp = toplevel.packages.get(sub) ?? makeNamespace(sub)
        toplevel.packages.set(sub, tmp)
        toplevel = tmp
      }
    }

    if (file.enums) toplevel.enums.push(...file.enums)
    if (file.messages) toplevel.messages.push(...file.messages)

    return pkg
  }, new Map([['', makeNamespace('')]]))
}

function makeNamespace (name) {
  return { name, packages: new Map(), enums: [], messages: [] }
}
