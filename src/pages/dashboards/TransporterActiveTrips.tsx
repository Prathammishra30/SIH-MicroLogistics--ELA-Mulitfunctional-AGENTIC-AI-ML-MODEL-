import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, MapPin } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from "../../context/LanguageContext";

export const TransporterActiveTrips: React.FC = () => {
    const { t } = useLanguage();
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const activeTrips = state.logisticsRequests.filter(
    (req) => req.status !== 'Searching' && req.status !== 'Delivered'
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <header className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <button
          onClick={() => navigate('/transporter/dashboard')}
          className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          title={t('farmer.back_to_dashboard')}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-700" />
            {t('transporter.active_dispatched_trips')}</h1>
          <p className="text-xs text-gray-500">{t('transporter.live_active_crop_shipments_cur')}</p>
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeTrips.map((trip) => (
          <div
            key={trip.id}
            onClick={() => navigate(`/transporter/active/${trip.id}`)}
            className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {trip.status}
                </span>
                <span className="text-[10px] font-mono text-gray-400 font-bold">#{trip.id}</span>
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-2">{trip.productName}</h3>

              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-green-700 shrink-0" />
                  <span className="truncate">{t('transporter.from')}{trip.pickupLocation || 'Farm Gate'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="truncate">{t('transporter.to')}{trip.destination}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">{t('transporter.vehicle')}{trip.vehicle || 'Assigned'}</span>
              <span className="text-xs font-semibold text-amber-800">
                {t('transporter.update_status_')}</span>
            </div>
          </div>
        ))}

        {activeTrips.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
            <Truck className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-gray-600 text-xs font-medium">{t('transporter.no_active_trips_currently_in_t')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
