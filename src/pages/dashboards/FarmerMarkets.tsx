import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowLeft, MapPin, Search, X, Truck, Store } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import type { MarketOpportunity } from '../../data/mockData';
import { useLanguage } from "../../context/LanguageContext";

export const FarmerMarkets: React.FC = () => {
    const { t } = useLanguage();
  const navigate = useNavigate();
  const { state, dispatch } = useSharedContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<
    (MarketOpportunity & { isLiveBuyer?: boolean; procurementId?: string }) | null
  >(null);

  // Convert open buyer procurement requests into live market opportunities
  const buyerOpportunities = state.procurementRequests
    .filter((pr) => pr.status === 'Open' || pr.status === 'Fulfilling')
    .map((pr) => ({
      id: pr.id,
      demandItem: pr.product,
      buyer: `${pr.buyerName} • ${pr.destination}`,
      price: pr.targetPrice,
      quantityRequired: pr.quantity,
      distance: 'Direct APMC Demand',
      logisticsAvailable: true,
      matchScore: 99,
      isLiveBuyer: true,
      procurementId: pr.id,
    }));

  const allOpportunities = [...buyerOpportunities, ...state.marketOpportunities];

  const filteredMarkets = allOpportunities.filter(
    (m) =>
      m.demandItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.buyer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFulfillDemand = () => {
    if (!selectedMarket) return;

    const matchingPr = state.procurementRequests.find(
      (pr) => pr.id === selectedMarket.id || pr.id === selectedMarket.procurementId
    );

    if (matchingPr) {
      dispatch({
        type: 'UPDATE_PROCUREMENT',
        payload: {
          id: matchingPr.id,
          status: 'Fulfilling',
          farmerName: state.auth.user?.name || 'Farmer',
        },
      });

      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Fulfilling demand ${matchingPr.id} for ${matchingPr.product}. Proceeding to transport booking.`,
          type: 'info',
        },
      });
    }

    navigate('/farmer/logistics', {
      state: {
        market: selectedMarket,
        procurement: matchingPr || {
          id: selectedMarket.id,
          product: selectedMarket.demandItem,
          quantity: selectedMarket.quantityRequired,
          destination: selectedMarket.buyer,
        },
      },
    });
  };

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
              <TrendingUp className="w-5 h-5 text-blue-700" />
              {t('farmer.market_demand_opportunities')}</h1>
            <p className="text-xs text-gray-500">
              {t('farmer.discover_verified_buyer_procur')}</p>
          </div>
        </div>
      </header>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t('farmer.search_by_crop_name_or_buyer_l')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-100 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-all"
        />
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMarkets.map((market) => (
          <div
            key={market.id}
            onClick={() => setSelectedMarket(market)}
            className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    market.isLiveBuyer
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-[#E8F5E9] text-[#2E7D32] border-green-200'
                  }`}
                >
                  {market.isLiveBuyer ? 'Live Buyer Order' : 'Regional Mandi'}
                </span>
                <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  {market.distance}
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-1">{market.demandItem}</h3>
              <p className="text-xs text-gray-500 line-clamp-1">{market.buyer}</p>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{t('farmer.target_rate')}</span>
                <strong className="text-gray-900 font-bold">{market.price}</strong>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{t('farmer.required_qty')}</span>
                <strong className="text-gray-900 font-mono">{market.quantityRequired}</strong>
              </div>

              <button
                type="button"
                className="w-full py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <span>{t('farmer.view_details_fulfill')}</span>
              </button>
            </div>
          </div>
        ))}

        {filteredMarkets.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-gray-200 rounded-2xl bg-white">
            <Store className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-xs font-medium">{t('farmer.no_market_demand_items_found_m')}</p>
          </div>
        )}
      </div>

      {/* Selected Market Modal */}
      {selectedMarket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedMarket.isLiveBuyer ? 'Commercial Procurement' : 'Mandi Opportunity'}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{selectedMarket.demandItem}</h3>
              </div>
              <button
                onClick={() => setSelectedMarket(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{t('farmer.target_offering')}</span>
                <strong className="text-gray-900 font-bold">{selectedMarket.price}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{t('farmer.volume_required')}</span>
                <strong className="text-gray-900 font-mono">{selectedMarket.quantityRequired}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{t('farmer.procuring_buyer')}</span>
                <span className="text-gray-900 font-medium text-right max-w-[200px] truncate">{selectedMarket.buyer}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSelectedMarket(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('farmer.close')}</button>
              <button
                onClick={handleFulfillDemand}
                className="flex-1 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{t('farmer.supply_book_transport')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
