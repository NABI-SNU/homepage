import * as migration_20260314_212500_standalone_announcements from './20260314_212500_standalone_announcements'

export const migrations = [
  {
    up: migration_20260314_212500_standalone_announcements.up,
    down: migration_20260314_212500_standalone_announcements.down,
    name: '20260314_212500_standalone_announcements',
  },
]
