import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ArrowLeft, MapPin, Search, X, CheckCircle, Truck } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import type { MarketOpportunity } from '../../data/mockData';

export const FarmerMarkets: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useSharedContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<(MarketOpportunity & { isLiveBuyer?: boolean; procurementId?: string }) | null>(null);

  // Convert open & fulfilling buyer procurement requests into live market opportunities
  const buyerOpportunities = state.procurementRequests
    .filter(pr => pr.status === 'Open' || pr.status === 'Fulfilling')
    .map(pr => ({
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

  const filteredMarkets = allOpportunities.filter(m => 
    m.demandItem.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.buyer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFulfillDemand = () => {
    if (!selectedMarket) return;

    const matchingPr = state.procurementRequests.find(pr => pr.id === selectedMarket.id || pr.id === selectedMarket.procurementId);

    if (matchingPr) {
      // Mark as fulfilling by Farmer
      dispatch({
        type: 'UPDATE_PROCUREMENT',
        payload: {
          id: matchingPr.id,
          status: 'Fulfilling',
          farmerName: 'Ramesh Patel'
        }
      });

      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Fulfilling demand ${matchingPr.id} for ${matchingPr.product}. Proceeding to transport booking.`,
          type: 'info'
        }
      });
    }

    navigate('/farmer/logistics', {
      state: {
        market: selectedMarket,
        procurement: matchingPr || {
          id: selectedMarket.id,
          product: selectedMarket.demandItem,
          quantity: selectedMarket.quantityRequired,
          destination: selectedMarket.buyer
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/farmer/dashboard')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-amber-400" />
              Market Opportunities & Buyer Demand
            </h1>
            <p className="text-sm text-slate-400">Discover live commercial buyer procurement orders and regional Mandi signals.</p>
          </div>
        </div>
      </header>

      <div className="mb-6 relative">
        <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search opportunities by produce name or buyer..." 
          className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
        />
      </div>

      <div className="space-y-4">
        {filteredMarkets.map((market, idx) => (
          <motion.div 
            key={market.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-5 sm:p-6 rounded-2xl bg-slate-900/80 border ${
              market.isLiveBuyer 
                ? 'border-violet-500/40 hover:border-violet-500/80 bg-violet-950/10' 
                : 'border-slate-800 hover:border-amber-500/30'
            } transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer`}
            onClick={() => setSelectedMarket(market)}
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between sm:justify-start gap-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {market.demandItem}
                </h3>
                {market.isLiveBuyer ? (
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Live Buyer Demand • {market.id}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {market.matchScore}% Match
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-500" /> {market.buyer} • {market.distance}
              </p>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-2">
                <span>Requires: <strong className="text-slate-300">{market.quantityRequired}</strong></span>
                <span>Logistics: <strong className={market.logisticsAvailable ? 'text-emerald-400' : 'text-slate-400'}>{market.logisticsAvailable ? 'Ready for Booking' : 'Required'}</strong></span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-3 sm:gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-6">
              <div className="flex flex-col sm:items-end">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Offered Price</span>
                <span className="text-2xl font-bold text-white font-mono">{market.price}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMarket(market);
                }}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                  market.isLiveBuyer
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                }`}
              >
                {market.isLiveBuyer ? 'Fulfill Demand →' : 'View Details'}
              </button>
            </div>
          </motion.div>
        ))}
        {filteredMarkets.length === 0 && (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400">
            No market opportunities found.
          </div>
        )}
      </div>

      {/* Modal for Market Details */}
      <AnimatePresence>
        {selectedMarket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setSelectedMarket(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className={`w-5 h-5 ${selectedMarket.isLiveBuyer ? 'text-violet-400' : 'text-amber-400'}`} />
                    <h2 className="text-xl font-bold text-white">{selectedMarket.demandItem}</h2>
                  </div>
                  <p className="text-sm text-slate-400">
                    {selectedMarket.isLiveBuyer ? 'Commercial Buyer Procurement Demand' : 'High Demand Opportunity'}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedMarket(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-3.5">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-sm text-slate-400">Buyer / Destination</span>
                  <span className="text-sm font-semibold text-white">{selectedMarket.buyer}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-sm text-slate-400">Quality Grade</span>
                  <span className="text-sm font-semibold text-emerald-400">Grade A / Commercial Standard</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-sm text-slate-400">Target Price</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">{selectedMarket.price}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-sm text-slate-400">Required Quantity</span>
                  <span className="text-sm font-semibold text-white">{selectedMarket.quantityRequired}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-sm text-slate-400">Required By</span>
                  <span className="text-sm font-semibold text-slate-300">
                    {state.procurementRequests.find(pr => pr.id === selectedMarket.id || pr.id === selectedMarket.procurementId)?.requiredBy || 'Tomorrow, 5:00 PM'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-sm text-slate-400">Fulfillment Status</span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {state.procurementRequests.find(pr => pr.id === selectedMarket.id || pr.id === selectedMarket.procurementId)?.status || 'Open / Ready'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-slate-400">Transport Availability</span>
                  <span className="text-sm font-semibold text-sky-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Ready for Request
                  </span>
                </div>
              </div>

              <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex flex-col gap-3">
                <button 
                  onClick={handleFulfillDemand}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                    selectedMarket.isLiveBuyer
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  {selectedMarket.isLiveBuyer ? 'Fulfill Demand & Book Logistics' : 'Create Logistics Request'}
                </button>
                <button 
                  onClick={() => setSelectedMarket(null)}
                  className="w-full py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
