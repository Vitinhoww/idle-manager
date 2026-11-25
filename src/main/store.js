import fs from 'fs'
import path from 'path'
import { app } from 'electron'

export function createStore(defaults = {}) {
  const file = path.join(app.getPath('userData'), 'config.json')

  const read = () => {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'))
    } catch {
      return structuredClone(defaults)
    }
  }

  const write = (data) => {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
  }

  return {
    get: (key) => read()[key],
    set: (key, value) => { const d = read(); d[key] = value; write(d) },
    getAll: () => read()
  }
}
