import path from 'node:path'

const workspaceRoot = process.cwd()
const notebooksRoot = path.resolve(workspaceRoot, 'content/notebooks')
const notebooksRootPrefix = `${notebooksRoot}${path.sep}`

const normalizeNotebookInput = (value: string): string | null => {
  const trimmed = value
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
  if (!trimmed || trimmed.startsWith('/')) return null

  if (trimmed.startsWith('content/notebooks/')) {
    return trimmed.slice('content/notebooks/'.length)
  }

  if (trimmed.startsWith('notebooks/')) {
    return trimmed.slice('notebooks/'.length)
  }

  return trimmed
}

export const resolveResearchNotebookPath = (value: string | null | undefined): string | null => {
  if (!value) return null

  const normalizedInput = normalizeNotebookInput(value)
  if (!normalizedInput) return null

  const absolutePath = path.resolve(notebooksRoot, normalizedInput)
  const extension = path.extname(absolutePath).toLowerCase()

  if (extension !== '.ipynb') return null
  if (absolutePath !== notebooksRoot && !absolutePath.startsWith(notebooksRootPrefix)) return null

  return absolutePath
}
