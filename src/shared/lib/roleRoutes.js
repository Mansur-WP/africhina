export const roleHomePage = {
  buyer: '/dashboard',
  admin: '/admin',
  logistics: '/logistics',
  support: '/support',
};

export function isAuthorizedRole(role) {
  return ['buyer', 'admin', 'logistics', 'support'].includes(role);
}
