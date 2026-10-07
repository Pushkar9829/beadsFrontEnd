import { useAuthStore } from '../../store/authStore';

export const STAFF_ROLES = ['admin', 'manager', 'staff'];
export const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', staff: 'Staff', customer: 'Customer' };

/**
 * Mirrors backend authorisation so the UI never offers an action the API will refuse.
 * Backend: every /api/admin route needs a staff role; store settings (payment/shipping keys)
 * and role/permission changes are admin-only.
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const isAdmin = role === 'admin';
  return {
    user,
    role,
    isAdmin,
    isStaff: STAFF_ROLES.includes(role),
    canManageSettings: isAdmin,
    canManageRoles: isAdmin,
  };
}
