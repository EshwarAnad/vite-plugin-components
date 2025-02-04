import { Transform } from 'vite'
import Debug from 'debug'
import { Context } from '../context'
import { pascalCase, stringifyComponentImport } from '../utils'

const debug = Debug('vite-plugin-components:transform:script-setup')

export function VueScriptSetupTransformer(ctx: Context): Transform {
  return {
    test({ path, query }) {
      return path.endsWith('.vue')
        && query.type === 'script'
        && (Boolean(query.setup) || query.setup === '')
    },
    transform({ code, path, isBuild }) {
      const sfcPath = ctx.normalizePath(path)
      debug(sfcPath)

      const head: string[] = []
      let id = 0

      let transformed = code.replace(/_resolveComponent\("(.+?)"\)/g, (str, match) => {
        if (match) {
          debug(`name: ${match}`)
          const component = ctx.findComponent(pascalCase(match), [sfcPath])
          if (component) {
            const var_name = `__vite_component_${id}`
            head.push(stringifyComponentImport({ ...component, name: var_name }))
            id += 1
            return var_name
          }
        }
        return str
      })

      transformed = `${head.join('\n')}\n${transformed}`

      // debug(transformed)

      if (isBuild)
        ctx.setImports(sfcPath, [])

      return transformed
    },
  }
}
