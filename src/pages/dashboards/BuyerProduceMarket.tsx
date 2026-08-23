import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Leaf, ShoppingCart, Tag, Calendar, Package } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const BuyerProduceMarket: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();

  const availableProducts = state.products.filter(p => p.status === 'Available');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/buyer/dashboard')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Leaf className="w-6 h-6 text-emerald-400" />
              Available Farm Produce
            </h1>
            <p className="text-sm text-slate-400">Browse produce available from connected farmers.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableProducts.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{product.name}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {product.grade}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                <span>Available: <strong className="text-slate-200">{product.quantity}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Category: <strong className="text-slate-200">{product.category}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Harvested: <strong className="text-slate-200">{product.harvestDate}</strong></span>
              </div>
            </div>

            <button
              onClick={() => navigate('/buyer/procurement', { state: { product: product.name, quantity: product.quantity } })}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Procure This Produce
            </button>
          </motion.div>
        ))}
      </div>

      {availableProducts.length === 0 && (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400">
          No produce currently available. Check back later.
        </div>
      )}
    </div>
  );
};
