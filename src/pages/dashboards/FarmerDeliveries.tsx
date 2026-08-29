import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, Search, Clock, MapPin, Plus } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from "../../context/LanguageContext";

export const FarmerDeliveries: React.FC = () => {
    const { t } = useLanguage();
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDeliveries = state.logisticsRequests.filter(
    (req) =>
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/farmer/dashboard')}
            className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            title={t('farmer.back_to_dashboard')}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-700" />
              {t('farmer.active_shipments_deliveries')}</h1>
            <p className="text-xs text-gray-500">{t('farmer.track_and_manage_your_agricult')}</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/farmer/logistics')}
          className="px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('farmer.new_transport_request')}</span>
        </button>
      </header>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t('farmer.search_by_shipment_id_product_')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-100 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-all"
        />
      </div>

      {/* Shipments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredDeliveries.map((req) => (
          <div
            key={req.id}
            onClick={() => navigate(`/farmer/deliveries/${req.id}`)}
            className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-2xs hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between space-y-4 group"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5 block font-mono">
                    {t('farmer.shipment_')}{req.id}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#2E7D32] transition-colors">
                    {req.productName} ({req.quantity || 'Load'})
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    req.status === 'Delivered'
                      ? 'bg-[#E8F5E9] text-[#2E7D32] border-green-200'
                      : req.status === 'In Transit'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : req.status === 'Assigned'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {req.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100 text-xs">
              <div className="space-y-0.5">
                <span className="text-gray-400 text-[10px] font-semibold uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-700" /> {t('farmer.destination_2')}</span>
                <p className="text-gray-900 font-medium truncate">{req.destination}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-gray-400 text-[10px] font-semibold uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-600" /> {t('farmer.eta')}</span>
                <p className="text-gray-900 font-medium truncate">{req.eta || 'Calculating...'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
                  {req.driver ? req.driver.charAt(0) : '?'}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-900">{req.driver || 'Awaiting Driver'}</span>
                  <span className="text-[10px] text-gray-500">{req.vehicle || 'Vehicle Pending'}</span>
                </div>
              </div>

              <span className="text-xs font-semibold text-[#2E7D32] group-hover:underline">
                {t('farmer.view_tracking_')}</span>
            </div>
          </div>
        ))}

        {filteredDeliveries.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
            <Truck className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-gray-600 text-xs font-medium">{t('farmer.no_active_crop_shipments_found')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
