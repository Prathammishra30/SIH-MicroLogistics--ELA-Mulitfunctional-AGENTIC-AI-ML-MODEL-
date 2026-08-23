import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, ArrowLeft, Search, Clock, MapPin } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const FarmerDeliveries: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/farmer/dashboard')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-violet-400" />
              Active Deliveries
            </h1>
            <p className="text-sm text-slate-400">Track your shipments in real-time.</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/farmer/logistics')}
          className="px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center gap-2"
        >
          <Truck className="w-4 h-4" />
          New Request
        </button>
      </header>

      <div className="mb-6 relative">
        <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input 
          type="text" 
          placeholder="Search by shipment ID or destination..." 
          className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500/50 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.logisticsRequests.map((req, idx) => (
          <motion.div 
            key={req.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => navigate(`/farmer/deliveries/${req.id}`)}
            className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 cursor-pointer transition-all flex flex-col gap-4 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-1 block">Shipment {req.id}</span>
                <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">{req.productName}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                req.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                req.status === 'Searching' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-sky-500/10 text-sky-400 border-sky-500/20'
              }`}>
                {req.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800/50">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Destination
                </span>
                <p className="text-sm text-slate-300 font-medium truncate">{req.destination}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ETA
                </span>
                <p className="text-sm text-slate-300 font-medium truncate">{req.eta || 'Calculating...'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                  {req.driver ? req.driver.charAt(0) : '?'}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-200">{req.driver || 'Searching...'}</span>
                  <span className="text-xs text-slate-500">{req.vehicle || 'Pending'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {state.logisticsRequests.length === 0 && (
          <div className="col-span-full p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400">
            No active deliveries found.
          </div>
        )}
      </div>
    </div>
  );
};
