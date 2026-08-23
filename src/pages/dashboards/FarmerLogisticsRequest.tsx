import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, ArrowLeft, Loader2, Search, CheckCircle } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import type { LogisticsRequest, MarketOpportunity } from '../../data/mockData';

export const FarmerLogisticsRequest: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useSharedContext();
  
  const marketState = location.state?.market as MarketOpportunity | undefined;
  const procurementState = location.state?.procurement as { id: string; product: string; quantity: string; destination: string } | undefined;
  const matchingProcurement = state.procurementRequests.find(
    pr => pr.id === procurementState?.id || (marketState && pr.id === marketState.id)
  );

  const [formData, setFormData] = useState(() => ({
    product: procurementState?.product || marketState?.demandItem || '',
    quantity: procurementState?.quantity || marketState?.quantityRequired || '',
    pickupLocation: 'Village A',
    destination: procurementState?.destination || marketState?.buyer || '',
    pickupDate: '',
    vehicleRequirement: 'Any'
  }));

  const [isSearching, setIsSearching] = useState(false);
  const [matchFound, setMatchFound] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setMatchFound(false);
    
    // Simulate finding a transport match
    setTimeout(() => {
      setIsSearching(false);
      setMatchFound(true);
    }, 1500);
  };

  const handleConfirm = () => {
    const newDeliveryId = `RF-00${Math.floor(100 + Math.random() * 900)}`;
    const newDelivery: LogisticsRequest = {
      id: newDeliveryId,
      productName: `${formData.product}`,
      quantity: formData.quantity,
      pickupLocation: formData.pickupLocation,
      estimatedEarnings: '₹1,850', // Mock value for Phase 3B
      status: 'Searching',
      driver: null,
      vehicle: null,
      destination: formData.destination,
      eta: null,
      timeline: [
        { status: 'Request Created', time: 'Just now', completed: true },
        { status: 'Vehicle Assigned', time: 'Pending', completed: false },
        { status: 'At Pickup', time: 'Pending', completed: false },
        { status: 'Picked Up', time: 'Pending', completed: false },
        { status: 'In Transit', time: 'Pending', completed: false },
        { status: 'Delivered', time: 'Pending', completed: false }
      ],
      procurementRequestId: matchingProcurement?.id
    };

    dispatch({ type: 'CREATE_DELIVERY', payload: newDelivery });

    if (matchingProcurement) {
      dispatch({
        type: 'UPDATE_PROCUREMENT',
        payload: {
          id: matchingProcurement.id,
          status: 'Logistics Requested',
          logisticsRequestId: newDeliveryId,
          farmerName: 'Ramesh Patel'
        }
      });
    }

    dispatch({ 
      type: 'ADD_NOTIFICATION', 
      payload: { message: `Logistics request created and assigned successfully to shipment ${newDelivery.id}.`, type: 'success' } 
    });
    
    navigate('/farmer/deliveries');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full relative z-10">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/farmer/dashboard')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-sky-400" />
            Create Logistics Request
          </h1>
          <p className="text-sm text-slate-400">Book transport for your products to market.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSearch} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Select Product</label>
              <select 
                value={formData.product}
                onChange={(e) => setFormData({...formData, product: e.target.value})}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors appearance-none"
              >
                <option value="">-- Choose Product --</option>
                {state.products.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
                {marketState && !state.products.find(p => p.name === marketState.demandItem) && (
                   <option value={marketState.demandItem}>{marketState.demandItem}</option>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Quantity</label>
              <input 
                type="text" 
                required
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                placeholder="e.g., 500 kg" 
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Pickup Location</label>
                <input 
                  type="text" 
                  required
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({...formData, pickupLocation: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Destination</label>
                <input 
                  type="text" 
                  required
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Pickup Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.pickupDate}
                  onChange={(e) => setFormData({...formData, pickupDate: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Vehicle Requirement</label>
                <select 
                  value={formData.vehicleRequirement}
                  onChange={(e) => setFormData({...formData, vehicleRequirement: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors appearance-none"
                >
                  <option value="Any">Any Suitable Vehicle</option>
                  <option value="Cold Storage">Cold Storage Truck</option>
                  <option value="Open Carrier">Open Carrier</option>
                </select>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSearching || matchFound}
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : matchFound ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Transport Match Found
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Find Transport
              </>
            )}
          </button>
        </form>

        <div>
          <AnimatePresence>
            {matchFound && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex flex-col gap-6"
              >
                <div className="flex items-center gap-3 border-b border-sky-500/20 pb-4">
                  <div className="p-3 rounded-full bg-sky-500/20 text-sky-400">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Potential Transport Match</h3>
                    <p className="text-sm text-sky-400">Optimal vehicle found nearby</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Vehicle Type</span>
                    <span className="text-sm font-semibold text-white">Medium Goods Carrier</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Available Capacity</span>
                    <span className="text-sm font-semibold text-white">700 kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Estimated Distance</span>
                    <span className="text-sm font-semibold text-white">18 km</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Estimated Cost</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">₹1,850</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Availability</span>
                    <span className="text-sm font-semibold text-sky-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Available Now
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleConfirm}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors mt-2"
                >
                  Confirm Transport
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!matchFound && !isSearching && (
            <div className="h-full border border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 p-8 text-center text-sm">
              Fill out the request form and click "Find Transport" to match with available drivers on the RuralFlow network.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
