import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Spinner from './ui/Spinner';

export function RequireAuth({ children }) {
  const { user, loading } = useAuthStore();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { user, loading } = useAuthStore();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
