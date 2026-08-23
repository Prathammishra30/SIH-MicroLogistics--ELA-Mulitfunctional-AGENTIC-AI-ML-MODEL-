import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import type { LogisticsRequest } from '../../data/mockData';

export const TransporterActiveTripDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useSharedContext();
  
  const trip = state.logisticsRequests.find((r) => r.id === id);

  if (!trip) {
    return <div className="p-8 text-white text-center">Trip not found</div>;
  }

  const nextStatusMap: Record<LogisticsRequest['status'], LogisticsRequest['status'] | null> = {
    'Searching': 'Assigned',
    'Assigned': 'At Pickup',
    'At Pickup': 'Picked Up',
    'Picked Up': 'In Transit',
    'In Transit': 'Delivered',
    'Delivered': null
  };

  const statusMessages: Record<string, string> = {
    'Assigned': 'Driver has been assigned.',
    'At Pickup': 'Driver arrived at pickup location.',
    'Picked Up': 'Goods have been loaded.',
    'In Transit': 'Driver is en route to destination.',
    'Delivered': 'Goods have been delivered successfully.'
  };

  const nextStatus = nextStatusMap[trip.status];

  const handleUpdateStatus = () => {
    if (!nextStatus) return;
    
    dispatch({
      type: 'UPDATE_DELIVERY_STATUS',
      payload: {
        id: trip.id,
        status: nextStatus,
        newTimelineEvent: {
          status: statusMessages[nextStatus] || nextStatus,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: true
        }
      }
    });

    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: `Trip ${trip.id} updated to ${nextStatus}`,
        type: nextStatus === 'Delivered' ? 'success' : 'info'
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col z-10 px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto w-full text-slate-100">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Active Trip Management</h1>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">{trip.productName}</h2>
            <p className="text-slate-400 text-sm mt-1">ID: <span className="font-mono">{trip.id}</span></p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
            {trip.status}
          </span>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl mb-6">
         <h3 className="text-lg font-semibold text-white mb-4">Progress Journey</h3>
         <div className="space-y-4">
          {trip.timeline.map((event, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${event.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                {idx < trip.timeline.length - 1 && <div className="w-0.5 h-full bg-slate-800 mt-2 mb-2" />}
              </div>
              <div className="pb-4">
                <p className={`font-semibold ${event.completed ? 'text-white' : 'text-slate-500'}`}>{event.status}</p>
                <p className="text-xs text-slate-400 mt-1">{event.time}</p>
              </div>
            </div>
          ))}
         </div>
      </div>

      {nextStatus && (
        <div className="flex justify-end mt-4">
          <button
            onClick={handleUpdateStatus}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors"
          >
            Mark as {nextStatus}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
