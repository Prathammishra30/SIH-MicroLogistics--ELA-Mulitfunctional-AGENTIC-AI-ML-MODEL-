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
    // Determine default login portal based on current path
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
    // Determine the user's correct dashboard
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
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
            <p className="text-sm text-slate-300">
              Your account is registered as <strong className="text-rose-400">{auth.user.role}</strong>. You do not have permission to view this section ({allowedRoles.join(', ')} only).
            </p>
          </div>

          <div className="pt-2">
            <a
              href={userRoleDashboard}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-rose-400 hover:bg-rose-300 transition-all shadow-lg shadow-rose-500/20"
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
