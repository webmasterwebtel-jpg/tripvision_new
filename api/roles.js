// Comptes : it > admin > manager (équipe interne), puis partner et client.
// Un manager ne gère des comptes manager que si on lui en donne la permission.
const MANAGEABLE_ROLES = {
  it: ['it', 'admin', 'manager'],
  admin: ['manager'],
  manager: ['manager'],
};

export const BACKOFFICE_ROLES = ['it', 'admin', 'manager'];
export const GOVERNANCE_ROLES = ['it', 'admin'];
export const IT_ROLES = ['it'];

export const PERMISSIONS = [
  'vehicles.create', 'vehicles.edit', 'vehicles.delete',
  'offers.create', 'offers.edit', 'offers.delete',
  'bookings.manage',
  'partners.manage', 'partners.delete',
  'accounts.create', 'accounts.edit', 'accounts.delete',
  'mailing.export', 'categories.manage', 'chats.manage',
];

export const DEFAULT_MANAGER_PERMISSIONS = {
  'vehicles.create': true, 'vehicles.edit': true, 'offers.create': true, 'offers.edit': true, 'bookings.manage': true, 'mailing.export': true, 'categories.manage': true,
};

export function canManageRole(actorRole, targetRole) {
  return (MANAGEABLE_ROLES[actorRole] || []).includes(targetRole);
}

export function hasPermission(user, key) {
  if (user.role === 'it' || user.role === 'admin') return true;
  return user.role === 'manager' && user.permissions?.[key] === true;
}

export function effectivePermissions(user) {
  return Object.fromEntries(PERMISSIONS.map(k => [k, hasPermission(user, k)]));
}

export function sanitizePermissions(input) {
  return Object.fromEntries(PERMISSIONS.filter(k => input?.[k] === true).map(k => [k, true]));
}
