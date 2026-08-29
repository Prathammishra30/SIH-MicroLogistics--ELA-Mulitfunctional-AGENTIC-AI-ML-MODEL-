import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Truck, ArrowLeft, Loader2, Search, CheckCircle, MapPin, Calendar, Package } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import type { LogisticsRequest, MarketOpportunity } from '../../data/mockData';
import { farmerApi } from '../../services/api';
import { useLanguage } from "../../context/LanguageContext";

export const FarmerLogisticsRequest: React.FC = () => {
    const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useSharedContext();
  
  const marketState = location.state?.market as MarketOpportunity | undefined;
  const procurementState = location.state?.procurement as { id: string; product: string; quantity: string; destination: string } | undefined;
  const matchingProcurement = state.procurementRequests.find(
    (pr) => pr.id === procurementState?.id || (marketState && (pr.id === marketState.id || pr.id === marketState.procurementId))
  );

  const [formData, setFormData] = useState(() => ({
    product: procurementState?.product || marketState?.demandItem || '',
    quantity: procurementState?.quantity || marketState?.quantityRequired || '',
    pickupLocation: 'Baramati Farm Gate',
    destination: procurementState?.destination || marketState?.buyer || 'Pune APMC Mandi',
    pickupDate: new Date().toISOString().split('T')[0],
    vehicleRequirement: 'Mini Truck / Bolero Pickup'
  }));

  const [isSearching, setIsSearching] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setMatchFound(false);
    
    setTimeout(() => {
      setIsSearching(false);
      setMatchFound(true);
    }, 800);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const selectedProduct = state.products.find(
        (p) => p.name.toLowerCase() === formData.product.toLowerCase()
      );
      
      let createdDelivery: LogisticsRequest;
      try {
        const remote = await farmerApi.createLogistics({
          productName: formData.product,
          productId: selectedProduct?.id,
          quantity: formData.quantity,
          pickupLocation: formData.pickupLocation,
          destination: formData.destination,
          estimatedEarnings: '₹1,850',
          procurementRequestId: matchingProcurement?.id,
        });

        createdDelivery = {
          id: remote.id,
          productName: remote.productName,
          quantity: remote.quantity || formData.quantity,
          pickupLocation: remote.pickupLocation || formData.pickupLocation,
          estimatedEarnings: remote.estimatedEarnings || '₹1,850',
          status: (remote.status as LogisticsRequest['status']) || 'Searching',
          driver: remote.driver || null,
          vehicle: remote.vehicle || null,
          destination: remote.destination,
          eta: remote.eta || null,
          timeline: [
            { status: 'Request Created', time: 'Just now', completed: true },
            { status: 'Transport Match', time: 'In progress', completed: false },
            { status: 'Pickup Scheduled', time: 'Pending', completed: false },
            { status: 'In Transit', time: 'Pending', completed: false },
            { status: 'Delivered', time: 'Pending', completed: false }
          ],
          procurementRequestId: remote.procurementRequestId || matchingProcurement?.id,
        };
      } catch {
        const fallbackId = `RF-00${Math.floor(100 + Math.random() * 900)}`;
        createdDelivery = {
          id: fallbackId,
          productName: formData.product,
          quantity: formData.quantity,
          pickupLocation: formData.pickupLocation,
          estimatedEarnings: '₹1,850',
          status: 'Searching',
          driver: null,
          vehicle: null,
          destination: formData.destination,
          eta: null,
          timeline: [
            { status: 'Request Created', time: 'Just now', completed: true },
            { status: 'Transport Match', time: 'In progress', completed: false },
            { status: 'Pickup Scheduled', time: 'Pending', completed: false },
            { status: 'In Transit', time: 'Pending', completed: false },
            { status: 'Delivered', time: 'Pending', completed: false }
          ],
          procurementRequestId: matchingProcurement?.id,
        };
      }

      dispatch({ type: 'CREATE_DELIVERY', payload: createdDelivery });
      
      if (matchingProcurement) {
        dispatch({
          type: 'UPDATE_PROCUREMENT',
          payload: { id: matchingProcurement.id, status: 'Logistics Requested' }
        });
      }

      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Logistics request for ${formData.product} has been broadcast to regional transporters.`,
          type: 'success'
        }
      });

      navigate(`/farmer/deliveries/${createdDelivery.id}`);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <button
          onClick={() => navigate('/farmer/dashboard')}
          className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-700" />
            {t('farmer.book_rural_logistics')}</h1>
          <p className="text-xs text-gray-500">{t('farmer.request_shared_vehicle_capacit')}</p>
        </div>
      </header>

      {/* Main Form */}
      <form onSubmit={handleSearch} className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-5">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('farmer.produce_cargo_item_')}</label>
              <div className="relative">
                <Package className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  placeholder={t('farmer.eg_tomatoes_onions_mangoes')}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('farmer.quantity_to_move_')}</label>
              <input
                type="text"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder={t('farmer.eg_500_kg_12_mt')}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('farmer.farm_pickup_location_')}</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-green-700 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                  placeholder={t('farmer.eg_village_baramati_farm_gate')}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('farmer.drop_mandi_destination_')}</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-amber-700 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder={t('farmer.eg_pune_apmc_market_yard')}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('farmer.ready_pickup_date')}</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('farmer.recommended_vehicle_category')}</label>
              <select
                value={formData.vehicleRequirement}
                onChange={(e) => setFormData({ ...formData, vehicleRequirement: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
              >
                <option value="Mini Truck / Bolero Pickup">{t('farmer.mini_truck_bolero_pickup_15_25')}</option>
                <option value="Tata Ace (750 kg)">{t('farmer.tata_ace_750_kg')}</option>
                <option value="Medium Goods Carrier (3.5 MT)">{t('auth.medium_goods_carrier_35_mt')}</option>
                <option value="Three Wheeler Cargo (500 kg)">{t('auth.three_wheeler_cargo_500_kg')}</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="w-full py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('farmer.scanning_active_transporter_fl')}</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>{t('farmer.find_nearby_vehicle_matches')}</span>
            </>
          )}
        </button>
      </form>

      {/* Match Found Card */}
      {matchFound && (
        <div className="p-6 rounded-2xl bg-white border border-green-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-[#2E7D32]">
            <CheckCircle className="w-5 h-5" />
            <h3 className="text-sm font-bold text-gray-900">{t('farmer.nearby_return_vehicle_capacity')}</h3>
          </div>

          <div className="p-4 rounded-xl bg-[#E8F5E9]/50 border border-green-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('farmer.available_vehicle')}</span>
              <strong className="text-gray-900">{t('farmer.mahindra_bolero_maxi_truck_mh1')}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('farmer.route_match')}</span>
              <span className="text-gray-900 font-medium">{t('farmer.baramati_pune_highway')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('farmer.estimated_transport_fare')}</span>
              <strong className="text-[#2E7D32] text-sm font-mono">{t('farmer.1850_shared_rate')}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('farmer.broadcasting_to_fleet')}</span>
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                <span>{t('farmer.confirm_broadcast_logistics_re')}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
