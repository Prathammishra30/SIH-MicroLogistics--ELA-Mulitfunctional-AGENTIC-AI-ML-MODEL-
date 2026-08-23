import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ClipboardList, Package, Truck, CheckCircle2, Clock, Search } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const BuyerOrders: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();

  const getTransportStatus = (logisticsRequestId: string | null) => {
    if (!logisticsRequestId) return null;
    return state.logisticsRequests.find(lr => lr.id === logisticsRequestId) || null;
  };

  const getDisplayStatus = (pr: typeof state.procurementRequests[0]) => {
    if (pr.logisticsRequestId) {
      const lr = getTransportStatus(pr.logisticsRequestId);
      if (lr) {
        if (lr.status === 'Delivered') return 'Delivered';
        return lr.status;
      }
    }
    return pr.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
      case 'Fulfilling': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Logistics Requested':
      case 'Searching': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'Assigned':
      case 'At Pickup':
      case 'Picked Up': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'In Transit': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Delivered':
      case 'Completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  // Sort: active first, completed last
  const sortedOrders = [...state.procurementRequests].sort((a, b) => {
    if (a.status === 'Completed' && b.status !== 'Completed') return 1;
    if (a.status !== 'Completed' && b.status === 'Completed') return -1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/buyer/dashboard')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-violet-400" />
              Procurement Orders
            </h1>
            <p className="text-sm text-slate-400">Track all your procurement requests and deliveries.</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/buyer/procurement')}
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors shadow-lg shadow-violet-500/20"
        >
          + New Procurement
        </button>
      </header>

      <div className="space-y-4">
        {sortedOrders.map((order, idx) => {
          const displayStatus = getDisplayStatus(order);
          const linkedShipment = getTransportStatus(order.logisticsRequestId);

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/buyer/orders/${order.id}`)}
              className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between sm:justify-start gap-3">
                  <h3 className="text-base font-bold text-white">{order.product}</h3>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(displayStatus)}`}>
                    {displayStatus}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="font-mono text-slate-500">{order.id}</span>
                  <span>Qty: <strong className="text-slate-300">{order.quantity}</strong></span>
                  <span>Price: <strong className="text-slate-300">{order.targetPrice}</strong></span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>→ {order.destination}</span>
                  {order.farmerName && (
                    <span className="text-emerald-400 font-medium">Producer: {order.farmerName}</span>
                  )}
                  {linkedShipment?.driver && (
                    <span className="flex items-center gap-1 text-sky-400 font-medium">
                      <Truck className="w-3 h-3" /> {linkedShipment.driver}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {linkedShipment ? (
                  <div className="flex items-center gap-1.5 text-xs">
                    {linkedShipment.status === 'Delivered' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : linkedShipment.status === 'In Transit' ? (
                      <Truck className="w-4 h-4 text-emerald-400" />
                    ) : linkedShipment.status === 'Searching' ? (
                      <Search className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-sky-400" />
                    )}
                    <span className="font-mono text-slate-400">{linkedShipment.id}</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500">Awaiting fulfillment</span>
                )}
                {linkedShipment?.eta && (
                  <span className="text-[11px] text-emerald-400 font-semibold">ETA: {linkedShipment.eta}</span>
                )}
              </div>
            </motion.div>
          );
        })}

        {state.procurementRequests.length === 0 && (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400">
            <Package className="w-8 h-8 mx-auto mb-3 text-slate-600" />
            <p className="text-sm">No procurement orders yet.</p>
            <button
              onClick={() => navigate('/buyer/procurement')}
              className="mt-4 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors"
            >
              Create Your First Procurement
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
