import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  TrendingUp,
  Clock,
  LogOut,
  Sprout,
} from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/farmer/dashboard', icon: LayoutDashboard },
  { label: 'My Products', path: '/farmer/products', icon: Package },
  { label: 'Logistics Request', path: '/farmer/logistics', icon: Truck },
  { label: 'Market Demand', path: '/farmer/markets', icon: TrendingUp },
  { label: 'Deliveries', path: '/farmer/deliveries', icon: Clock },
];

export const FarmerLayout: React.FC = () => {
  const { state, logout } = useSharedContext();
  const navigate = useNavigate();
  const userName = state.auth.user?.name || 'Farmer';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col">
      {/* Sub-Navigation Role Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-0 gap-2 sm:gap-4">
            
            {/* Role & User Badge */}
            <div className="flex items-center gap-2.5 py-1.5 sm:py-3">
              <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] border border-green-200 flex items-center justify-center text-[#2E7D32]">
                <Sprout className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900">{userName}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-green-200">
                    Farmer
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 hidden sm:inline">Agricultural Producer Portal</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                        isActive
                          ? 'bg-[#E8F5E9] text-[#2E7D32]'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="ml-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-red-700 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <Outlet />
      </div>
    </div>
  );
};
