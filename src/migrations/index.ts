import * as migration_20260307_175654_add_notebook_support from './20260307_175654_add_notebook_support'

export const migrations = [
  {
    up: migration_20260307_175654_add_notebook_support.up,
    down: migration_20260307_175654_add_notebook_support.down,
    name: '20260307_175654_add_notebook_support',
  },
]
