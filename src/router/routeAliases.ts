export const createAliases = (bases: string[], ...suffixes: string[]) =>
  bases.flatMap((base) => suffixes.map((suffix) => `${base}${suffix}`))

export const createPluralRouteAliases = (pluralBase: string, aliasBases: string[], suffixes: string[]) => [
  ...suffixes.slice(1).map((suffix) => `${pluralBase}${suffix}`),
  ...createAliases(aliasBases, ...suffixes),
]

export const workspaceAliasBases = ['/workspace']
export const workspaceDetailRouteSuffixes = ['/:alias', '/:alias/file', '/:alias/@@file']
export const workspaceDetailCommitSuffixes = ['/:alias/file/:commitId', '/:alias/@@file/:commitId']
export const workspaceFileRouteSuffixes = [
  '/:alias/file/:commitId/:path(.+)',
  '/:alias/file/:commitId/:path(.+)',
  '/:alias/@@file/:commitId/:path(.+)',
  '/:alias/@@file/:commitId/:path(.+)',
]

export const exposureAliasBases = ['/exposure', '/e']
export const exposureFileRouteSuffixes = [
  '/:alias/:file',
  '/:alias/experiments/cell/:file',
  '/:alias/experiments/channel/:file',
  '/:alias/models/channels/:file',
  '/:alias/models/:file',
]

export const exposureFileViewRouteSuffixes = [
  '/:alias/:file/:view',
  '/:alias/experiments/cell/:file/:view',
  '/:alias/experiments/channel/:file/:view',
  '/:alias/models/channels/:file/:view',
  '/:alias/models/:file/:view',
]
