import * as migration_20260314_221000_add_people_roles from './20260314_221000_add_people_roles'
import * as migration_20260314_223500_people_role_assignments from './20260314_223500_people_role_assignments'
import * as migration_20260314_212500_standalone_announcements from './20260314_212500_standalone_announcements'

export const migrations = [
  {
    up: migration_20260314_212500_standalone_announcements.up,
    down: migration_20260314_212500_standalone_announcements.down,
    name: '20260314_212500_standalone_announcements',
  },
  {
    up: migration_20260314_221000_add_people_roles.up,
    down: migration_20260314_221000_add_people_roles.down,
    name: '20260314_221000_add_people_roles',
  },
  {
    up: migration_20260314_223500_people_role_assignments.up,
    down: migration_20260314_223500_people_role_assignments.down,
    name: '20260314_223500_people_role_assignments',
  },
]
