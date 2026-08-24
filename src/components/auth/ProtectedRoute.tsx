import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSharedContext } from '../../context/SharedContext';
import type { UserRole } from '../../services/api';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  redirectPath?: string;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectPath,
  children,
}) => {
  const { state } = useSharedContext();
  const location = useLocation();
  const { auth } = state;

  // 1. Unauthenticated Check
  if (!auth.isAuthenticated || !auth.token || !auth.user) {
    let defaultLogin = redirectPath;
    if (!defaultLogin) {
      if (location.pathname.startsWith('/farmer')) {
        defaultLogin = '/auth/farmer';
      } else if (location.pathname.startsWith('/buyer')) {
        defaultLogin = '/auth/buyer';
      } else if (location.pathname.startsWith('/transporter')) {
        defaultLogin = '/auth/transporter';
      } else {
        defaultLogin = '/';
      }
    }

    return <Navigate to={defaultLogin} state={{ from: location }} replace />;
  }

  // 2. Role-Based Access Check
  const hasAllowedRole =
    allowedRoles.includes(auth.user.role) || auth.user.role === 'ADMIN';

  if (!hasAllowedRole) {
    const userRoleDashboard =
      auth.user.role === 'FARMER'
        ? '/farmer/dashboard'
        : auth.user.role === 'BUYER'
        ? '/buyer/dashboard'
        : auth.user.role === 'TRANSPORTER'
        ? '/transporter/dashboard'
        : '/';

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-red-200 shadow-sm text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Access Restricted</h2>
            <p className="text-sm text-gray-600">
              Your account is registered as <strong className="text-red-700">{auth.user.role}</strong>. You do not have permission to view this section ({allowedRoles.join(', ')} only).
            </p>
          </div>

          <div className="pt-2">
            <a
              href={userRoleDashboard}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-red-600 hover:bg-red-700 transition-colors shadow-2xs"
            >
              <span>Go to Your {auth.user.role} Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Render children or Outlet
  return children ? <>{children}</> : <Outlet />;
};
