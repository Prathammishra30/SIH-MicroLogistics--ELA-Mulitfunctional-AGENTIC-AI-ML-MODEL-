import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, MapPin, Truck, User, CheckCircle2, Clock, CircleDot } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const BuyerOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useSharedContext();

  const order = state.procurementRequests.find(pr => pr.id === id);
  const linkedShipment = order?.logisticsRequestId
    ? state.logisticsRequests.find(lr => lr.id === order.logisticsRequestId)
    : null;

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-400">Procurement order not found.</p>
          <button
            onClick={() => navigate('/buyer/orders')}
            className="px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // Determine effective display status
  const effectiveStatus = linkedShipment
    ? (linkedShipment.status === 'Delivered' ? 'Delivered' : linkedShipment.status)
    : order.status;

  // Build unified timeline
  const timeline = [
    { label: 'Procurement Created', completed: true, time: new Date(order.createdAt).toLocaleString() },
    { 
      label: 'Farmer Fulfilling', 
      completed: order.status !== 'Open', 
      time: order.farmerName ? `${order.farmerName} (Confirmed)` : (order.status !== 'Open' ? 'Confirmed' : 'Pending') 
    },
    { 
      label: 'Logistics Requested', 
      completed: !!order.logisticsRequestId || order.status === 'Logistics Requested' || order.status === 'Completed', 
      time: order.logisticsRequestId ? `Dispatched (${order.logisticsRequestId})` : 'Pending' 
    },
  ];

  if (linkedShipment) {
    const statusOrder = ['Searching', 'Assigned', 'At Pickup', 'Picked Up', 'In Transit', 'Delivered'];
    const currentIdx = statusOrder.indexOf(linkedShipment.status);
    
    timeline.push(
      { label: 'Transport Matched', completed: currentIdx >= 1, time: currentIdx >= 1 ? (linkedShipment.driver || 'Assigned') : 'Pending' },
      { label: 'Pickup Completed', completed: currentIdx >= 3, time: currentIdx >= 3 ? 'Picked Up from Farm' : 'Pending' },
      { label: 'In Transit', completed: currentIdx >= 4, time: currentIdx >= 4 ? 'En Route to APMC' : 'Pending' },
      { label: 'Delivered', completed: currentIdx >= 5, time: currentIdx >= 5 ? 'Delivered & Verified' : 'Pending' },
    );
  }

  // Mark completed when delivered
  const isDelivered = linkedShipment?.status === 'Delivered';
  if (isDelivered && order.status !== 'Completed') {
    dispatch({ type: 'UPDATE_PROCUREMENT', payload: { id: order.id, status: 'Completed' } });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full relative z-10">
      <header className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/buyer/orders')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-violet-400" />
            {order.id}
          </h1>
          <p className="text-sm text-slate-400">{order.product} — {order.quantity}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Procurement Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"
        >
          <h2 className="text-base font-bold text-white">Procurement Details</h2>
          <div className="space-y-3">
            {[
              { label: 'Product', value: order.product },
              { label: 'Quantity', value: order.quantity },
              { label: 'Target Price', value: order.targetPrice },
              { label: 'Destination', value: order.destination },
              { label: 'Assigned Producer', value: order.farmerName || (order.status !== 'Open' ? 'Ramesh Patel' : 'Awaiting Farmer') },
              { label: 'Required By', value: order.requiredBy },
              { label: 'Status', value: effectiveStatus },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-800/50 text-sm">
                <span className="text-slate-400">{item.label}</span>
                <span className="font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Shipment Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"
        >
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-sky-400" />
            Shipment & Transport
          </h2>

          {linkedShipment ? (
            <div className="space-y-3">
              {[
                { label: 'Shipment ID', value: linkedShipment.id, icon: Package },
                { label: 'Origin', value: linkedShipment.pickupLocation || 'Farm Gate', icon: MapPin },
                { label: 'Destination', value: linkedShipment.destination, icon: MapPin },
                { label: 'Transporter', value: linkedShipment.driver || 'Searching...', icon: User },
                { label: 'Vehicle', value: linkedShipment.vehicle || 'Pending', icon: Truck },
                { label: 'ETA', value: linkedShipment.eta || 'Calculating...', icon: Clock },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-800/50 text-sm">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <item.icon className="w-3.5 h-3.5" /> {item.label}
                  </span>
                  <span className="font-semibold text-white text-right max-w-[60%] truncate">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-sm text-slate-500">
              No shipment linked yet. Awaiting farmer fulfillment and transport matching.
            </div>
          )}
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"
        >
          <h2 className="text-base font-bold text-white">Procurement Timeline</h2>
          <div className="space-y-0">
            {timeline.map((step, idx) => {
              const isLast = idx === timeline.length - 1;
              const isCurrent = step.completed && (isLast || !timeline[idx + 1]?.completed);
              return (
                <div key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {step.completed ? (
                      isCurrent ? (
                        <CircleDot className="w-5 h-5 text-sky-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-700 shrink-0" />
                    )}
                    {!isLast && (
                      <div className={`w-0.5 h-8 ${step.completed ? 'bg-emerald-500/30' : 'bg-slate-800'}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm font-semibold ${step.completed ? (isCurrent ? 'text-sky-400' : 'text-white') : 'text-slate-500'}`}>
                      {step.label}
                    </p>
                    <p className="text-[11px] text-slate-500">{step.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
