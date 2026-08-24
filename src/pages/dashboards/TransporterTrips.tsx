import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Route, MapPin, Truck } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const TransporterTrips: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const availableTrips = state.logisticsRequests.filter(
    (req) => req.status === 'Searching'
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <header className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <button
          onClick={() => navigate('/transporter/dashboard')}
          className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          title="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Route className="w-5 h-5 text-amber-700" />
            Available Freight Trips
          </h1>
          <p className="text-xs text-gray-500">
            Discover unassigned rural produce loads eligible for your vehicle capacity.
          </p>
        </div>
      </header>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {availableTrips.map((trip) => (
          <div
            key={trip.id}
            onClick={() => navigate(`/transporter/trips/${trip.id}`)}
            className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Ready for Pickup
                </span>
                <span className="text-[10px] font-mono text-gray-400 font-bold">#{trip.id}</span>
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-2">{trip.productName}</h3>

              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Payload:</span>
                  <span className="font-semibold text-gray-900 font-mono">{trip.quantity || 'Load'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-green-700 shrink-0" />
                  <span className="truncate">From: {trip.pickupLocation || 'Farm Gate'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="truncate">To: {trip.destination}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Estimated Payout</span>
                <span className="text-[#2E7D32] font-bold font-mono text-sm">
                  {trip.estimatedEarnings || '₹1,850'}
                </span>
              </div>

              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs transition-colors shadow-2xs"
              >
                Accept Trip →
              </button>
            </div>
          </div>
        ))}

        {availableTrips.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
            <Truck className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-gray-600 text-xs font-medium">No open logistics trips available at this moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};
