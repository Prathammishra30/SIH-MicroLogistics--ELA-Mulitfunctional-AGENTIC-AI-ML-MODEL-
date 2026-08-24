import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  TrendingUp,
  Package,
  Truck,
  ArrowRight,
  LogOut,
  Layers,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Home,
  Plus
} from 'lucide-react';
import { QuickActions } from '../../components/dashboards/QuickActions';
import type { QuickAction } from '../../components/dashboards/QuickActions';
import { useSharedContext } from '../../context/SharedContext';

export const FarmerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state, logout } = useSharedContext();

  const userName = state.auth.user?.name || 'Farmer';

  // Combine open buyer procurements with market opportunities
  const liveBuyerDemands = state.procurementRequests.filter(pr => pr.status === 'Open');
  const allDemandsCount = liveBuyerDemands.length + state.marketOpportunities.length;

  const topOpportunities = [
    ...liveBuyerDemands.map(pr => ({
      id: pr.id,
      name: `${pr.product} (${pr.quantity})`,
      price: pr.targetPrice,
      source: `${pr.buyerName} • ${pr.destination}`,
      badge: 'Live Buyer Demand',
      isLive: true
    })),
    ...state.marketOpportunities.map(mo => ({
      id: mo.id,
      name: mo.demandItem,
      price: mo.price,
      source: `${mo.buyer} • Requires ${mo.quantityRequired}`,
      badge: 'Regional Mandi',
      isLive: false
    }))
  ];

  const activeShipment = state.logisticsRequests.find(lr => lr.status !== 'Delivered') || state.logisticsRequests[0];

  // Dynamic recent activities based on actual user events
  const dynamicActivities = [
    ...state.notifications.map(n => ({
      id: `notif-${n.id}`,
      title: n.message,
      subtitle: 'System Notification • Real-Time Update',
      type: n.type === 'success' ? 'success' : n.type === 'warning' ? 'warning' : 'info'
    })),
    ...state.logisticsRequests.map(lr => ({
      id: `lr-${lr.id}-${lr.status}`,
      title: `Shipment #${lr.id} ${lr.status === 'Delivered' ? 'Delivered & Verified' : lr.status === 'In Transit' ? 'In Transit to Market' : lr.status === 'Assigned' ? 'Transporter Assigned' : 'Logistics Requested'}`,
      subtitle: `${lr.productName} (${lr.quantity || 'Load'}) • ${lr.driver ? `Driver: ${lr.driver}` : 'Awaiting Driver'} • ${lr.destination}`,
      type: lr.status === 'Delivered' ? 'success' : lr.status === 'In Transit' ? 'info' : 'warning'
    })),
    ...state.procurementRequests.filter(pr => pr.status === 'Fulfilling' || pr.status === 'Logistics Requested').map(pr => ({
      id: `pr-${pr.id}`,
      title: `Demand Fulfilled: ${pr.product} (${pr.quantity})`,
      subtitle: `Buyer: ${pr.buyerName} • Target: ${pr.destination}`,
      type: 'success'
    })),
    ...state.products.slice(0, 2).map(p => ({
      id: `prd-${p.id}`,
      title: `Product Listed: ${p.name} (${p.quantity})`,
      subtitle: `${p.category} • ${p.grade} • Harvest: ${p.harvestDate}`,
      type: 'info'
    }))
  ];

  const recentActivities = dynamicActivities.slice(0, 3);

  const quickActions: QuickAction[] = [
    { id: 'qa-1', label: 'Add Product', icon: <Plus className="w-5 h-5" />, colorClass: 'bg-emerald-500/20 text-emerald-400', onClick: () => navigate('/farmer/products/new') },
    { id: 'qa-2', label: 'My Products', icon: <Package className="w-5 h-5" />, colorClass: 'bg-emerald-500/20 text-emerald-400', onClick: () => navigate('/farmer/products') },
    { id: 'qa-3', label: 'Market Demand', icon: <TrendingUp className="w-5 h-5" />, colorClass: 'bg-amber-500/20 text-amber-400', onClick: () => navigate('/farmer/markets') },
    { id: 'qa-4', label: 'Logistics', icon: <Truck className="w-5 h-5" />, colorClass: 'bg-violet-500/20 text-violet-400', onClick: () => navigate('/farmer/logistics') }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between z-10 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full text-slate-100">
      
      {/* Top Dashboard Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Good morning, {userName} 👋
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Verified Producer
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {userName} • RuralFlow Micro-Logistics Network
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Gateway</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Quick Actions Component */}
      <div className="mt-6">
        <QuickActions actions={quickActions} />
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
        
        {/* KPI 1 */}
        <div 
          onClick={() => navigate('/farmer/products')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">My Products</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{state.products.length} Batches</span>
            <span className="text-xs text-emerald-400 block mt-1">
              {state.products.length > 0 ? 'Recently updated' : 'No products yet'}
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div 
          onClick={() => navigate('/farmer/markets')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Demands</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{allDemandsCount} Demands</span>
            <span className="text-xs text-sky-400 block mt-1">{liveBuyerDemands.length} Live Buyer Demands</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div 
          onClick={() => navigate('/farmer/markets')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Market Opportunities</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{topOpportunities.length} Signals</span>
            <span className="text-xs text-amber-400 block mt-1">Platform Market Demand</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div 
          onClick={() => navigate('/farmer/deliveries')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Deliveries</span>
            <Truck className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{state.logisticsRequests.length} Active</span>
            <span className="text-xs text-violet-400 block mt-1">
              {state.logisticsRequests.filter(r => r.status !== 'Delivered').length} In progress
            </span>
          </div>
        </div>
      </div>

      {/* 3 Main Functional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Section 1: Platform-Wide Market Opportunities */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Market Opportunities</span>
            </h2>
            <span className="text-[11px] text-emerald-400 font-semibold">{topOpportunities.length} Live Signals</span>
          </div>

          <div className="space-y-3">
            {topOpportunities.slice(0, 3).map(opp => (
              <div 
                key={opp.id} 
                onClick={() => navigate('/farmer/markets')}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 cursor-pointer hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{opp.name}</span>
                  <span className="text-emerald-400 font-bold font-mono">{opp.price}</span>
                </div>
                <p className="text-[11px] text-slate-400">{opp.source}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${opp.isLive ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {opp.badge}
                  </span>
                  <span className="text-sky-400 font-semibold">Click to view</span>
                </div>
              </div>
            ))}
            {topOpportunities.length === 0 && (
              <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No active market signals at this time.
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Recent Activity */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Recent Activity</span>
            </h2>
            <span className="text-[11px] text-slate-400">Live Stream</span>
          </div>

          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                  {act.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : act.type === 'warning' ? (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Truck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-white block">{act.title}</span>
                    <span className="text-slate-400 text-[11px]">{act.subtitle}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                Welcome to RuralFlow! Add your first product or explore market opportunities to see updates here.
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Logistics Status */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Truck className="w-4 h-4 text-violet-400" />
              <span>Logistics Status</span>
            </h2>
            <span className="text-[11px] text-violet-400 font-semibold">{activeShipment ? activeShipment.status : 'No Active Shipments'}</span>
          </div>

          {activeShipment ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Assigned Transporter:</span>
                <strong className="text-white">{activeShipment.driver || 'Searching Transporter'}</strong>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Shipment / Load:</span>
                <span className="text-slate-200">{activeShipment.productName} ({activeShipment.quantity || 'TBD'})</span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${
                  activeShipment.status === 'Delivered' ? 'w-full bg-emerald-500' :
                  activeShipment.status === 'In Transit' ? 'w-4/5 bg-emerald-500' :
                  activeShipment.status === 'Picked Up' ? 'w-3/5 bg-sky-500' :
                  activeShipment.status === 'At Pickup' ? 'w-2/5 bg-sky-500' :
                  'w-1/5 bg-sky-500'
                }`} />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Destination / ETA:</span>
                <span className="text-emerald-400 font-bold font-mono">{activeShipment.eta || activeShipment.destination}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-sm text-slate-500">
              No active shipments at the moment.
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('/farmer/deliveries')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span>View Full Logistics Schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
        <span>RuralFlow • Farmer & Producer Micro-Logistics Portal</span>
      </footer>
    </div>
  );
};
