// Comptes internes : IT > Manager > Agent, puis partner et client.
// La valeur « admin » en base désigne l'Agent ; l'IT a tous les droits, le manager et l'agent n'ont que ceux qu'on leur donne.
const MANAGEABLE_ROLES = {
  it: ['it', 'manager', 'admin'],
  manager: ['manager', 'admin'],
  admin: [],
};

export const BACKOFFICE_ROLES = ['it', 'admin', 'manager'];
export const GOVERNANCE_ROLES = ['it', 'manager'];
export const IT_ROLES = ['it'];

export const PERMISSIONS = [
  'vehicles.create', 'vehicles.edit', 'vehicles.delete',
  'offers.create', 'offers.edit', 'offers.delete',
  'bookings.manage',
  'partners.manage', 'partners.delete',
  'accounts.create', 'accounts.edit', 'accounts.delete',
  'mailing.export', 'categories.manage', 'chats.manage', 'settings.manage',
];

export const DEFAULT_MANAGER_PERMISSIONS = {
  'vehicles.create': true, 'vehicles.edit': true, 'offers.create': true, 'offers.edit': true, 'bookings.manage': true, 'mailing.export': true, 'categories.manage': true, 'chats.manage': true,
};
// Un agent publie surtout de nouvelles offres : ce sont ses droits de départ.
export const DEFAULT_AGENT_PERMISSIONS = { 'vehicles.create': true, 'vehicles.edit': true, 'offers.create': true, 'offers.edit': true };

export function canManageRole(actorRole, targetRole) {
  return (MANAGEABLE_ROLES[actorRole] || []).includes(targetRole);
}

export function hasPermission(user, key) {
  if (user.role === 'it') return true;
  return (user.role === 'manager' || user.role === 'admin') && user.permissions?.[key] === true;
}

export function effectivePermissions(user) {
  return Object.fromEntries(PERMISSIONS.map(k => [k, hasPermission(user, k)]));
}

export function sanitizePermissions(input) {
  return Object.fromEntries(PERMISSIONS.filter(k => input?.[k] === true).map(k => [k, true]));
}
