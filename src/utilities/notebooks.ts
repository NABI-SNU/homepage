export type NotebookContent = {
  cells: unknown[]
  metadata?: Record<string, unknown>
  nbformat: number
  nbformat_minor?: number
}

type UploadLike = {
  id?: number | null
  filename?: string | null
  url?: string | null
}

export const isNotebookContent = (value: unknown): value is NotebookContent => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<NotebookContent>

  return typeof candidate.nbformat === 'number' && Array.isArray(candidate.cells)
}

export const parseNotebookContent = (value: string): NotebookContent | null => {
  try {
    const parsed = JSON.parse(value) as unknown
    return isNotebookContent(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const getUploadDoc = <T extends UploadLike>(
  value: number | T | null | undefined,
): T | null => {
  if (!value || typeof value !== 'object') return null
  return value as T
}

export const getUploadID = (value: number | UploadLike | null | undefined): number | null => {
  if (typeof value === 'number') return value
  if (!value || typeof value !== 'object') return null
  return typeof value.id === 'number' ? value.id : null
}
