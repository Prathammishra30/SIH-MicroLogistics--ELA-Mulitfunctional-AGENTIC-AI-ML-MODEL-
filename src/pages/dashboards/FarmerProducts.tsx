import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Plus, Sprout, Search, Truck } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const FarmerProducts: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = state.products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/farmer/dashboard')}
            className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#2E7D32]" />
              My Products
            </h1>
            <p className="text-xs text-gray-500">Manage your farm produce and harvested crop inventory.</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/farmer/products/new')}
          className="px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Produce</span>
        </button>
      </header>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search products by crop name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-100 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-all"
        />
      </div>

      {/* Product Cards Grid */}
      {state.products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] border border-green-200 flex items-center justify-center text-[#2E7D32]">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      product.status === 'Available'
                        ? 'bg-[#E8F5E9] text-[#2E7D32] border-green-200'
                        : product.status === 'In Transit'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {product.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-0.5">{product.name}</h3>
                <p className="text-xs text-gray-500">
                  {product.category} • Grade {product.grade}
                </p>
                {product.harvestDate && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Harvested: {product.harvestDate}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Available Quantity:</span>
                  <span className="text-gray-900 font-bold font-mono">{product.quantity}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Expected Rate:</span>
                  <span className="text-[#2E7D32] font-semibold">Direct Farm Gate</span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/farmer/logistics')}
                  className="w-full py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Book Transport</span>
                </button>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-gray-200 rounded-2xl bg-white">
              <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-xs font-medium">No produce items found matching your search query.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#E8F5E9] border border-green-200 flex items-center justify-center text-[#2E7D32] mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">No Produce Listed Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Start by listing your harvested crops so buyers and local transporters can discover your farm produce.
            </p>
          </div>
          <button
            onClick={() => navigate('/farmer/products/new')}
            className="px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>List Your First Crop</span>
          </button>
        </div>
      )}
    </div>
  );
};
