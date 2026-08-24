import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  Truck,
  ArrowRight,
  Clock,
  Plus,
  IndianRupee,
  Eye,
} from 'lucide-react';
import { QuickActions } from '../../components/dashboards/QuickActions';
import type { QuickAction } from '../../components/dashboards/QuickActions';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';

export const FarmerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const { t } = useLanguage();

  const userName = state.auth.user?.name || 'Farmer';

  // Metrics calculations
  const totalProducts = state.products.length;
  const activeLogistics = state.logisticsRequests.filter(
    (lr) => lr.status === 'Assigned' || lr.status === 'In Transit'
  ).length;
  const pendingRequests = state.logisticsRequests.filter(
    (lr) => lr.status === 'Searching'
  ).length;

  // Earnings estimate based on completed or active transactions
  const totalEarningsVal = state.products.reduce((acc, p) => {
    const qty = parseInt(p.quantity, 10) || 0;
    return acc + (qty * 25);
  }, 0);

  const formattedEarnings = `₹${totalEarningsVal.toLocaleString('en-IN')}`;

  // Live buyer demands
  const liveBuyerDemands = state.procurementRequests.filter((pr) => pr.status === 'Open');

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'qa-1',
      label: 'Add Produce',
      icon: <Plus className="w-5 h-5" />,
      colorClass: 'bg-[#E8F5E9] text-[#2E7D32]',
      onClick: () => navigate('/farmer/products/new'),
    },
    {
      id: 'qa-2',
      label: 'My Products',
      icon: <Package className="w-5 h-5" />,
      colorClass: 'bg-[#E8F5E9] text-[#2E7D32]',
      onClick: () => navigate('/farmer/products'),
    },
    {
      id: 'qa-3',
      label: 'Request Transport',
      icon: <Truck className="w-5 h-5" />,
      colorClass: 'bg-amber-50 text-amber-800',
      onClick: () => navigate('/farmer/logistics'),
    },
    {
      id: 'qa-4',
      label: 'Market Demand',
      icon: <TrendingUp className="w-5 h-5" />,
      colorClass: 'bg-blue-50 text-blue-700',
      onClick: () => navigate('/farmer/markets'),
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Full-width Welcome Banner (breaking out of container) */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-900 p-8 sm:p-12 -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 mb-20 shadow-xl min-h-[220px]">
        {/* Landscape Hero Image Background */}
        <div className="absolute inset-0 z-0">
          <img src="/images/farmer-seedling.jpg" className="w-full h-full object-cover object-center opacity-60 mix-blend-overlay" alt="" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-green-900/60 to-transparent"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
            {t('dashboard.welcome') || 'Welcome back'}, {userName}
          </h1>
          <p className="text-sm sm:text-base text-green-50 mt-2 max-w-xl font-medium drop-shadow-sm">
            {t('dashboard.farmer.subtitle') || 'Agricultural operations overview, logistics status, and regional mandi demand.'}
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => navigate('/farmer/products/new')}
            className="px-5 py-2.5 rounded-xl bg-white text-green-800 hover:bg-green-50 text-sm font-bold shadow-lg flex items-center gap-2 transition-colors cursor-pointer border border-green-100"
          >
            <Plus className="w-4 h-4" />
            <span>{t('action.addProduce') || 'Add Produce'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/farmer/logistics')}
            className="px-5 py-2.5 rounded-xl bg-green-800/50 hover:bg-green-800/70 border border-green-500/50 text-white backdrop-blur-sm text-sm font-bold shadow-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>{t('farmer.bookLogistics') || 'Book Logistics'}</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary KPI Cards (Overlapping the Hero) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 -mt-32 relative z-20 mx-2 sm:mx-0">
        {/* Total Products */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/5 space-y-2 transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.totalProducts') || 'Total Products'}</span>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{totalProducts}</div>
          <span className="text-xs font-medium text-gray-500">{t('dashboard.listedInCatalog') || 'Listed in catalog'}</span>
        </div>

        {/* Active Logistics */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/5 space-y-2 transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.activeLogistics') || 'Active Logistics'}</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{activeLogistics}</div>
          <span className="text-xs font-medium text-amber-600">{t('dashboard.inTransit') || 'In transit / assigned'}</span>
        </div>
        
        {/* Pending Requests */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/5 space-y-2 transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.pendingRequests') || 'Pending Requests'}</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{pendingRequests}</div>
          <span className="text-xs font-medium text-gray-500">{t('dashboard.searchingVehicles') || 'Searching for vehicles'}</span>
        </div>

        {/* Est. Potential Value */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/5 space-y-2 transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.potentialValue') || 'Est. Value'}</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{formattedEarnings}</div>
          <span className="text-xs font-medium text-emerald-600">{t('dashboard.basedOnCatalog') || 'Based on active catalog'}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      {/* Main Grid: Active Logistics Table & Market Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent / Active Logistics Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recent & Active Logistics</h2>
              <p className="text-xs text-gray-500">Real-time status of your agricultural crop shipments</p>
            </div>
            <button
              onClick={() => navigate('/farmer/deliveries')}
              className="text-xs font-semibold text-[#2E7D32] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {state.logisticsRequests.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-2">
              <Truck className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-xs text-gray-600 font-medium">No active logistics requests yet.</p>
              <button
                onClick={() => navigate('/farmer/logistics')}
                className="text-xs font-bold text-[#2E7D32] hover:underline cursor-pointer"
              >
                Create your first transport request →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px] bg-gray-50/50">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Pickup → Dest</th>
                    <th className="py-2.5 px-3">Transporter</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {state.logisticsRequests.slice(0, 5).map((lr) => (
                    <tr key={lr.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-900">
                        {lr.productName}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {lr.quantity}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        <div className="font-medium text-gray-900 truncate max-w-[120px]">{lr.pickupLocation || 'Farm Gate'}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[120px]">→ {lr.destination}</div>
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {lr.driver ? (
                          <div>
                            <div className="font-medium text-gray-900">{lr.driver}</div>
                            <div className="text-[10px] text-gray-500">{lr.vehicle || 'Assigned'}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Searching driver...</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            lr.status === 'Delivered'
                              ? 'bg-[#E8F5E9] text-[#2E7D32] border-green-200'
                              : lr.status === 'In Transit'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : lr.status === 'Assigned'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {lr.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => navigate(`/farmer/deliveries/${lr.id}`)}
                          className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                          title="View Shipment Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Live Market Demand Opportunities */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Market Opportunities</h2>
              <p className="text-xs text-gray-500">Live demand from buyers & APMC mandis</p>
            </div>
            <button
              onClick={() => navigate('/farmer/markets')}
              className="text-xs font-semibold text-[#2E7D32] hover:underline cursor-pointer"
            >
              Explore
            </button>
          </div>

          <div className="space-y-3">
            {liveBuyerDemands.length > 0 ? (
              liveBuyerDemands.slice(0, 3).map((dem) => (
                <div
                  key={dem.id}
                  className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 hover:border-gray-300 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{dem.product}</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Buyer Order
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Target: <strong className="text-gray-900">{dem.targetPrice}</strong></span>
                    <span>Quantity: <strong className="text-gray-900">{dem.quantity}</strong></span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    Buyer: {dem.buyerName} • Delivery to {dem.destination}
                  </div>
                </div>
              ))
            ) : (
              state.marketOpportunities.slice(0, 3).map((opp) => (
                <div
                  key={opp.id}
                  className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 hover:border-gray-300 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{opp.demandItem}</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-green-50 text-[#2E7D32] border border-green-200">
                      Mandi Price
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Mandi Rate: <strong className="text-gray-900">{opp.price}</strong></span>
                    <span>Req: <strong className="text-gray-900">{opp.quantityRequired}</strong></span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    Destination: {opp.buyer}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/farmer/markets')}
              className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View All Market Demands</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
