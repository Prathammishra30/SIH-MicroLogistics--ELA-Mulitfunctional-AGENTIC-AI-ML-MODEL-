import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import type { LogisticsRequest } from '../../data/mockData';
import { transporterApi } from '../../services/api';

export const TransporterActiveTripDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useSharedContext();
  const [isUpdating, setIsUpdating] = React.useState(false);
  
  const trip = state.logisticsRequests.find((r) => r.id === id);

  if (!trip) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Trip Not Found</h2>
        <button
          onClick={() => navigate('/transporter/active')}
          className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          Back to Active Deliveries
        </button>
      </div>
    );
  }

  const nextStatusMap: Record<LogisticsRequest['status'], LogisticsRequest['status'] | null> = {
    'Searching': 'Assigned',
    'Assigned': 'At Pickup',
    'At Pickup': 'Picked Up',
    'Picked Up': 'In Transit',
    'In Transit': 'Delivered',
    'Delivered': null,
  };

  const statusMessages: Record<string, string> = {
    'Assigned': 'Transporter assigned vehicle to shipment.',
    'At Pickup': 'Transporter arrived at farm pickup gate.',
    'Picked Up': 'Crop loaded and verified with farmer.',
    'In Transit': 'Vehicle en route to destination market.',
    'Delivered': 'Produce delivered and handed over successfully.',
  };

  const nextStatus = nextStatusMap[trip.status];

  const handleUpdateStatus = async () => {
    if (!nextStatus || !trip) return;
    setIsUpdating(true);

    try {
      try {
        await transporterApi.updateTripStatus(trip.id, nextStatus);
      } catch (err) {
        console.warn('Backend trip status update error, applying local state fallback:', err);
      }

      dispatch({
        type: 'UPDATE_DELIVERY_STATUS',
        payload: {
          id: trip.id,
          status: nextStatus,
          newTimelineEvent: {
            status: statusMessages[nextStatus] || nextStatus,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            completed: true,
          },
        },
      });

      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Trip #${trip.id} status progressed to ${nextStatus}`,
          type: nextStatus === 'Delivered' ? 'success' : 'info',
        },
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Active Trip Management • #{trip.id}
          </h1>
          <p className="text-xs text-gray-500">
            Progress shipment dispatch milestones in real time.
          </p>
        </div>
      </header>

      {/* Overview Card */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-2xs space-y-4">
        <div className="flex justify-between items-start border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">{trip.productName} ({trip.quantity || 'Load'})</h2>
            <p className="text-gray-500 text-xs mt-0.5">Assigned Vehicle: <strong className="text-gray-900">{trip.vehicle || 'Fleet Vehicle'}</strong></p>
          </div>
          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold">
            {trip.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
            <span className="text-gray-400 font-semibold uppercase text-[10px] block mb-1">Pickup Location</span>
            <span className="text-gray-900 font-medium">{trip.pickupLocation || 'Farm Gate'}</span>
          </div>
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
            <span className="text-gray-400 font-semibold uppercase text-[10px] block mb-1">Destination</span>
            <span className="text-gray-900 font-medium">{trip.destination}</span>
          </div>
        </div>
      </div>

      {/* Progress Journey Timeline */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900">Dispatch Milestone Progress</h3>
        
        <div className="space-y-4 pl-1">
          {trip.timeline.map((event, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    event.completed ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-gray-100 text-gray-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                {idx < trip.timeline.length - 1 && <div className="w-0.5 h-6 bg-gray-200 my-1" />}
              </div>
              <div className="pb-2 text-xs">
                <p className={`font-bold ${event.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                  {event.status}
                </p>
                <p className="text-gray-500 text-[11px] mt-0.5">{event.time}</p>
              </div>
            </div>
          ))}
        </div>

        {nextStatus && (
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleUpdateStatus}
              disabled={isUpdating}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2E7D32] hover:bg-[#256628] disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              <span>{isUpdating ? 'Updating...' : `Advance Milestone: Mark as ${nextStatus}`}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
