import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Truck, AlertTriangle, Loader2 } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import { transporterApi } from '../../services/api';

/**
 * Parses a capacity string like "700 kg", "2.5 MT" into kg for comparison.
 */
function parseCapacityToKg(capacity: string): number {
  if (!capacity) return 0;
  const normalized = capacity.trim().toLowerCase();
  const numMatch = normalized.match(/([\d.,]+)/);
  if (!numMatch) return 0;
  const num = parseFloat(numMatch[1].replace(',', ''));
  if (isNaN(num)) return 0;
  if (normalized.includes('mt') || normalized.includes('ton')) {
    return Math.round(num * 1000);
  }
  return Math.round(num);
}

export const TransporterTripDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useSharedContext();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>('');

  const trip = state.logisticsRequests.find((r) => r.id === id);
  const availableVehicles = state.vehicles.filter((v) => v.status === 'Available');

  const effectiveVehicleId = selectedVehicleId || (availableVehicles.length > 0 ? availableVehicles[0].id : '');
  const selectedVehicle = state.vehicles.find((v) => v.id === effectiveVehicleId) || null;

  // Capacity compatibility check
  const requestedKg = trip?.quantity ? parseCapacityToKg(trip.quantity) : 0;
  const vehicleKg = selectedVehicle ? parseCapacityToKg(selectedVehicle.capacity) : 0;
  const isCompatible = !selectedVehicle || vehicleKg === 0 || requestedKg === 0 || requestedKg <= vehicleKg;

  if (!trip) {
    return (
      <div className="p-8 text-white text-center">Trip not found</div>
    );
  }

  const handleAcceptTrip = async () => {
    if (!trip) return;
    setIsSubmitting(true);
    const vehicleStr = selectedVehicle ? `${selectedVehicle.type} (${selectedVehicle.registration})` : 'Pickup (1.5 MT)';
    const driverName = state.auth.user?.name || 'Driver';

    try {
      try {
        await transporterApi.acceptTrip(trip.id, {
          driver: driverName,
          vehicle: vehicleStr,
          vehicleId: selectedVehicle?.id,
        });
      } catch (err) {
        console.warn('Backend trip acceptance error, applying local state fallback:', err);
      }

      dispatch({
        type: 'UPDATE_DELIVERY_STATUS',
        payload: {
          id: trip.id,
          status: 'Assigned',
          driver: driverName,
          vehicle: vehicleStr,
          newTimelineEvent: { status: 'Vehicle Assigned', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), completed: true }
        }
      });

      // Mark vehicle as Busy locally
      if (selectedVehicle) {
        dispatch({
          type: 'UPDATE_VEHICLE_STATUS',
          payload: { id: selectedVehicle.id, status: 'Busy' },
        });
      }

      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Trip ${trip.id} accepted successfully!`,
          type: 'success'
        }
      });

      navigate('/transporter/active');
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Vehicle Selection */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-400" />
          Select Vehicle
        </h3>

        {state.vehicles.length === 0 ? (
          <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-semibold">No Vehicles Registered</p>
                <p className="text-xs mt-1">Please add a vehicle before accepting trips.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/transporter/vehicles')}
              className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition-colors"
            >
              Add Vehicle →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <select
              value={effectiveVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Select a vehicle...</option>
              {availableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.type} — {v.registration} ({v.capacity})
                </option>
              ))}
            </select>

            {availableVehicles.length === 0 && (
              <p className="text-sm text-amber-400">All vehicles are currently busy. Free up a vehicle or add a new one.</p>
            )}

            {selectedVehicle && (
              isCompatible ? (
                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <div>
                      <p className="font-semibold">{selectedVehicle.type}</p>
                      <p className="text-xs mt-1">{selectedVehicle.registration} • Capacity: {selectedVehicle.capacity}</p>
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
                      <p className="text-xs mt-1">
                        Your {selectedVehicle.capacity} vehicle (~{vehicleKg} kg) cannot carry {trip.quantity} (~{requestedKg} kg).
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={handleAcceptTrip}
          disabled={!selectedVehicle || !isCompatible || isSubmitting || state.vehicles.length === 0}
          className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isSubmitting ? 'Accepting Trip...' : 'Accept Trip'}
        </button>
      </div>
    </div>
  );
};
