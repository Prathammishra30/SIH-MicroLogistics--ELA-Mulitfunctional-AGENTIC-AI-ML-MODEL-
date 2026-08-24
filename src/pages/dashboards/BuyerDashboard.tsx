import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Store,
  Package,
  Truck,
  Users,
  LogOut,
  Layers,
  Home,
  ShoppingCart,
  Leaf,
  ClipboardList,
  ShieldCheck
} from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state, logout } = useSharedContext();

  // Derive KPIs from shared state
  const openProcurements = state.procurementRequests.filter(pr => pr.status === 'Open');
  const activeProcurements = state.procurementRequests.filter(pr => pr.status !== 'Completed');
  const completedProcurements = state.procurementRequests.filter(pr => pr.status === 'Completed');

  // Incoming: logistics requests linked to buyer procurement requests that are in active transport
  const incomingShipments = state.procurementRequests
    .filter(pr => pr.logisticsRequestId)
    .map(pr => ({
      procurement: pr,
      shipment: state.logisticsRequests.find(lr => lr.id === pr.logisticsRequestId) || null
    }))
    .filter(item => item.shipment && item.shipment.status !== 'Delivered');

  const inTransitCount = incomingShipments.filter(
    item => item.shipment && ['In Transit', 'At Pickup', 'Picked Up'].includes(item.shipment.status)
  ).length;

  const availableProducers = state.products.filter(p => p.status === 'Available').length;

  return (
    <div className="relative min-h-screen flex flex-col justify-between z-10 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full text-slate-100">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Buyer Procurement Dashboard
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                Verified APMC Buyer
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Rajesh Singhania • Sahyadri Agri Traders Pvt Ltd (Navi Mumbai APMC)
            </p>
          </div>
        </div>

        {/* Action Controls */}
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
            onClick={() => { logout(); navigate('/'); }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 flex flex-wrap gap-3"
      >
        <button
          onClick={() => navigate('/buyer/procurement')}
          className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-violet-500/20"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          New Procurement
        </button>
        <button
          onClick={() => navigate('/buyer/orders')}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          My Orders
        </button>
        <button
          onClick={() => navigate('/buyer/produce')}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <Leaf className="w-3.5 h-3.5" />
          Browse Produce
        </button>
      </motion.div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
        <div
          onClick={() => navigate('/buyer/orders')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Demand</span>
            <Layers className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{activeProcurements.length} Orders</span>
            <span className="text-xs text-violet-400 block mt-1">{openProcurements.length} awaiting fulfillment</span>
          </div>
        </div>

        <div
          onClick={() => navigate('/buyer/orders')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Incoming Shipments</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{incomingShipments.length} Active</span>
            <span className="text-xs text-emerald-400 block mt-1">{completedProcurements.length} completed</span>
          </div>
        </div>

        <div
          onClick={() => navigate('/buyer/produce')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Producers Available</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{availableProducers} Products</span>
            <span className="text-xs text-sky-400 block mt-1">Browse available produce</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/buyer/orders')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">In Transit</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{inTransitCount} Shipments</span>
            <span className="text-xs text-amber-400 block mt-1">En route to destination</span>
          </div>
        </div>
      </div>

      {/* 3 Main Functional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Section 1: Open Procurement Demand */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              <span>Active Procurement</span>
            </h2>
            <span className="text-[11px] text-violet-400 font-semibold">{activeProcurements.length} Active</span>
          </div>

          <div className="space-y-3">
            {activeProcurements.slice(0, 3).map(pr => {
              const linked = pr.logisticsRequestId
                ? state.logisticsRequests.find(lr => lr.id === pr.logisticsRequestId)
                : null;
              const displayStatus = linked ? linked.status : pr.status;

              return (
                <div
                  key={pr.id}
                  onClick={() => navigate(`/buyer/orders/${pr.id}`)}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 cursor-pointer hover:border-violet-500/30 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{pr.product} ({pr.quantity})</span>
                    <span className="text-violet-400 font-bold font-mono">{pr.targetPrice}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">→ {pr.destination} • {pr.id}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Required: {pr.requiredBy}</span>
                    <span className={`font-semibold ${
                      displayStatus === 'In Transit' ? 'text-emerald-400' :
                      displayStatus === 'Delivered' ? 'text-emerald-400' :
                      displayStatus === 'Open' ? 'text-violet-400' :
                      'text-sky-400'
                    }`}>{displayStatus}</span>
                  </div>
                </div>
              );
            })}
            {activeProcurements.length === 0 && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-sm text-slate-500">
                No active procurement orders.
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Incoming Farm Produce */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Incoming Farm Produce</span>
            </h2>
            <span className="text-[11px] text-emerald-400 font-semibold">Live</span>
          </div>

          <div className="space-y-3">
            {incomingShipments.slice(0, 3).map(({ procurement, shipment }) => (
              <div
                key={procurement.id}
                onClick={() => navigate(`/buyer/orders/${procurement.id}`)}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs cursor-pointer hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{shipment!.id}</span>
                  <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" /> {shipment!.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {shipment!.productName} • {shipment!.quantity || 'N/A'} from {shipment!.pickupLocation || 'Farm Gate'}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>{shipment!.driver ? `Transporter: ${shipment!.driver}` : 'Awaiting transporter'}</span>
                  {shipment!.eta && <span className="text-sky-400">ETA: {shipment!.eta}</span>}
                </div>
              </div>
            ))}
            {incomingShipments.length === 0 && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-sm text-slate-500">
                No incoming shipments.
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Available Produce */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Leaf className="w-4 h-4 text-sky-400" />
              <span>Available Farm Produce</span>
            </h2>
            <span className="text-[11px] text-slate-400">From Connected Farms</span>
          </div>

          <div className="space-y-3">
            {state.products.filter(p => p.status === 'Available').slice(0, 3).map(product => (
              <div
                key={product.id}
                onClick={() => navigate('/buyer/procurement', { state: { product: product.name, quantity: product.quantity } })}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs cursor-pointer hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{product.name}</span>
                  <span className="text-emerald-400 text-[11px] font-semibold">{product.grade}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Available: {product.quantity}</span>
                  <span className="text-slate-400">{product.category}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate('/buyer/produce')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Browse All Produce →
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
        <span>RuralFlow • Commercial Buyer & APMC Procurement Portal</span>
      </footer>
    </div>
  );
};
