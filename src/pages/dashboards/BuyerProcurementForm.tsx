import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Search, CheckCircle, Store, MapPin, Calendar, Package } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import type { ProcurementRequest } from '../../data/mockData';
import { buyerApi } from '../../services/api';
import { useLanguage } from "../../context/LanguageContext";

export const BuyerProcurementForm: React.FC = () => {
    const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state as { product?: string; quantity?: string; destination?: string } | undefined;
  const { state, dispatch } = useSharedContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState(() => ({
    product: prefill?.product || '',
    quantity: prefill?.quantity || '',
    targetPrice: '₹35 / kg',
    destination: prefill?.destination || 'Navi Mumbai APMC Mandi',
    requiredBy: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  }));

  const [step, setStep] = useState<'form' | 'matching'>('form');
  const [matchedProducts, setMatchedProducts] = useState<typeof state.products>([]);

  const handleFindMatches = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product || !formData.quantity || !formData.destination) return;
    
    const matches = state.products.filter(
      (p) => p.status === 'Available' && p.name.toLowerCase().includes(formData.product.toLowerCase())
    );
    setMatchedProducts(matches);
    setStep('matching');
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      let createdProc: ProcurementRequest;
      try {
        const remote = await buyerApi.createProcurement({
          product: formData.product,
          quantity: formData.quantity,
          targetPrice: formData.targetPrice || 'Market Price',
          destination: formData.destination,
          requiredBy: formData.requiredBy || 'Flexible',
        });

        createdProc = {
          id: remote.id,
          product: remote.product,
          quantity: remote.quantity,
          targetPrice: remote.targetPrice,
          destination: remote.destination,
          requiredBy: remote.requiredBy,
          buyerName: remote.buyerName || state.auth.user?.name || 'Commercial Buyer',
          farmerName: remote.farmerName || undefined,
          status: (remote.status as ProcurementRequest['status']) || 'Open',
          logisticsRequestId: remote.logisticsRequestId || null,
          createdAt: remote.createdAt || new Date().toISOString(),
        };
      } catch {
        const fallbackId = `PR-${Math.floor(1000 + Math.random() * 9000)}`;
        createdProc = {
          id: fallbackId,
          product: formData.product,
          quantity: formData.quantity,
          targetPrice: formData.targetPrice || 'Market Price',
          destination: formData.destination,
          requiredBy: formData.requiredBy || 'Flexible',
          buyerName: state.auth.user?.name || 'Commercial Buyer',
          status: 'Open',
          logisticsRequestId: null,
          createdAt: new Date().toISOString(),
        };
      }

      dispatch({ type: 'CREATE_PROCUREMENT', payload: createdProc });
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { message: `Procurement request ${createdProc.id} created for ${createdProc.product}.`, type: 'success' },
      });

      navigate('/buyer/orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <button
          onClick={() => navigate('/buyer/dashboard')}
          className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-700" />
            {t('buyer.post_bulk_crop_procurement')}</h1>
          <p className="text-xs text-gray-500">
            {t('buyer.broadcast_wholesale_crop_requi')}</p>
        </div>
      </header>

      {/* Main Form */}
      <form onSubmit={handleFindMatches} className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-5">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('buyer.produce_commodity_needed_')}</label>
              <div className="relative">
                <Package className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  placeholder={t('buyer.eg_organic_tomatoes_alphonso_m')}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('buyer.target_procurement_volume_')}</label>
              <input
                type="text"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder={t('buyer.eg_5_mt_2000_kg_100_crates')}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('buyer.target_offering_price_rate')}</label>
              <input
                type="text"
                value={formData.targetPrice}
                onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                placeholder={t('buyer.eg_35_kg_market_mandi_rate')}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('buyer.delivery_deadline_required_by')}</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={formData.requiredBy}
                  onChange={(e) => setFormData({ ...formData, requiredBy: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('buyer.delivery_warehouse_apmc_destin')}</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-blue-700 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder={t('buyer.eg_navi_mumbai_apmc_mandi_pune')}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>{t('buyer.scan_available_farmer_inventor')}</span>
        </button>
      </form>

      {/* Match Result & Confirm */}
      {step === 'matching' && (
        <div className="p-6 rounded-2xl bg-white border border-blue-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-gray-900">{t('buyer.procurement_broadcast_ready')}</h3>
            </div>
            <span className="text-xs text-gray-500">
              {matchedProducts.length} {t('buyer.matching_farm_harvests_discove')}</span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('buyer.product_8')}</span>
              <strong className="text-gray-900">{formData.product} ({formData.quantity})</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('farmer.target_rate')}</span>
              <span className="text-blue-700 font-bold">{formData.targetPrice}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('farmer.destination')}</span>
              <span className="text-gray-900 font-medium">{formData.destination}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isSubmitting ? 'Publishing Order...' : 'Confirm & Publish Procurement Demand'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
