type GenerateFileURLArgs = {
  filename: string
  prefix?: string
}

type UploadStorageConfigArgs = {
  basePrefix?: string | null
  publicURL?: string
  subdir?: string
}

export const normalizePathSegment = (value: string | null | undefined): string =>
  (value || '').trim().replace(/^\/+|\/+$/g, '')

export const joinStoragePath = (...segments: Array<string | null | undefined>): string =>
  segments
    .map((segment) => normalizePathSegment(segment))
    .filter(Boolean)
    .join('/')

export const joinPublicBaseAndPath = (baseURL: string, path: string): string => {
  const normalizedPath = normalizePathSegment(path)
  const normalizedBaseURL = baseURL.replace(/\/+$/, '')

  try {
    const url = new URL(normalizedBaseURL)
    const basePath = normalizePathSegment(url.pathname)
    const fullPath =
      basePath && normalizedPath !== basePath && !normalizedPath.startsWith(`${basePath}/`)
        ? `${basePath}/${normalizedPath}`
        : normalizedPath

    url.pathname = `/${fullPath}`
    return url.toString()
  } catch {
    return `${normalizedBaseURL}/${normalizedPath}`
  }
}

export const createS3GenerateFileURL =
  ({ basePrefix, publicURL, subdir }: UploadStorageConfigArgs) =>
  ({ filename, prefix }: GenerateFileURLArgs): string => {
    const resolvedPrefix = normalizePathSegment(prefix) || joinStoragePath(basePrefix, subdir)
    const encodedFilename = encodeURIComponent(filename)
    const pathname = resolvedPrefix ? `${resolvedPrefix}/${encodedFilename}` : encodedFilename

    return joinPublicBaseAndPath(publicURL || '', pathname)
  }

export const createS3CollectionConfig = ({
  basePrefix,
  publicURL,
  subdir,
}: UploadStorageConfigArgs):
  | true
  | { generateFileURL?: (args: GenerateFileURLArgs) => string; prefix?: string } => {
  const prefix = joinStoragePath(basePrefix, subdir)
  const generateFileURL = publicURL
    ? createS3GenerateFileURL({
        basePrefix,
        publicURL,
        subdir,
      })
    : undefined

  if (!prefix && !generateFileURL) {
    return true
  }

  return {
    ...(prefix ? { prefix } : {}),
    ...(generateFileURL ? { generateFileURL } : {}),
  }
}
