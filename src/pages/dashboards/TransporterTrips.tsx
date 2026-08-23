import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Route } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const TransporterTrips: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const availableTrips = state.logisticsRequests.filter((req) => req.status === 'Searching');

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
          <Route className="w-6 h-6 text-sky-400" />
          Available Trips
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableTrips.length === 0 ? (
          <div className="col-span-full p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 border-dashed text-slate-400">
            No available trips at the moment.
          </div>
        ) : (
          availableTrips.map((trip) => (
            <div key={trip.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer" onClick={() => navigate(`/transporter/trips/${trip.id}`)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/20">
                  {trip.status}
                </span>
                <span className="text-xs text-slate-500 font-mono">{trip.id}</span>
              </div>
              <h3 className="text-white font-semibold">{trip.productName}</h3>
              
              <div className="mt-3 space-y-1">
                {trip.quantity && <p className="text-xs text-slate-400">Load: {trip.quantity}</p>}
                <p className="text-xs text-slate-400">From: {trip.pickupLocation || 'Pending'}</p>
                <p className="text-xs text-slate-400">To: {trip.destination}</p>
              </div>

              {trip.estimatedEarnings && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-500">Estimated Payout</span>
                  <span className="text-emerald-400 font-bold font-mono text-sm">{trip.estimatedEarnings}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
