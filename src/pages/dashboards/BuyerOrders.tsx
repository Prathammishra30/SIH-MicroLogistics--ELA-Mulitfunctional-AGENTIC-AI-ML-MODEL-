import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Package, Truck, MapPin, Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const BuyerOrders: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const shouldReduceMotion = useReducedMotion();

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
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            onClick={() => navigate('/buyer/dashboard')}
            className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            title={t('farmer.back_to_dashboard')}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-700" />
              {t('buyer.procurement_orders_deliveries')}
            </h1>
            <p className="text-xs text-gray-500">
              {t('buyer.track_all_your_broadcasted_pro')}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          onClick={() => navigate('/buyer/procurement')}
          className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('buyer._post_procurement')}</span>
        </motion.button>
      </header>

      {/* Orders List */}
      <div className="space-y-4">
        {sortedOrders.map((order, idx) => {
          const displayStatus = getDisplayStatus(order);
          const linkedShipment = getTransportStatus(order.logisticsRequestId);

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.35,
                delay: shouldReduceMotion ? 0 : idx * 0.05,
              }}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { y: -3, transition: { duration: 0.2 } }
              }
              onClick={() => navigate(`/buyer/orders/${order.id}`)}
              className="p-5 rounded-2xl bg-white border border-gray-200/90 hover:border-blue-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-gray-900">{order.product}</h3>
                  <StatusBadge status={displayStatus} />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                  <span className="font-mono text-gray-400 font-bold">#{order.id}</span>
                  <span>
                    {t('buyer.volume')}{' '}
                    <strong className="text-gray-900 font-mono">{order.quantity}</strong>
                  </span>
                  <span>
                    {t('farmer.target')}{' '}
                    <strong className="text-[#2E7D32] font-mono">{order.targetPrice}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-700" />
                    <span>{order.destination}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {order.farmerName && (
                    <span className="text-[#2E7D32] font-semibold">
                      {t('buyer.fulfilling_producer_6')}{order.farmerName}
                    </span>
                  )}
                  {linkedShipment?.driver && (
                    <span className="flex items-center gap-1 text-amber-800 font-medium">
                      <Truck className="w-3.5 h-3.5" /> {t('buyer.assigned')}{linkedShipment.driver} ({linkedShipment.vehicle || 'Vehicle'})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <span className="text-xs font-semibold text-blue-700 hover:underline">
                  {t('buyer.view_order_details_')}
                </span>
                {linkedShipment?.eta && (
                  <span className="text-[11px] text-gray-500 font-medium">
                    {t('buyer.eta_7')}{linkedShipment.eta}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}

        {state.procurementRequests.length === 0 && (
          <div className="py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
            <Package className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-gray-600 text-xs font-medium">
              {t('buyer.no_procurement_orders_posted_y')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
