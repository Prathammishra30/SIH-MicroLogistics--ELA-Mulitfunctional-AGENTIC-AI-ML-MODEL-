import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Truck, CheckCircle2, Circle } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from "../../context/LanguageContext";

export const BuyerOrderDetail: React.FC = () => {
    const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useSharedContext();

  const order = state.procurementRequests.find((pr) => pr.id === id);
  const linkedShipment = order?.logisticsRequestId
    ? state.logisticsRequests.find((lr) => lr.id === order.logisticsRequestId)
    : null;

  if (!order) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">{t('buyer.procurement_order_not_found')}</h2>
        <button
          onClick={() => navigate('/buyer/orders')}
          className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          {t('buyer.back_to_orders')}</button>
      </div>
    );
  }

  const effectiveStatus = linkedShipment
    ? (linkedShipment.status === 'Delivered' ? 'Delivered' : linkedShipment.status)
    : order.status;

  const timeline = [
    { label: 'Procurement Created', completed: true, time: new Date(order.createdAt).toLocaleDateString() },
    {
      label: 'Farmer Match & Fulfilling',
      completed: order.status !== 'Open',
      time: order.farmerName ? `${order.farmerName} (Confirmed)` : (order.status !== 'Open' ? 'Confirmed' : 'Awaiting Farmer Match'),
    },
    {
      label: 'Logistics Requested',
      completed: !!order.logisticsRequestId || order.status === 'Logistics Requested' || order.status === 'Completed',
      time: order.logisticsRequestId ? `Dispatched (${order.logisticsRequestId})` : 'Pending Transporter Assignment',
    },
  ];

  if (linkedShipment) {
    const statusOrder = ['Searching', 'Pending', 'Assigned', 'At Pickup', 'Picked Up', 'In Transit', 'Delivered'];
    const currentIdx = statusOrder.indexOf(linkedShipment.status);

    timeline.push(
      { label: 'Transport Matched', completed: currentIdx >= 2, time: currentIdx >= 2 ? (linkedShipment.driver || 'Assigned') : 'Pending' },
      { label: 'Picked Up from Farm', completed: currentIdx >= 4, time: currentIdx >= 4 ? 'Crop Loaded at Farm' : 'Pending' },
      { label: 'In Transit to Destination', completed: currentIdx >= 5, time: currentIdx >= 5 ? 'En Route to Warehouse' : 'Pending' },
      { label: 'Delivered & Handed Over', completed: currentIdx >= 6, time: currentIdx >= 6 ? 'Delivered & Verified' : 'Pending' },
    );
  }

  const isDelivered = linkedShipment?.status === 'Delivered';
  if (isDelivered && order.status !== 'Completed') {
    dispatch({ type: 'UPDATE_PROCUREMENT', payload: { id: order.id, status: 'Completed' } });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <button
          onClick={() => navigate('/buyer/orders')}
          className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {t('buyer.procurement_order_')}{order.id}
          </h1>
          <p className="text-xs text-gray-500">{order.product} — {order.quantity}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Col: Order Details */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2.5">
            {t('buyer.procurement_specifications')}</h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">{t('buyer.commodity')}</span>
              <span className="font-bold text-gray-900">{order.product}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">{t('buyer.procurement_volume')}</span>
              <span className="font-bold font-mono text-gray-900">{order.quantity}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">{t('buyer.target_offering_rate')}</span>
              <span className="font-bold text-[#2E7D32] font-mono">{order.targetPrice}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">{t('farmer.destination_2')}</span>
              <span className="font-medium text-gray-900">{order.destination}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">{t('buyer.fulfilling_producer')}</span>
              <span className="font-semibold text-gray-900">{order.farmerName || 'Awaiting Farmer Match'}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-500">{t('buyer.order_status')}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {effectiveStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Linked Shipment */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2.5 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-amber-700" />
            {t('buyer.freight_dispatch_info')}</h2>

          {linkedShipment ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">{t('buyer.shipment_ref')}</span>
                <span className="font-mono font-bold text-gray-900">#{linkedShipment.id}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">{t('buyer.farm_origin')}</span>
                <span className="font-medium text-gray-900">{linkedShipment.pickupLocation || 'Farm Gate'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">{t('buyer.driver')}</span>
                <span className="font-medium text-gray-900">{linkedShipment.driver || 'Searching Transporter'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">{t('farmer.vehicle')}</span>
                <span className="font-medium text-gray-900">{linkedShipment.vehicle || 'Vehicle Allocation Pending'}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500">{t('farmer.eta')}</span>
                <span className="font-semibold text-blue-700">{linkedShipment.eta || 'En Route'}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">{t('buyer.no_transport_linked_yet')}</p>
              <p>{t('buyer.will_automatically_link_once_a')}</p>
            </div>
          )}
        </div>

        {/* Bottom: Timeline */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900">{t('buyer.procurement_progress_timeline')}</h2>
          <div className="relative pl-1">
            <div className="space-y-4">
              {timeline.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-gray-100 text-gray-300'
                      }`}
                    >
                      {step.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </div>
                    {idx < timeline.length - 1 && <div className="w-0.5 h-6 bg-gray-200 my-1" />}
                  </div>
                  <div className="pb-1 text-xs">
                    <p className={`font-bold ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    <p className="text-gray-500 text-[11px] mt-0.5">{step.time}</p>
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
