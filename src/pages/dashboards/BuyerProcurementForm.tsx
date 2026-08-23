import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Search, Sparkles, CheckCircle } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import type { ProcurementRequest } from '../../data/mockData';

export const BuyerProcurementForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state as { product?: string; quantity?: string; destination?: string } | undefined;
  const { state, dispatch } = useSharedContext();

  const [formData, setFormData] = useState(() => ({
    product: prefill?.product || '',
    quantity: prefill?.quantity || '',
    targetPrice: '',
    destination: prefill?.destination || 'Prayagraj Market',
    requiredBy: '',
  }));

  const [step, setStep] = useState<'form' | 'matching' | 'confirm'>('form');
  const [matchedProducts, setMatchedProducts] = useState<typeof state.products>([]);

  const handleFindMatches = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product || !formData.quantity || !formData.destination) return;
    
    // Deterministic match: search available products by name
    const matches = state.products.filter(
      p => p.status === 'Available' && p.name.toLowerCase().includes(formData.product.toLowerCase())
    );
    setMatchedProducts(matches);
    setStep('matching');
  };

  const handleConfirm = () => {
    const newProcurement: ProcurementRequest = {
      id: `PR-${Math.floor(1000 + Math.random() * 9000)}`,
      product: formData.product,
      quantity: formData.quantity,
      targetPrice: formData.targetPrice || 'Market Price',
      destination: formData.destination,
      requiredBy: formData.requiredBy || 'Flexible',
      buyerName: 'Rajesh Singhania',
      status: 'Open',
      logisticsRequestId: null,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'CREATE_PROCUREMENT', payload: newProcurement });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { message: `Procurement request ${newProcurement.id} created for ${newProcurement.product}.`, type: 'success' }
    });

    navigate('/buyer/orders');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full relative z-10">
      <header className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/buyer/dashboard')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-violet-400" />
            Create Procurement Request
          </h1>
          <p className="text-sm text-slate-400">Broadcast your produce demand to connected farmers.</p>
        </div>
      </header>

      {step === 'form' && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleFindMatches}
          className="space-y-6"
        >
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
            <h2 className="text-base font-bold text-white">Procurement Details</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Product / Produce Name *
              </label>
              <input
                type="text"
                required
                value={formData.product}
                onChange={e => setFormData({ ...formData, product: e.target.value })}
                placeholder="e.g. Organic Tomatoes, Red Onions, Wheat"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-slate-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Quantity Required *
                </label>
                <input
                  type="text"
                  required
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g. 500 kg, 2 MT"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-slate-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Target Price
                </label>
                <input
                  type="text"
                  value={formData.targetPrice}
                  onChange={e => setFormData({ ...formData, targetPrice: e.target.value })}
                  placeholder="e.g. ₹28/kg"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-slate-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Delivery Destination *
                </label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={e => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g. Prayagraj Market"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-slate-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Required By
                </label>
                <input
                  type="date"
                  value={formData.requiredBy}
                  onChange={e => setFormData({ ...formData, requiredBy: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
          >
            <Search className="w-4 h-4" />
            Find Matching Producers
          </button>
        </motion.form>
      )}

      {step === 'matching' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Producer Match Results
              </h2>
              <span className="text-[11px] text-violet-400 font-semibold">Demand Match</span>
            </div>

            {matchedProducts.length > 0 ? (
              <div className="space-y-3">
                {matchedProducts.map(product => (
                  <div key={product.id} className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{product.name}</span>
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Match Found
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Available: {product.quantity} • {product.grade} • Category: {product.category}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center">
                <p className="text-sm text-slate-400">No exact matches found. Your demand will be broadcast to all connected producers.</p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 text-xs text-violet-300">
              <strong>Your Procurement:</strong> {formData.product} — {formData.quantity} at {formData.targetPrice || 'Market Price'} → {formData.destination}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('form')}
              className="flex-1 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-colors shadow-lg shadow-violet-500/20"
            >
              Submit Procurement Request
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
