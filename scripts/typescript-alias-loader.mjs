import { existsSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const projectRoot = dirname(dirname(new URL(import.meta.url).pathname))

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL && !extname(specifier)) {
    const basePath = fileURLToPath(new URL(specifier, context.parentURL))
    if (existsSync(`${basePath}.ts`)) {
      return {
        url: pathToFileURL(`${basePath}.ts`).href,
        shortCircuit: true,
      }
    }
  }

  if (!specifier.startsWith('@/')) return nextResolve(specifier, context)

  const basePath = join(projectRoot, specifier.slice(2))
  const resolvedPath = existsSync(basePath) ? basePath : `${basePath}.ts`
  return {
    url: pathToFileURL(resolvedPath).href,
    shortCircuit: true,
  }
}
