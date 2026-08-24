import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Package,
  Truck,
  IndianRupee,
  Plus,
  ArrowRight,
  Eye,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';

export const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const { t } = useLanguage();

  const userName = state.auth.user?.name || 'Commercial Buyer';

  const activeProcurements = state.procurementRequests.filter(
    (pr) => pr.status !== 'Completed'
  );
  const openOrders = state.procurementRequests.filter(
    (pr) => pr.status === 'Open'
  );
  const incomingDeliveries = state.logisticsRequests.filter(
    (lr) => lr.status === 'In Transit' || lr.status === 'Assigned'
  );

  const totalSpend = activeProcurements.reduce((acc, pr) => {
    const qty = parseInt(pr.quantity, 10) || 500;
    const rate = parseInt(pr.targetPrice?.replace(/\D/g, '') || '30', 10);
    return acc + (qty * rate);
  }, 0);

  const formattedSpend = `₹${totalSpend.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      
      {/* Full-width Header Banner (breaking out of container) */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-900 p-8 sm:p-12 -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 mb-20 shadow-xl min-h-[220px]">
        {/* Landscape Hero Image Background */}
        <div className="absolute inset-0 z-0">
          <img src="/images/buyer-produce.jpg" className="w-full h-full object-cover object-center opacity-50 mix-blend-overlay" alt="" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/60 to-transparent"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
            {t('dashboard.buyer.title') || 'Procurement Operations'} • {userName}
          </h1>
          <p className="text-sm sm:text-base text-blue-50 mt-2 max-w-xl font-medium drop-shadow-sm">
            {t('dashboard.buyer.subtitle') || 'Manage bulk farm crop procurement requests, incoming deliveries, and wholesale demand.'}
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => navigate('/buyer/procurement')}
            className="px-5 py-2.5 rounded-xl bg-white text-blue-800 hover:bg-blue-50 text-sm font-bold shadow-lg flex items-center gap-2 transition-colors cursor-pointer border border-blue-100"
          >
            <Plus className="w-4 h-4" />
            <span>{t('nav.buyer.postProcurement') || 'Post Procurement'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/buyer/produce')}
            className="px-5 py-2.5 rounded-xl bg-blue-800/50 hover:bg-blue-800/70 border border-blue-500/50 text-white backdrop-blur-sm text-sm font-bold shadow-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>{t('buyer.browseProduce') || 'Browse Produce'}</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary KPI Cards (Overlapping the Hero) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 -mt-32 relative z-20 mx-2 sm:mx-0">
        {/* Active Procurements */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/5 space-y-2 transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.activeProcurements') || 'Active Procurements'}</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{activeProcurements.length}</div>
          <span className="text-xs font-medium text-blue-600">{t('dashboard.inSourcing') || 'In sourcing / fulfilling'}</span>
        </div>

        {/* Open Orders */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/5 space-y-2 transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.openOrders') || 'Open Orders'}</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{openOrders.length}</div>
          <span className="text-xs font-medium text-amber-600">{t('dashboard.awaitingFarmer') || 'Awaiting farmer match'}</span>
        </div>

        {/* Incoming Deliveries */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/5 space-y-2 transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.incomingDeliveries') || 'Incoming Deliveries'}</span>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{incomingDeliveries.length}</div>
          <span className="text-xs font-medium text-green-600">{t('dashboard.inTransitToDest') || 'In transit to destination'}</span>
        </div>

        {/* Total Spend */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/5 space-y-2 transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.committedVolume') || 'Committed Volume'}</span>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{formattedSpend}</div>
          <span className="text-xs font-medium text-gray-500">{t('dashboard.directSpend') || 'Direct procurement spend'}</span>
        </div>
      </div>

      {/* Main Table: Active Procurements */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Active Procurement Demands</h2>
            <p className="text-xs text-gray-500">
              Direct procurement orders broadcasted to regional farmer clusters
            </p>
          </div>
          <button
            onClick={() => navigate('/buyer/orders')}
            className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {state.procurementRequests.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-2">
            <Store className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs text-gray-600 font-medium">No procurement requests posted yet.</p>
            <button
              onClick={() => navigate('/buyer/procurement')}
              className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
            >
              Post your first bulk requirement →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px] bg-gray-50/50">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Required By</th>
                  <th className="py-2.5 px-3">Delivery Location</th>
                  <th className="py-2.5 px-3">Target Price</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.procurementRequests.map((pr) => (
                  <tr key={pr.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-gray-900">
                      {pr.product}
                    </td>
                    <td className="py-3.5 px-3 text-gray-700 font-mono">
                      {pr.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {pr.requiredBy || 'Immediate'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">
                      <span className="flex items-center gap-1 text-gray-900">
                        <MapPin className="w-3 h-3 text-blue-700 shrink-0" />
                        <span className="truncate max-w-[140px]">{pr.destination}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#2E7D32] font-mono">
                      {pr.targetPrice}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          pr.status === 'Completed'
                            ? 'bg-[#E8F5E9] text-[#2E7D32] border-green-200'
                            : pr.status === 'Fulfilling'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : pr.status === 'Logistics Requested'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {pr.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => navigate(`/buyer/orders/${pr.id}`)}
                        className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                        title="View Procurement Order"
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
    </div>
  );
};
