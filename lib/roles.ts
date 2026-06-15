// Clerk organization role keys that should be treated as "admin" throughout
// the app. Some orgs use the default "org:admin" role key, others have a
// custom role keyed "admin" — both grant admin-level access here.
const ADMIN_ROLES = new Set(["org:admin", "admin"]);

export const isAdminRole = (role: string | null | undefined): boolean =>
  !!role && ADMIN_ROLES.has(role);
