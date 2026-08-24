import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, CheckCircle2, Circle } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const FarmerDeliveryDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state } = useSharedContext();

  const shipment = state.logisticsRequests.find((req) => req.id === id);

  if (!shipment) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Shipment Record Not Found</h2>
        <button
          onClick={() => navigate('/farmer/deliveries')}
          className="px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          Back to Deliveries
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <button
          onClick={() => navigate('/farmer/deliveries')}
          className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          title="Back to deliveries"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Shipment #{shipment.id}
          </h1>
          <p className="text-xs text-gray-500">Live delivery tracking & vehicle dispatch details.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Details */}
        <div className="md:col-span-2 space-y-5">
          
          {/* Cargo Details Card */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2.5">
              Produce Cargo Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 font-semibold uppercase text-[10px] block mb-0.5">Produce</span>
                <span className="text-gray-900 font-semibold">{shipment.productName} ({shipment.quantity || 'Standard'})</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase text-[10px] block mb-0.5">Shipment Status</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                    shipment.status === 'Delivered'
                      ? 'bg-[#E8F5E9] text-[#2E7D32] border-green-200'
                      : shipment.status === 'In Transit'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {shipment.status}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase text-[10px] block mb-0.5">Pickup Point</span>
                <span className="text-gray-900 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-green-700 shrink-0" /> {shipment.pickupLocation || 'Farm Gate'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase text-[10px] block mb-0.5">Destination</span>
                <span className="text-gray-900 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" /> {shipment.destination}
                </span>
              </div>
            </div>
          </div>

          {/* Transport & Vehicle Details */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2.5 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-700" />
              Assigned Fleet Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 font-semibold uppercase text-[10px] block mb-0.5">Assigned Transporter</span>
                <span className="text-gray-900 font-semibold">{shipment.driver || 'Pending Assignment'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase text-[10px] block mb-0.5">Vehicle</span>
                <span className="text-gray-900 font-semibold">{shipment.vehicle || 'Pending Allocation'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase text-[10px] block mb-0.5">Freight Fare</span>
                <span className="text-[#2E7D32] font-bold font-mono text-sm">{shipment.estimatedEarnings || '₹1,850'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase text-[10px] block mb-0.5">Estimated Arrival</span>
                <span className="text-gray-900 font-semibold">{shipment.eta || 'En Route'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Status Timeline */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs h-fit space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Delivery Milestone Timeline</h3>
          <div className="relative pl-2">
            <div className="absolute left-[17px] top-2 bottom-3 w-[2px] bg-gray-200"></div>
            <div className="space-y-5">
              {shipment.timeline.map((event, idx) => (
                <div key={idx} className="relative flex items-start gap-3">
                  <div
                    className={`mt-0.5 shrink-0 bg-white relative z-10 ${
                      event.completed ? 'text-[#2E7D32]' : 'text-gray-300'
                    }`}
                  >
                    {event.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${event.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                      {event.status}
                    </h4>
                    <span className="text-[11px] text-gray-500">{event.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
