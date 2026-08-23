import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, CheckCircle2, Circle } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const FarmerDeliveryDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state } = useSharedContext();

  const shipment = state.logisticsRequests.find(req => req.id === id);

  if (!shipment) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Shipment Not Found</h2>
        <button 
          onClick={() => navigate('/farmer/deliveries')}
          className="px-6 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 font-bold transition-colors"
        >
          Back to Deliveries
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full relative z-10">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/farmer/deliveries')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            Shipment {shipment.id}
          </h1>
          <p className="text-sm text-slate-400">Delivery Status & Tracking</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Shipment Details</h3>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Product</span>
                <span className="text-sm font-semibold text-slate-200">{shipment.productName} ({shipment.quantity || 'Standard'})</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Status</span>
                <span className="text-sm font-bold text-violet-400">{shipment.status}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Pickup</span>
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" /> {shipment.pickupLocation || 'Farm Gate'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Destination</span>
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" /> {shipment.destination}
                </span>
              </div>
              {shipment.procurementRequestId && (
                <div className="col-span-2 pt-2 border-t border-slate-800/50">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Linked Procurement Demand</span>
                  <span className="text-xs font-mono text-violet-400 font-semibold">{shipment.procurementRequestId} (Commercial APMC Order)</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Truck className="w-5 h-5 text-sky-400" />
              Transport Details
            </h3>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Driver</span>
                <span className="text-sm font-semibold text-slate-200">{shipment.driver || 'Pending Assignment'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Vehicle</span>
                <span className="text-sm font-semibold text-slate-200">{shipment.vehicle || 'Pending Allocation'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Estimated Cost / Payout</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{shipment.estimatedEarnings || '₹1,850'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">ETA</span>
                <span className="text-sm font-semibold text-slate-200">{shipment.eta || (shipment.status === 'Searching' ? 'Awaiting Transporter' : 'En Route')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 h-fit">
          <h3 className="text-lg font-bold text-white mb-6">Status Timeline</h3>
          <div className="relative">
            <div className="absolute left-[11px] top-3 bottom-4 w-[2px] bg-slate-800"></div>
            <div className="space-y-6">
              {shipment.timeline.map((event, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className={`mt-0.5 shrink-0 bg-slate-900 relative z-10 ${event.completed ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {event.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${event.completed ? 'text-white' : 'text-slate-400'}`}>
                      {event.status}
                    </h4>
                    <span className="text-xs text-slate-500">{event.time}</span>
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
