export function isStaff(user) {
  return ['admin', 'manager', 'staff'].includes(user?.role);
}
