import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Package, Truck, MapPin, Plus } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const BuyerOrders: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();

  const getTransportStatus = (logisticsRequestId: string | null) => {
    if (!logisticsRequestId) return null;
    return state.logisticsRequests.find((lr) => lr.id === logisticsRequestId) || null;
  };

  const getDisplayStatus = (pr: typeof state.procurementRequests[0]) => {
    if (pr.logisticsRequestId) {
      const lr = getTransportStatus(pr.logisticsRequestId);
      if (lr) {
        if (lr.status === 'Delivered') return 'Delivered';
        return lr.status;
      }
    }
    return pr.status;
  };

  const sortedOrders = [...state.procurementRequests].sort((a, b) => {
    if (a.status === 'Completed' && b.status !== 'Completed') return 1;
    if (a.status !== 'Completed' && b.status === 'Completed') return -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/buyer/dashboard')}
            className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-700" />
              Procurement Orders & Deliveries
            </h1>
            <p className="text-xs text-gray-500">
              Track all your broadcasted procurement demands, fulfilling farmers, and incoming shipments.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/buyer/procurement')}
          className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Post Procurement</span>
        </button>
      </header>

      {/* Orders List */}
      <div className="space-y-4">
        {sortedOrders.map((order) => {
          const displayStatus = getDisplayStatus(order);
          const linkedShipment = getTransportStatus(order.logisticsRequestId);

          return (
            <div
              key={order.id}
              onClick={() => navigate(`/buyer/orders/${order.id}`)}
              className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-gray-900">{order.product}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      displayStatus === 'Completed' || displayStatus === 'Delivered'
                        ? 'bg-[#E8F5E9] text-[#2E7D32] border-green-200'
                        : displayStatus === 'In Transit' || displayStatus === 'Fulfilling'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {displayStatus}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                  <span className="font-mono text-gray-400 font-bold">#{order.id}</span>
                  <span>Volume: <strong className="text-gray-900 font-mono">{order.quantity}</strong></span>
                  <span>Target: <strong className="text-[#2E7D32] font-mono">{order.targetPrice}</strong></span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-700" />
                    <span>{order.destination}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {order.farmerName && (
                    <span className="text-[#2E7D32] font-semibold">Fulfilling Producer: {order.farmerName}</span>
                  )}
                  {linkedShipment?.driver && (
                    <span className="flex items-center gap-1 text-amber-800 font-medium">
                      <Truck className="w-3.5 h-3.5" /> Assigned: {linkedShipment.driver} ({linkedShipment.vehicle || 'Vehicle'})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <span className="text-xs font-semibold text-blue-700 hover:underline">
                  View Order Details →
                </span>
                {linkedShipment?.eta && (
                  <span className="text-[11px] text-gray-500 font-medium">ETA: {linkedShipment.eta}</span>
                )}
              </div>
            </div>
          );
        })}

        {state.procurementRequests.length === 0 && (
          <div className="py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
            <Package className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-gray-600 text-xs font-medium">No procurement orders posted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
