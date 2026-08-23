import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ArrowLeft, Plus, Sprout, Search } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const FarmerProducts: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = state.products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));

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
              <Package className="w-6 h-6 text-emerald-400" />
              My Products
            </h1>
            <p className="text-sm text-slate-400">Manage your farm produce and batches.</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/farmer/products/new')}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </button>
      </header>

      <div className="mb-6 relative">
        <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input 
          type="text" 
          placeholder="Search products by name or category..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredProducts.map((product, idx) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                  <Sprout className="w-5 h-5" />
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  product.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                  product.status === 'In Transit' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                  'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {product.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
              <p className="text-xs text-slate-400 mb-4">{product.category} • {product.grade}</p>
            </div>
            
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-sm">
              <span className="text-slate-400">Quantity:</span>
              <span className="text-white font-semibold font-mono">{product.quantity}</span>
            </div>
          </motion.div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-2xl">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No products found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
