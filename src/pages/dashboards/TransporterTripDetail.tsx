import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Truck, AlertTriangle } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const TransporterTripDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useSharedContext();
  
  const trip = state.logisticsRequests.find((r) => r.id === id);
  const selectedVehicle = state.vehicles.find((v) => v.status === 'Available') || state.vehicles[0];

  const isLargeLoad = trip?.quantity?.includes('2000') || trip?.quantity?.includes('3000') || trip?.quantity?.includes('MT') || false;
  const isSmallVehicle = selectedVehicle?.capacity.includes('kg') && !selectedVehicle?.capacity.includes('2000');
  const isCompatible = !(isLargeLoad && isSmallVehicle);

  if (!trip) {
    return (
      <div className="p-8 text-white text-center">Trip not found</div>
    );
  }

  const handleAcceptTrip = () => {
    dispatch({
      type: 'UPDATE_DELIVERY_STATUS',
      payload: {
        id: trip.id,
        status: 'Assigned',
        driver: 'Sunil Deshmukh',
        vehicle: selectedVehicle ? `${selectedVehicle.type} (${selectedVehicle.registration})` : 'Unknown Vehicle',
        newTimelineEvent: { status: 'Vehicle Assigned', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), completed: true }
      }
    });
    
    // Add Notification
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: `Trip ${trip.id} accepted successfully!`,
        type: 'success'
      }
    });

    navigate('/transporter/active');
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
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Trip Details</h1>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">{trip.productName}</h2>
            <p className="text-slate-400 text-sm mt-1">ID: <span className="font-mono">{trip.id}</span></p>
          </div>
          <span className="px-3 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-full text-xs font-semibold">
            {trip.status}
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-400 mb-1">Pickup Location</h3>
              <p className="text-white">{trip.pickupLocation || 'Pending'}</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-400 mb-1">Destination</h3>
              <p className="text-white">{trip.destination}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-400 mb-1">Required Load</h3>
              <p className="text-white">{trip.quantity || 'Unknown'}</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-400 mb-1">Estimated Payout</h3>
              <p className="text-emerald-400 font-bold font-mono">{trip.estimatedEarnings || 'TBD'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-400" />
          Vehicle Compatibility
        </h3>
        
        {selectedVehicle ? (
          isCompatible ? (
            <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-3 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <p className="font-semibold">{selectedVehicle.type}</p>
                  <p className="text-xs mt-1">Capacity: {selectedVehicle.capacity}</p>
                </div>
              </div>
              <span className="text-xs bg-emerald-500/20 px-2 py-1 rounded text-emerald-300">Optimal Match</span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Capacity Exceeded</p>
                  <p className="text-xs mt-1">Your {selectedVehicle.capacity} vehicle is too small for this {trip.quantity} load.</p>
                </div>
              </div>
            </div>
          )
        ) : (
           <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-semibold">No Available Vehicle</p>
                <p className="text-xs mt-1">Please add or free up a vehicle.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={handleAcceptTrip}
          disabled={!selectedVehicle || !isCompatible}
          className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
        >
          Accept Trip
        </button>
      </div>
    </div>
  );
};
