import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const TransporterActiveTrips: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const activeTrips = state.logisticsRequests.filter(
    (req) => req.status !== 'Searching' && req.status !== 'Delivered'
  );

  return (
    <div className="min-h-screen flex flex-col z-10 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full text-slate-100">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/transporter/dashboard')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <Truck className="w-6 h-6 text-emerald-400" />
          Active Deliveries
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTrips.length === 0 ? (
          <div className="col-span-full p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 border-dashed text-slate-400">
            No active deliveries.
          </div>
        ) : (
          activeTrips.map((trip) => (
            <div key={trip.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer" onClick={() => navigate(`/transporter/active/${trip.id}`)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                  {trip.status}
                </span>
                <span className="text-xs text-slate-500 font-mono">{trip.id}</span>
              </div>
              <h3 className="text-white font-semibold">{trip.productName}</h3>
              <p className="text-sm text-slate-400 mt-1">Destination: {trip.destination}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
