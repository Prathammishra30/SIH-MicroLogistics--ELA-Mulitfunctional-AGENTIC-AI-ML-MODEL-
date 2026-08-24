import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Car,
  Route,
  IndianRupee,
  MapPin,
  ArrowRight,
  Plus,
  Eye,
} from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';

export const TransporterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const { t } = useLanguage();

  const userName = state.auth.user?.name || 'Transporter';

  const nearbyRequests = state.logisticsRequests.filter(
    (req) => req.status === 'Searching'
  );
  const activeTrips = state.logisticsRequests.filter(
    (req) => req.status === 'Assigned' || req.status === 'In Transit'
  );
  const availableVehicles = state.vehicles.filter(
    (v) => v.status === 'Available'
  ).length;

  const deliveredTrips = state.logisticsRequests.filter((req) => req.status === 'Delivered');
  const deliveredEarnings = deliveredTrips.reduce((sum, req) => {
    const numeric = parseInt(req.estimatedEarnings?.replace(/[^0-9]/g, '') || '1850', 10);
    return sum + (isNaN(numeric) ? 1850 : numeric);
  }, 0);
  const formattedEarnings = `₹${(deliveredEarnings).toLocaleString('en-IN')}`;

  const primaryVehicle = state.vehicles[0];

  return (
    <div className="space-y-6">
      
      {/* Full-width Header Banner (breaking out of container) */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-900 p-8 sm:p-12 -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 mb-20 shadow-xl min-h-[220px]">
        {/* Landscape Hero Image Background */}
        <div className="absolute inset-0 z-0">
          <img src="/images/transporter-truck.jpg" className="w-full h-full object-cover object-center opacity-50 mix-blend-overlay" alt="" />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-900/90 via-orange-900/60 to-transparent"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
            {t('dashboard.transporter.title') || 'Transporter Dispatch Control'} • {userName}
          </h1>
          <p className="text-sm sm:text-base text-orange-50 mt-2 max-w-xl font-medium drop-shadow-sm">
            {primaryVehicle
              ? `Primary Fleet: ${primaryVehicle.type} (${primaryVehicle.registration} • ${primaryVehicle.capacity})`
              : t('dashboard.transporter.subtitle') || 'Fleet operations overview, nearby farm pickup loads, and vehicle management.'}
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => navigate('/transporter/vehicles')}
            className="px-5 py-2.5 rounded-xl bg-white text-orange-800 hover:bg-orange-50 text-sm font-bold shadow-lg flex items-center gap-2 transition-colors cursor-pointer border border-orange-100"
          >
            <Plus className="w-4 h-4" />
            <span>{t('transporter.manageFleet') || 'Manage Fleet'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/transporter/trips')}
            className="px-5 py-2.5 rounded-xl bg-orange-800/50 hover:bg-orange-800/70 border border-orange-500/50 text-white backdrop-blur-sm text-sm font-bold shadow-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Route className="w-4 h-4" />
            <span>{t('dashboard.findLoads') || 'Find Loads'}</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary KPI Cards (Overlapping the Hero) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 -mt-32 relative z-20 mx-2 sm:mx-0">
        {/* Active Trips */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/5 space-y-2 transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.activeTrips') || 'Active Trips'}</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{activeTrips.length}</div>
          <span className="text-xs font-medium text-amber-600">{t('dashboard.currentlyEnRoute') || 'Currently en route'}</span>
        </div>

        {/* Available Vehicles */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/5 space-y-2 transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.availableFleet') || 'Available Fleet'}</span>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{availableVehicles}</div>
          <span className="text-xs font-medium text-green-600">{t('dashboard.readyForDispatch') || 'Ready for dispatch'}</span>
        </div>

        {/* Nearby Requests */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/5 space-y-2 transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.nearbyRequests') || 'Nearby Requests'}</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Route className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{nearbyRequests.length}</div>
          <span className="text-xs font-medium text-blue-600">{t('dashboard.eligiblePickupLoads') || 'Eligible pickup loads'}</span>
        </div>

        {/* Total Earnings */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/5 space-y-2 transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.totalRevenue') || 'Total Revenue'}</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{formattedEarnings}</div>
          <span className="text-xs font-medium text-emerald-600">{t('dashboard.freightEarnings') || 'Freight payout earnings'}</span>
        </div>
      </div>

      {/* Main Grid: Nearby Logistics Requests Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Nearby Logistics Requests</h2>
            <p className="text-xs text-gray-500">
              Unfulfilled farm harvest loads available for pickup and transport assignment
            </p>
          </div>
          <button
            onClick={() => navigate('/transporter/trips')}
            className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Trips</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {state.logisticsRequests.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-2">
            <Truck className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs text-gray-600 font-medium">No nearby logistics requests right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px] bg-gray-50/50">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Pickup Location</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-3">Required Capacity</th>
                  <th className="py-2.5 px-3">Estimated Earnings</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.logisticsRequests.slice(0, 6).map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-gray-900">
                      {req.productName}
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {req.quantity || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      <span className="flex items-center gap-1 text-gray-900">
                        <MapPin className="w-3 h-3 text-green-700 shrink-0" />
                        <span className="truncate max-w-[120px]">{req.pickupLocation || 'Farm Gate'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      <span className="flex items-center gap-1 text-gray-900">
                        <MapPin className="w-3 h-3 text-amber-700 shrink-0" />
                        <span className="truncate max-w-[120px]">{req.destination}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-600 font-mono">
                      {req.quantity?.includes('MT') ? req.quantity : '1.5 - 2.0 MT'}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#2E7D32] font-mono">
                      {req.estimatedEarnings || '₹0'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          req.status === 'Delivered'
                            ? 'bg-[#E8F5E9] text-[#2E7D32] border-green-200'
                            : req.status === 'In Transit'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : req.status === 'Assigned'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {req.status === 'Searching' ? (
                        <button
                          onClick={() => navigate(`/transporter/trips/${req.id}`)}
                          className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs"
                        >
                          Accept
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/transporter/trips/${req.id}`)}
                          className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Trip Progress Card if one is in progress */}
      {activeTrips.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <h3 className="text-sm font-bold text-gray-900">
                Live Dispatched Trip in Progress: Shipment #{activeTrips[0].id}
              </h3>
            </div>
            <button
              onClick={() => navigate(`/transporter/active/${activeTrips[0].id}`)}
              className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
            >
              Update Progress →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
            <div>
              <span className="text-gray-500">Cargo:</span>
              <strong className="text-gray-900 block">{activeTrips[0].productName} ({activeTrips[0].quantity})</strong>
            </div>
            <div>
              <span className="text-gray-500">Route:</span>
              <span className="text-gray-900 font-medium block truncate">
                {activeTrips[0].pickupLocation || 'Farm'} → {activeTrips[0].destination}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Current Status:</span>
              <span className="text-amber-800 font-bold block">{activeTrips[0].status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
